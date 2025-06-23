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

/**
 * Mapea un rol del sistema al actor correspondiente para consultas de asistencia personal
 */
const mapearRolAActorPersonal = (rol: RolesSistema): ActoresSistema | null => {
  switch (rol) {
    case RolesSistema.Directivo:
      return ActoresSistema.Directivo; // ✅ CORREGIDO: Directivos SÍ tienen asistencia personal
    case RolesSistema.ProfesorPrimaria:
      return ActoresSistema.ProfesorPrimaria;
    case RolesSistema.ProfesorSecundaria:
    case RolesSistema.Tutor:
      return ActoresSistema.ProfesorSecundaria;
    case RolesSistema.Auxiliar:
      return ActoresSistema.Auxiliar;
    case RolesSistema.PersonalAdministrativo:
      return ActoresSistema.PersonalAdministrativo;
    // Solo Responsables no tienen asistencia personal
    case RolesSistema.Responsable:
      return null;
    default:
      return null;
  }
};

// Función para validar permisos según rol
const validarPermisos = (
  rol: RolesSistema,
  actor: ActoresSistema,
  tipoAsistencia: TipoAsistencia,
  idODniConsulta: string | null,
  miIdODni: string,
  esConsultaPropia: boolean = false,
  grado?: string | null,
  seccion?: string | null,
  nivelEducativo?: string | null
): { esValido: boolean; mensaje?: string } => {
  switch (rol) {
    case RolesSistema.Directivo:
      // ✅ ACTUALIZADO: Los directivos pueden consultar asistencias de personal (incluida la suya)
      // PERO NO pueden consultar asistencias de estudiantes
      if (actor === ActoresSistema.Estudiante) {
        return {
          esValido: false,
          mensaje:
            "Los directivos no pueden consultar asistencias de estudiantes",
        };
      }

      // Para personal: pueden consultar cualquier personal (incluida la suya propia)
      if (tipoAsistencia !== TipoAsistencia.ParaPersonal) {
        return {
          esValido: false,
          mensaje:
            "Los directivos solo pueden consultar asistencias de personal",
        };
      }
      return { esValido: true };

    case RolesSistema.Auxiliar:
      if (actor === ActoresSistema.Estudiante) {
        // Solo estudiantes de secundaria
        if (tipoAsistencia !== TipoAsistencia.ParaEstudiantesSecundaria) {
          return {
            esValido: false,
            mensaje:
              "Los auxiliares solo pueden consultar estudiantes de secundaria",
          };
        }
        // Para estudiantes requiere nivel, grado y sección
        if (!nivelEducativo || !grado || !seccion) {
          return {
            esValido: false,
            mensaje:
              "Se requieren nivel educativo, grado y sección para consultar estudiantes",
          };
        }
      } else {
        // Para asistencia personal: si es consulta propia, permitir sin ID_o_DNI
        if (esConsultaPropia) return { esValido: true };
        // Para consulta de otros, verificar que sea su propio ID_o_DNI
        if (!idODniConsulta || idODniConsulta !== miIdODni) {
          return {
            esValido: false,
            mensaje:
              "Los auxiliares solo pueden consultar su propia asistencia de personal",
          };
        }
        // Debe ser tipo Personal
        if (tipoAsistencia !== TipoAsistencia.ParaPersonal) {
          return {
            esValido: false,
            mensaje:
              "Los auxiliares solo pueden consultar asistencia de tipo Personal",
          };
        }
      }
      return { esValido: true };

    case RolesSistema.ProfesorPrimaria:
      if (actor === ActoresSistema.Estudiante) {
        // Solo estudiantes de primaria
        if (tipoAsistencia !== TipoAsistencia.ParaEstudiantesPrimaria) {
          return {
            esValido: false,
            mensaje:
              "Los profesores de primaria solo pueden consultar estudiantes de primaria",
          };
        }
        // Para estudiantes requiere nivel, grado y sección
        if (!nivelEducativo || !grado || !seccion) {
          return {
            esValido: false,
            mensaje:
              "Se requieren nivel educativo, grado y sección para consultar estudiantes",
          };
        }
      } else {
        // Para asistencia personal: si es consulta propia, permitir sin ID_o_DNI
        if (esConsultaPropia) return { esValido: true };
        // Para consulta de otros, verificar que sea su propio ID_o_DNI
        if (!idODniConsulta || idODniConsulta !== miIdODni) {
          return {
            esValido: false,
            mensaje:
              "Los profesores de primaria solo pueden consultar su propia asistencia de personal",
          };
        }
        // Debe ser tipo Personal
        if (tipoAsistencia !== TipoAsistencia.ParaPersonal) {
          return {
            esValido: false,
            mensaje:
              "Los profesores de primaria solo pueden consultar asistencia de tipo Personal",
          };
        }
      }
      return { esValido: true };

    case RolesSistema.ProfesorSecundaria:
      if (actor === ActoresSistema.Estudiante) {
        return {
          esValido: false,
          mensaje:
            "Los profesores de secundaria no pueden consultar asistencias de estudiantes",
        };
      } else {
        // Para asistencia personal: si es consulta propia, permitir sin ID_o_DNI
        if (esConsultaPropia) return { esValido: true };
        // Para consulta de otros, verificar que sea su propio ID_o_DNI
        if (!idODniConsulta || idODniConsulta !== miIdODni) {
          return {
            esValido: false,
            mensaje:
              "Los profesores de secundaria solo pueden consultar su propia asistencia",
          };
        }
        // Debe ser tipo Personal
        if (tipoAsistencia !== TipoAsistencia.ParaPersonal) {
          return {
            esValido: false,
            mensaje:
              "Los profesores de secundaria solo pueden consultar asistencia de tipo Personal",
          };
        }
      }
      return { esValido: true };

    case RolesSistema.Tutor:
      if (actor === ActoresSistema.Estudiante) {
        // Solo estudiantes de secundaria
        if (tipoAsistencia !== TipoAsistencia.ParaEstudiantesSecundaria) {
          return {
            esValido: false,
            mensaje:
              "Los tutores solo pueden consultar estudiantes de secundaria",
          };
        }
        // Para estudiantes requiere nivel, grado y sección
        if (!nivelEducativo || !grado || !seccion) {
          return {
            esValido: false,
            mensaje:
              "Se requieren nivel educativo, grado y sección para consultar estudiantes",
          };
        }
      } else {
        // Para asistencia personal: si es consulta propia, permitir sin ID_o_DNI
        if (esConsultaPropia) return { esValido: true };
        // Para consulta de otros, verificar que sea su propio ID_o_DNI
        if (!idODniConsulta || idODniConsulta !== miIdODni) {
          return {
            esValido: false,
            mensaje:
              "Los tutores solo pueden consultar su propia asistencia de personal",
          };
        }
        // Debe ser tipo Personal
        if (tipoAsistencia !== TipoAsistencia.ParaPersonal) {
          return {
            esValido: false,
            mensaje:
              "Los tutores solo pueden consultar asistencia de tipo Personal",
          };
        }
      }
      return { esValido: true };

    case RolesSistema.PersonalAdministrativo:
      if (actor === ActoresSistema.Estudiante) {
        return {
          esValido: false,
          mensaje:
            "El personal administrativo no puede consultar asistencias de estudiantes",
        };
      } else {
        // Para asistencia personal: si es consulta propia, permitir sin ID_o_DNI
        if (esConsultaPropia) return { esValido: true };
        // Para consulta de otros, verificar que sea su propio ID_o_DNI
        if (!idODniConsulta || idODniConsulta !== miIdODni) {
          return {
            esValido: false,
            mensaje:
              "El personal administrativo solo puede consultar su propia asistencia",
          };
        }
        // Debe ser tipo Personal
        if (tipoAsistencia !== TipoAsistencia.ParaPersonal) {
          return {
            esValido: false,
            mensaje:
              "El personal administrativo solo puede consultar asistencia de tipo Personal",
          };
        }
      }
      return { esValido: true };

    case RolesSistema.Responsable:
      // Los responsables no tienen asistencia personal
      if (esConsultaPropia) {
        return {
          esValido: false,
          mensaje: "Los responsables no tienen registro de asistencia personal",
        };
      }

      if (actor !== ActoresSistema.Estudiante) {
        return {
          esValido: false,
          mensaje:
            "Los responsables solo pueden consultar asistencias de estudiantes",
        };
      }
      // Solo consultas unitarias (ID_o_DNI obligatorio)
      if (!idODniConsulta) {
        return {
          esValido: false,
          mensaje:
            "Los responsables deben especificar el ID_o_DNI del estudiante a consultar",
        };
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

    const MI_ID_O_DNI = decodedToken.ID_Usuario; // ✅ ACTUALIZADO: Para directivos: ID, para otros: DNI

    // Obtener parámetros de la consulta
    const searchParams = req.nextUrl.searchParams;
    const actorParam = searchParams.get("Actor"); // ✅ OPCIONAL
    const modoRegistroParam = searchParams.get("ModoRegistro");
    const tipoAsistenciaParam = searchParams.get(
      "TipoAsistencia"
    ) as TipoAsistencia;
    const idODniParam = searchParams.get("ID_o_DNI"); // ✅ ACTUALIZADO: Era "DNI"
    const gradoParam = searchParams.get("Grado"); // Opcional
    const seccionParam = searchParams.get("Seccion"); // Opcional
    const nivelEducativoParam = searchParams.get("NivelEducativo"); // Opcional

    // ✅ LÓGICA: Detectar si es consulta propia
    const esConsultaPropia = !actorParam;
    let actor: ActoresSistema;
    let tipoAsistenciaFinal: TipoAsistencia;

    if (esConsultaPropia) {
      // Si no se envía Actor, es consulta propia - mapear rol a actor
      const actorMapeado = mapearRolAActorPersonal(rol!);
      if (!actorMapeado) {
        return NextResponse.json(
          {
            success: false,
            message: `El rol ${rol} no tiene asistencia personal consultable`,
          },
          { status: 400 }
        );
      }
      actor = actorMapeado;
      tipoAsistenciaFinal = TipoAsistencia.ParaPersonal; // ✅ Siempre Personal para consulta propia
      console.log(`🔍 Consulta propia detectada: ${rol} → ${actor}`);
    } else {
      // Validar que Actor sea válido para consulta de otros
      if (
        !Object.values(ActoresSistema).includes(actorParam as ActoresSistema)
      ) {
        return NextResponse.json(
          { success: false, message: "El Actor proporcionado no es válido" },
          { status: 400 }
        );
      }
      actor = actorParam as ActoresSistema;

      // Para consulta de otros, TipoAsistencia es obligatorio
      if (!tipoAsistenciaParam) {
        return NextResponse.json(
          {
            success: false,
            message: "TipoAsistencia es requerido para consulta de otros",
          },
          { status: 400 }
        );
      }
      tipoAsistenciaFinal = tipoAsistenciaParam;
    }

    // Validar parámetros obligatorios
    if (!modoRegistroParam) {
      return NextResponse.json(
        {
          success: false,
          message: "Se requiere el parámetro ModoRegistro",
        },
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

    // Validar que TipoAsistencia sea válido (solo para consulta de otros)
    if (!esConsultaPropia) {
      if (
        !Object.values(TipoAsistencia).includes(
          tipoAsistenciaFinal as TipoAsistencia
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "El TipoAsistencia proporcionado no es válido",
          },
          { status: 400 }
        );
      }
    }

    // ✅ VALIDAR PERMISOS con nueva lógica
    const validacionPermisos = validarPermisos(
      rol!,
      actor,
      tipoAsistenciaFinal,
      idODniParam,
      MI_ID_O_DNI,
      esConsultaPropia,
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

    // ✅ CREAR PATRÓN DE BÚSQUEDA con lógica mejorada
    let patronBusqueda: string;
    const idODniParaBusqueda = esConsultaPropia ? MI_ID_O_DNI : idODniParam;

    if (idODniParaBusqueda) {
      // Consulta unitaria por ID_o_DNI específico (propio o de otro)
      if (
        actor === ActoresSistema.Estudiante &&
        nivelEducativoParam &&
        gradoParam &&
        seccionParam
      ) {
        patronBusqueda = `${fechaActualPeru}:${modoRegistroParam}:${actor}:${idODniParaBusqueda}:${nivelEducativoParam}:${gradoParam}:${seccionParam}`;
      } else {
        patronBusqueda = `${fechaActualPeru}:${modoRegistroParam}:${actor}:${idODniParaBusqueda}`;
      }
    } else if (
      nivelEducativoParam &&
      gradoParam &&
      seccionParam &&
      actor === ActoresSistema.Estudiante
    ) {
      // Consulta por nivel, grado y sección para estudiantes
      patronBusqueda = `${fechaActualPeru}:${modoRegistroParam}:${actor}:*:${nivelEducativoParam}:${gradoParam}:${seccionParam}`;
    } else {
      // Consulta general
      patronBusqueda = `${fechaActualPeru}:${modoRegistroParam}:${actor}:*`;
    }

    console.log(
      `🔍 Buscando claves con patrón: ${patronBusqueda} ${
        esConsultaPropia ? "(consulta propia)" : "(consulta de otros)"
      }`
    );

    // Obtener la instancia de Redis correspondiente
    const redisClientInstance = redisClient(tipoAsistenciaFinal);

    // Buscar claves
    let claves: string[];
    if (idODniParaBusqueda) {
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

      if (valor) {
        const partes = clave.split(":");
        if (partes.length >= 4) {
          const idODni = partes[3]; // ✅ ACTUALIZADO: Puede ser ID o DNI

          if (actor === ActoresSistema.Estudiante) {
            // Para estudiantes
            if (
              typeof valor === "string" &&
              Object.values(EstadosAsistencia).includes(
                valor as EstadosAsistencia
              )
            ) {
              resultados.push({
                ID_o_DNI: idODni, // ✅ ACTUALIZADO: Era "DNI"
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
                ID_o_DNI: idODni, // ✅ ACTUALIZADO: Era "DNI"
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

    // ✅ CREAR RESPUESTA con lógica mejorada
    const respuesta: ConsultarAsistenciasTomadasPorActorEnRedisResponseBody = {
      Actor: actor,
      Dia: Number(fechaActualPeru.split("-")[2]),
      Mes: Number(fechaActualPeru.split("-")[1]) as Meses,
      ModoRegistro: modoRegistroParam as ModoRegistro,
      TipoAsistencia: tipoAsistenciaFinal, // ✅ AGREGADO: Para claridad
      Resultados: idODniParaBusqueda ? resultados[0] || null : resultados, // Unitario vs múltiple
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
