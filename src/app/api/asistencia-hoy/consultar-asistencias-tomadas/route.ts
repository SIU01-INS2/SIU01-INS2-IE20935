import { NextRequest, NextResponse } from "next/server";
import { ActoresSistema } from "@/interfaces/shared/ActoresSistema";
import { ModoRegistro } from "@/interfaces/shared/ModoRegistroPersonal";
import { redisClient } from "../../../../../config/Redis/RedisClient";
import { verifyAuthToken } from "@/lib/utils/backend/auth/functions/jwtComprobations";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { obtenerFechaActualPeru } from "../../_helpers/obtenerFechaActualPeru";
import {
  AsistenciaDiariaResultado,
  ConsultarAsistenciasTomadasPorActorEnRedisResponseBody,
  TipoAsistencia,
} from "@/interfaces/shared/AsistenciaRequests";
import { Meses } from "@/interfaces/shared/Meses";
import { EstadosAsistencia } from "@/interfaces/shared/EstadosAsistenciaEstudiantes";

// Función para validar permisos según rol
const validarPermisos = (
  rol: RolesSistema,
  actor: ActoresSistema,
  tipoAsistencia: TipoAsistencia,
  dniConsulta: string | null,
  miDNI: string,
  grado?: string | null,
  seccion?: string | null,
  nivelEducativo?: string | null
): { esValido: boolean; mensaje?: string } => {
  
  switch (rol) {
    case RolesSistema.Directivo:
      // Sin restricciones
      return { esValido: true };
      
    case RolesSistema.Auxiliar:
      if (actor === ActoresSistema.Estudiante) {
        // Solo estudiantes de secundaria
        if (tipoAsistencia !== TipoAsistencia.ParaEstudiantesSecundaria) {
          return { esValido: false, mensaje: "Los auxiliares solo pueden consultar estudiantes de secundaria" };
        }
        // Para estudiantes requiere nivel, grado y sección
        if (!nivelEducativo || !grado || !seccion) {
          return { esValido: false, mensaje: "Se requieren nivel educativo, grado y sección para consultar estudiantes" };
        }
      } else {
        // Solo su propia asistencia
        if (!dniConsulta || dniConsulta !== miDNI) {
          return { esValido: false, mensaje: "Los auxiliares solo pueden consultar su propia asistencia de personal" };
        }
      }
      return { esValido: true };
      
    case RolesSistema.ProfesorPrimaria:
      if (actor === ActoresSistema.Estudiante) {
        // Solo estudiantes de primaria
        if (tipoAsistencia !== TipoAsistencia.ParaEstudiantesPrimaria) {
          return { esValido: false, mensaje: "Los profesores de primaria solo pueden consultar estudiantes de primaria" };
        }
        // Para estudiantes requiere nivel, grado y sección
        if (!nivelEducativo || !grado || !seccion) {
          return { esValido: false, mensaje: "Se requieren nivel educativo, grado y sección para consultar estudiantes" };
        }
      } else {
        // Solo su propia asistencia
        if (!dniConsulta || dniConsulta !== miDNI) {
          return { esValido: false, mensaje: "Los profesores de primaria solo pueden consultar su propia asistencia de personal" };
        }
      }
      return { esValido: true };
      
    case RolesSistema.ProfesorSecundaria:
      if (actor === ActoresSistema.Estudiante) {
        return { esValido: false, mensaje: "Los profesores de secundaria no pueden consultar asistencias de estudiantes" };
      } else {
        // Solo su propia asistencia
        if (!dniConsulta || dniConsulta !== miDNI) {
          return { esValido: false, mensaje: "Los profesores de secundaria solo pueden consultar su propia asistencia" };
        }
      }
      return { esValido: true };
      
    case RolesSistema.Tutor:
      if (actor === ActoresSistema.Estudiante) {
        // Solo estudiantes de secundaria
        if (tipoAsistencia !== TipoAsistencia.ParaEstudiantesSecundaria) {
          return { esValido: false, mensaje: "Los tutores solo pueden consultar estudiantes de secundaria" };
        }
        // Para estudiantes requiere nivel, grado y sección
        if (!nivelEducativo || !grado || !seccion) {
          return { esValido: false, mensaje: "Se requieren nivel educativo, grado y sección para consultar estudiantes" };
        }
      } else {
        // Solo su propia asistencia
        if (!dniConsulta || dniConsulta !== miDNI) {
          return { esValido: false, mensaje: "Los tutores solo pueden consultar su propia asistencia de personal" };
        }
      }
      return { esValido: true };
      
    case RolesSistema.PersonalAdministrativo:
      if (actor === ActoresSistema.Estudiante) {
        return { esValido: false, mensaje: "El personal administrativo no puede consultar asistencias de estudiantes" };
      } else {
        // Solo su propia asistencia
        if (!dniConsulta || dniConsulta !== miDNI) {
          return { esValido: false, mensaje: "El personal administrativo solo puede consultar su propia asistencia" };
        }
      }
      return { esValido: true };
      
    case RolesSistema.Responsable:
      if (actor !== ActoresSistema.Estudiante) {
        return { esValido: false, mensaje: "Los responsables solo pueden consultar asistencias de estudiantes" };
      }
      // Solo consultas unitarias (DNI obligatorio)
      if (!dniConsulta) {
        return { esValido: false, mensaje: "Los responsables deben especificar el DNI del estudiante a consultar" };
      }
      return { esValido: true };
      
    default:
      return { esValido: false, mensaje: "Rol no autorizado" };
  }
};

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const { error, rol, decodedToken } = await verifyAuthToken(req, [
      RolesSistema.Directivo,
      RolesSistema.Auxiliar,
      RolesSistema.ProfesorPrimaria,
      RolesSistema.ProfesorSecundaria,
      RolesSistema.Tutor,
      RolesSistema.Responsable,
      RolesSistema.PersonalAdministrativo,
    ]);

    if (error && !rol && !decodedToken) return error;

    const MI_DNI = decodedToken.ID_Usuario;
    
    // Obtener parámetros de la consulta
    const searchParams = req.nextUrl.searchParams;
    const actorParam = searchParams.get("Actor");
    const modoRegistroParam = searchParams.get("ModoRegistro");
    const tipoAsistenciaParam = searchParams.get("TipoAsistencia") as TipoAsistencia;
    const dniParam = searchParams.get("DNI"); // Opcional
    const gradoParam = searchParams.get("Grado"); // Opcional
    const seccionParam = searchParams.get("Seccion"); // Opcional
    const nivelEducativoParam = searchParams.get("NivelEducativo"); // Opcional

    // Validar parámetros obligatorios
    if (!actorParam || !modoRegistroParam || !tipoAsistenciaParam) {
      return NextResponse.json(
        {
          success: false,
          message: "Se requieren los parámetros Actor, ModoRegistro y TipoAsistencia",
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
    if (!Object.values(ModoRegistro).includes(modoRegistroParam as ModoRegistro)) {
      return NextResponse.json(
        {
          success: false,
          message: "El ModoRegistro proporcionado no es válido",
        },
        { status: 400 }
      );
    }

    // Validar que TipoAsistencia sea válido
    if (!Object.values(TipoAsistencia).includes(tipoAsistenciaParam as TipoAsistencia)) {
      return NextResponse.json(
        {
          success: false,
          message: "El TipoAsistencia proporcionado no es válido",
        },
        { status: 400 }
      );
    }

    const actor = actorParam as ActoresSistema;
    const tipoAsistencia = tipoAsistenciaParam;

    // Validar permisos según rol
    const validacionPermisos = validarPermisos(
      rol!,
      actor,
      tipoAsistencia,
      dniParam,
      MI_DNI,
      gradoParam,
      seccionParam,
      nivelEducativoParam
    );

    if (!validacionPermisos.esValido) {
      return NextResponse.json(
        {
          success: false,
          message: validacionPermisos.mensaje,
        },
        { status: 403 }
      );
    }

    // Obtener la fecha actual en Perú
    const fechaActualPeru = obtenerFechaActualPeru();

    // Crear patrón de búsqueda
    let patronBusqueda: string;
    
    if (dniParam) {
      // Consulta unitaria por DNI específico
      if (actor === ActoresSistema.Estudiante && nivelEducativoParam && gradoParam && seccionParam) {
        patronBusqueda = `${fechaActualPeru}:${modoRegistroParam}:${actor}:${dniParam}:${nivelEducativoParam}:${gradoParam}:${seccionParam}`;
      } else {
        patronBusqueda = `${fechaActualPeru}:${modoRegistroParam}:${actor}:${dniParam}`;
      }
    } else if (nivelEducativoParam && gradoParam && seccionParam && actor === ActoresSistema.Estudiante) {
      // Consulta por nivel, grado y sección para estudiantes
      patronBusqueda = `${fechaActualPeru}:${modoRegistroParam}:${actor}:*:${nivelEducativoParam}:${gradoParam}:${seccionParam}`;
    } else {
      // Consulta general
      patronBusqueda = `${fechaActualPeru}:${modoRegistroParam}:${actor}:*`;
    }

    console.log(`🔍 Buscando claves con patrón: ${patronBusqueda}`);

    // Obtener la instancia de Redis correspondiente
    const redisClientInstance = redisClient(tipoAsistencia);

    // Buscar claves
    let claves: string[];
    if (dniParam) {
      // Para consulta unitaria, verificar si existe la clave específica
      const existe = await redisClientInstance.exists(patronBusqueda);
      claves = existe ? [patronBusqueda] : [];
    } else {
      // Para consultas múltiples, usar keys
      claves = await redisClientInstance.keys(patronBusqueda);
    }

    console.log(`📊 Claves encontradas: ${claves.length}`, claves);

    // Procesar resultados
    const resultados: AsistenciaDiariaResultado[] = [];

    for (const clave of claves) {
      const valor = await redisClientInstance.get(clave);
      
      console.log(`🔍 Procesando clave: ${clave}, valor:`, valor);

      if (valor) {
        const partes = clave.split(":");
        if (partes.length >= 4) {
          const dni = partes[3];

          if (actor === ActoresSistema.Estudiante) {
            // Para estudiantes
            if (
              typeof valor === "string" &&
              Object.values(EstadosAsistencia).includes(valor as EstadosAsistencia)
            ) {
              resultados.push({
                DNI: dni,
                AsistenciaMarcada: true,
                Detalles: {
                  Estado: valor as EstadosAsistencia,
                },
              });
            }
          } else {
            // Para personal
            if (Array.isArray(valor) && valor.length >= 2) {
              const timestamp = parseInt(valor[0] as string);
              const desfaseSegundos = parseInt(valor[1] as string);

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
    }

    console.log(`✅ Total de resultados encontrados: ${resultados.length}`);

    // Crear la respuesta según si es consulta unitaria o múltiple
    const respuesta: ConsultarAsistenciasTomadasPorActorEnRedisResponseBody = {
      Actor: actor,
      Dia: Number(fechaActualPeru.split("-")[2]),
      Mes: Number(fechaActualPeru.split("-")[1]) as Meses,
      ModoRegistro: modoRegistroParam as ModoRegistro,
      Resultados: dniParam ? (resultados[0] || null) : resultados, // Unitario vs múltiple
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