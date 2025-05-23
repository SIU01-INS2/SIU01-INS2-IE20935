import { NextRequest, NextResponse } from "next/server";
import { ActoresSistema } from "@/interfaces/shared/ActoresSistema";
import { ModoRegistro } from "@/interfaces/shared/ModoRegistroPersonal";
import { redisClient } from "../../../../../config/Redis/RedisClient";
import { verifyAuthToken } from "@/lib/utils/backend/auth/functions/jwtComprobations";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { obtenerFechaActualPeru } from "../../_helpers/obtenerFechaActualPeru";
import {
  AsistenciaDiariaResultado,
  ConsultarAsistenciasDiariasPorActorEnRedisResponseBody,
  TipoAsistencia,
} from "@/interfaces/shared/AsistenciaRequests";
import { Meses } from "@/interfaces/shared/Meses";
import { determinarTipoAsistencia } from "../_helpers/determinarTipoAsistencia";
import { EstadosAsistencia } from "@/interfaces/shared/EstadosAsistenciaEstudiantes"; // 👈 IMPORTAR EL ENUM

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const { error } = await verifyAuthToken(req, [
      RolesSistema.Directivo,
      RolesSistema.Auxiliar,
      RolesSistema.ProfesorPrimaria,
    ]);

    if (error) return error;

    // Obtener parámetros de la consulta
    const searchParams = req.nextUrl.searchParams;
    const actorParam = searchParams.get("Actor");
    const modoRegistroParam = searchParams.get("ModoRegistro");

    // Validar parámetros
    if (!actorParam || !modoRegistroParam) {
      return NextResponse.json(
        {
          success: false,
          message: "Se requieren los parámetros Actor y ModoRegistro",
        },
        { status: 400 }
      );
    }

    // Validar que Actor sea válido
    if (!Object.values(ActoresSistema).includes(actorParam as ActoresSistema)) {
      return NextResponse.json(
        { success: false, message: "El Actor proporcionado no es válido" },
        { status: 400 }
      );
    }

    // Validar que ModoRegistro sea válido
    if (
      !Object.values(ModoRegistro).includes(modoRegistroParam as ModoRegistro)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "El ModoRegistro proporcionado no es válido",
        },
        { status: 400 }
      );
    }

    // Obtener la fecha actual en Perú
    const fechaActualPeru = obtenerFechaActualPeru();

    // Patrón para buscar claves en Redis
    const patronBusqueda = `${fechaActualPeru}:${modoRegistroParam}:${actorParam}:*`;

    console.log(`🔍 Buscando claves con patrón: ${patronBusqueda}`);

    // Determinar el tipo de asistencia basado en el actor
    const actor = actorParam as ActoresSistema;
    const tipoAsistencia = determinarTipoAsistencia(actor);

    // Obtener la instancia de Redis correspondiente
    const redisClientInstance = redisClient(tipoAsistencia);

    // Buscar todas las claves que coincidan con el patrón
    const claves = await redisClientInstance.keys(patronBusqueda);

    console.log(`📊 Claves encontradas: ${claves.length}`, claves);

    // Crear la lista de resultados
    const resultados: AsistenciaDiariaResultado[] = [];

    // Procesar cada clave encontrada
    for (const clave of claves) {
      // Obtener el valor almacenado en Redis para esta clave
      const valor = await redisClientInstance.get(clave);

      console.log(`🔍 Procesando clave: ${clave}, valor:`, valor);

      if (valor) {
        const partes = clave.split(":");
        if (partes.length >= 4) {
          const dni = partes[3]; // El DNI es el cuarto elemento en la clave

          // Verificar si es un estudiante o personal
          if (actor === ActoresSistema.Estudiante) {
            // Para estudiantes, el valor es directamente un estado del enum EstadosAsistencia
            if (typeof valor === 'string' && Object.values(EstadosAsistencia).includes(valor as EstadosAsistencia)) {
              resultados.push({
                DNI: dni,
                AsistenciaMarcada: true,
                Detalles: {
                  Estado: valor as EstadosAsistencia, // Estado del enum (A, T, F, etc.)
                },
              });
            } else {
              console.warn(`⚠️  Estado de asistencia inválido para estudiante en clave ${clave}:`, valor);
            }
          } else {
            // Para personal, el valor es un array [timestamp, desfaseSegundos]
            if (Array.isArray(valor) && valor.length >= 2) {
              // Los índices correctos son 0 y 1
              const timestamp = parseInt(valor[0] as string);
              const desfaseSegundos = parseInt(valor[1] as string);

              console.log(`📝 Datos extraídos - DNI: ${dni}, Timestamp: ${timestamp}, Desfase: ${desfaseSegundos}`);

              resultados.push({
                DNI: dni,
                AsistenciaMarcada: true,
                Detalles: {
                  Timestamp: timestamp,
                  DesfaseSegundos: desfaseSegundos,
                },
              });
            } else {
              console.warn(`⚠️  Valor inesperado para personal en clave ${clave}:`, valor);
            }
          }
        }
      }
    }

    // Si es un estudiante y no encontramos resultados en la instancia principal, 
    // probamos en la otra instancia (primaria o secundaria)
    if (actor === ActoresSistema.Estudiante && resultados.length === 0) {
      console.log("🔄 No se encontraron resultados en la instancia principal, probando en la otra...");
      
      // Probar con la otra instancia de Redis para estudiantes
      const otraInstancia = tipoAsistencia === TipoAsistencia.ParaEstudiantesSecundaria 
        ? TipoAsistencia.ParaEstudiantesPrimaria
        : TipoAsistencia.ParaEstudiantesSecundaria;
        
      const redisClientOtraInstancia = redisClient(otraInstancia);
      const clavesEnOtraInstancia = await redisClientOtraInstancia.keys(patronBusqueda);

      console.log(`📊 Claves encontradas en otra instancia: ${clavesEnOtraInstancia.length}`, clavesEnOtraInstancia);

      for (const clave of clavesEnOtraInstancia) {
        const valor = await redisClientOtraInstancia.get(clave);

        if (valor && typeof valor === 'string' && Object.values(EstadosAsistencia).includes(valor as EstadosAsistencia)) {
          const partes = clave.split(":");
          if (partes.length >= 4) {
            const dni = partes[3];

            resultados.push({
              DNI: dni,
              AsistenciaMarcada: true,
              Detalles: {
                Estado: valor as EstadosAsistencia,
              },
            });
          }
        } else {
          console.warn(`⚠️  Estado de asistencia inválido en otra instancia para clave ${clave}:`, valor);
        }
      }
    }

    console.log(`✅ Total de resultados encontrados: ${resultados.length}`);

    // Crear la respuesta
    const respuesta: ConsultarAsistenciasDiariasPorActorEnRedisResponseBody = {
      Actor: actorParam as ActoresSistema,
      Dia: Number(fechaActualPeru.split("-")[2]),
      Mes: Number(fechaActualPeru.split("-")[1]) as Meses,
      ModoRegistro: modoRegistroParam as ModoRegistro,
      Resultados: resultados,
    };

    return NextResponse.json(respuesta, { status: 200 });
  } catch (error) {
    console.error("❌ Error al consultar asistencias diarias:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}