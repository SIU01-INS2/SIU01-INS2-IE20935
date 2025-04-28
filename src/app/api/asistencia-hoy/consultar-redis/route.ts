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

export interface DetallesAsistenciaUnitariaPersonal {
  Timestamp: number;
  DesfaseSegundos: number;
}

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

    // Determinar el tipo de asistencia basado en el actor
    const actor = actorParam as ActoresSistema;
    const tipoAsistencia = determinarTipoAsistencia(actor);

    // Obtener la instancia de Redis correspondiente
    const redisClientInstance = redisClient(tipoAsistencia);

    // Buscar todas las claves que coincidan con el patrón
    const claves = await redisClientInstance.keys(patronBusqueda);

    // Crear la lista de resultados
    const resultados: AsistenciaDiariaResultado[] = [];

    // Procesar cada clave encontrada
    for (const clave of claves) {
      // Obtener el valor almacenado en Redis para esta clave
      const valor = await redisClientInstance.get(clave);

      if (valor && Array.isArray(valor) && valor.length >= 3) {
        const partes = clave.split(":");
        if (partes.length >= 4) {
          const dni = partes[3]; // El DNI es el cuarto elemento en la clave

          // Extraer timestamp y desfase del valor
          const timestamp = parseInt(valor[1] as string);
          const desfaseSegundos = parseInt(valor[2] as string);

          resultados.push({
            DNI: dni,
            AsistenciaMarcada: true,
            Detalles: {
              Timestamp: timestamp,
              DesfaseSegundos: desfaseSegundos,
            },
          });
        }
      }
    }

    // Si es un estudiante y no encontramos resultados en secundaria, probamos en primaria
    if (actor === ActoresSistema.Estudiante && resultados.length === 0) {
      // Probar con la instancia de Redis para primaria
      const redisClientPrimaria = redisClient(
        TipoAsistencia.ParaEstudiantesPrimaria
      );
      const clavesEnPrimaria = await redisClientPrimaria.keys(patronBusqueda);

      for (const clave of clavesEnPrimaria) {
        const valor = await redisClientPrimaria.get(clave);

        if (valor && Array.isArray(valor) && valor.length >= 3) {
          const partes = clave.split(":");
          if (partes.length >= 4) {
            const dni = partes[3];
            const timestamp = parseInt(valor[1] as string);
            const desfaseSegundos = parseInt(valor[2] as string);

            resultados.push({
              DNI: dni,
              AsistenciaMarcada: true,
              Detalles: {
                Timestamp: timestamp,
                DesfaseSegundos: desfaseSegundos,
              },
            });
          }
        }
      }
    }

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
    console.error("Error al consultar asistencias diarias:", error);
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
