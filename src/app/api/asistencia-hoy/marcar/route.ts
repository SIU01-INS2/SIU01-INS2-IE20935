import { NextRequest, NextResponse } from "next/server";
import { EstadosAsistencia } from "@/interfaces/shared/EstadosAsistenciaEstudiantes";
import { ActoresSistema } from "@/interfaces/shared/ActoresSistema";
import {
  RegistrarAsistenciaIndividualRequestBody,
  RegistrarAsistenciaIndividualSuccessResponse,
} from "@/interfaces/shared/apis/api01/asistencia/types";
import { validateDNI } from "@/lib/helpers/validators/data/validateDNI";
import {
  PermissionErrorTypes,
  RequestErrorTypes,
  SystemErrorTypes,
} from "@/interfaces/shared/errors";
import { redisClient } from "../../../../../config/Redis/RedisClient";
import { ErrorResponseAPIBase } from "@/interfaces/shared/apis/types";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { TipoAsistencia } from "@/interfaces/shared/AsistenciaRequests";
import { HORA_MAXIMA_EXPIRACION_PARA_REGISTROS_EN_REDIS } from "@/constants/expirations";
import {
  obtenerFechaActualPeru,
  obtenerFechaHoraActualPeru,
} from "../../_helpers/obtenerFechaActualPeru";
import { verifyAuthToken } from "@/lib/utils/backend/auth/functions/jwtComprobations";

// Constantes de configuración
const MINUTOS_TOLERANCIA = 5; // 5 minutos de tolerancia para considerar llegada temprana

/**
 * Mapea un rol del sistema al actor correspondiente para registro de asistencia personal
 */
const mapearRolAActorPersonal = (rol: RolesSistema): ActoresSistema | null => {
  switch (rol) {
    case RolesSistema.Directivo:
      return ActoresSistema.Directivo;
    case RolesSistema.ProfesorPrimaria:
      return ActoresSistema.ProfesorPrimaria;
    case RolesSistema.ProfesorSecundaria:
    case RolesSistema.Tutor:
      return ActoresSistema.ProfesorSecundaria;
    case RolesSistema.Auxiliar:
      return ActoresSistema.Auxiliar;
    case RolesSistema.PersonalAdministrativo:
      return ActoresSistema.PersonalAdministrativo;
    // Responsables no tienen asistencia personal
    case RolesSistema.Responsable:
      return null;
    default:
      return null;
  }
};

// Función para validar permisos de registro según rol
const validarPermisosRegistro = (
  rol: RolesSistema,
  actor: ActoresSistema,
  tipoAsistencia: TipoAsistencia,
  idODniARegistrar: string,
  miIdODni: string,
  esRegistroPropio: boolean = false,
  grado?: number,
  seccion?: string,
  nivelEducativo?: string
): { esValido: boolean; mensaje?: string } => {
  switch (rol) {
    case RolesSistema.Directivo:
      // Los directivos pueden registrar asistencias de personal (incluyendo otros directivos)
      // PERO NO pueden registrar asistencias de estudiantes
      if (actor === ActoresSistema.Estudiante) {
        return {
          esValido: false,
          mensaje:
            "Los directivos no pueden registrar asistencias de estudiantes",
        };
      }

      // Para personal: pueden registrar cualquier personal
      if (tipoAsistencia !== TipoAsistencia.ParaPersonal) {
        return {
          esValido: false,
          mensaje:
            "Los directivos solo pueden registrar asistencias de personal",
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
              "Los auxiliares solo pueden registrar estudiantes de secundaria",
          };
        }
        // Para estudiantes requiere nivel, grado y sección
        if (!nivelEducativo || !grado || !seccion) {
          return {
            esValido: false,
            mensaje:
              "Se requieren nivel educativo, grado y sección para registrar estudiantes",
          };
        }
      } else {
        // Para asistencia personal: solo su propio registro
        if (!esRegistroPropio && idODniARegistrar !== miIdODni) {
          return {
            esValido: false,
            mensaje:
              "Los auxiliares solo pueden registrar su propia asistencia de personal",
          };
        }
        // Debe ser tipo Personal
        if (tipoAsistencia !== TipoAsistencia.ParaPersonal) {
          return {
            esValido: false,
            mensaje:
              "Los auxiliares solo pueden registrar asistencia de tipo Personal para sí mismos",
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
              "Los profesores de primaria solo pueden registrar estudiantes de primaria",
          };
        }
        // Para estudiantes requiere nivel, grado y sección
        if (!nivelEducativo || !grado || !seccion) {
          return {
            esValido: false,
            mensaje:
              "Se requieren nivel educativo, grado y sección para registrar estudiantes",
          };
        }
      } else {
        // Para asistencia personal: solo su propio registro
        if (!esRegistroPropio && idODniARegistrar !== miIdODni) {
          return {
            esValido: false,
            mensaje:
              "Los profesores de primaria solo pueden registrar su propia asistencia de personal",
          };
        }
        // Debe ser tipo Personal
        if (tipoAsistencia !== TipoAsistencia.ParaPersonal) {
          return {
            esValido: false,
            mensaje:
              "Los profesores de primaria solo pueden registrar asistencia de tipo Personal para sí mismos",
          };
        }
      }
      return { esValido: true };

    case RolesSistema.ProfesorSecundaria:
    case RolesSistema.Tutor:
      if (actor === ActoresSistema.Estudiante) {
        return {
          esValido: false,
          mensaje:
            "Los profesores/tutores de secundaria no pueden registrar asistencias de estudiantes",
        };
      } else {
        // Para asistencia personal: solo su propio registro
        if (!esRegistroPropio && idODniARegistrar !== miIdODni) {
          return {
            esValido: false,
            mensaje:
              "Los profesores/tutores de secundaria solo pueden registrar su propia asistencia",
          };
        }
        // Debe ser tipo Personal
        if (tipoAsistencia !== TipoAsistencia.ParaPersonal) {
          return {
            esValido: false,
            mensaje:
              "Los profesores/tutores de secundaria solo pueden registrar asistencia de tipo Personal para sí mismos",
          };
        }
      }
      return { esValido: true };

    case RolesSistema.PersonalAdministrativo:
      if (actor === ActoresSistema.Estudiante) {
        return {
          esValido: false,
          mensaje:
            "El personal administrativo no puede registrar asistencias de estudiantes",
        };
      } else {
        // Para asistencia personal: solo su propio registro
        if (!esRegistroPropio && idODniARegistrar !== miIdODni) {
          return {
            esValido: false,
            mensaje:
              "El personal administrativo solo puede registrar su propia asistencia",
          };
        }
        // Debe ser tipo Personal
        if (tipoAsistencia !== TipoAsistencia.ParaPersonal) {
          return {
            esValido: false,
            mensaje:
              "El personal administrativo solo puede registrar asistencia de tipo Personal para sí mismo",
          };
        }
      }
      return { esValido: true };

    case RolesSistema.Responsable:
      // Los responsables no pueden registrar asistencias
      return {
        esValido: false,
        mensaje: "Los responsables no pueden registrar asistencias",
      };

    default:
      return { esValido: false, mensaje: "Rol no autorizado" };
  }
};

const calcularSegundosHastaExpiracion = (): number => {
  // ✅ Usar la nueva función que maneja todos los offsets
  const fechaActualPeru = obtenerFechaHoraActualPeru();

  // Crear fecha objetivo a las 20:00 del mismo día
  const fechaExpiracion = new Date(fechaActualPeru);
  fechaExpiracion.setHours(
    HORA_MAXIMA_EXPIRACION_PARA_REGISTROS_EN_REDIS,
    0,
    0,
    0
  );

  // Si la hora actual ya pasó las 20:00, establecer para las 20:00 del día siguiente
  if (fechaActualPeru >= fechaExpiracion) {
    fechaExpiracion.setDate(fechaExpiracion.getDate() + 1);
  }

  // Calcular diferencia en segundos
  const segundosHastaExpiracion = Math.floor(
    (fechaExpiracion.getTime() - fechaActualPeru.getTime()) / 1000
  );
  return Math.max(1, segundosHastaExpiracion); // Mínimo 1 segundo para evitar valores negativos o cero
};

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const { error, rol, decodedToken } = await verifyAuthToken(req, [
      RolesSistema.Directivo,
      RolesSistema.Auxiliar,
      RolesSistema.ProfesorPrimaria,
      RolesSistema.ProfesorSecundaria,
      RolesSistema.Tutor,
      RolesSistema.PersonalAdministrativo,
    ]);

    if (error && !rol && !decodedToken) return error;

    const MI_ID_O_DNI = decodedToken.ID_Usuario; // ✅ Para directivos: ID, para otros: DNI

    // Parsear el cuerpo de la solicitud como JSON
    const body =
      (await req.json()) as Partial<RegistrarAsistenciaIndividualRequestBody>;

    const {
      Actor,
      ID_o_DNI,
      FechaHoraEsperadaISO,
      ModoRegistro,
      TipoAsistencia: tipoAsistenciaParam,
      NivelDelEstudiante,
      Grado,
      Seccion,
    } = body;

    console.log("HORA ESPERADA ISO", FechaHoraEsperadaISO);

    // ✅ NUEVA LÓGICA: Detectar si es registro propio
    // Si no se envía Actor, ID_o_DNI, ni TipoAsistencia = registro propio
    const esRegistroPropio = !Actor && !ID_o_DNI && !tipoAsistenciaParam;

    let actorFinal: ActoresSistema;
    let idODniFinal: string;
    let tipoAsistenciaFinal: TipoAsistencia;

    if (esRegistroPropio) {
      // ✅ REGISTRO PROPIO: Solo requiere FechaHoraEsperadaISO y ModoRegistro
      console.log(`🔍 Registro propio detectado para rol: ${rol}`);

      // Mapear rol a actor
      const actorMapeado = mapearRolAActorPersonal(rol!);
      if (!actorMapeado) {
        return NextResponse.json(
          {
            success: false,
            message: `El rol ${rol} no puede registrar asistencia personal`,
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          },
          { status: 400 }
        );
      }

      actorFinal = actorMapeado;
      idODniFinal = MI_ID_O_DNI; // ✅ Usar ID/DNI del token
      tipoAsistenciaFinal = TipoAsistencia.ParaPersonal; // ✅ Siempre Personal para registro propio
    } else {
      // ✅ REGISTRO DE OTROS: Requiere todos los campos
      console.log(`🔍 Registro de otros detectado para rol: ${rol}`);

      // Validar que se proporcionaron todos los campos necesarios
      if (!Actor || !ID_o_DNI || !tipoAsistenciaParam) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Para registrar asistencia de otros se requieren Actor, ID_o_DNI y TipoAsistencia",
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          },
          { status: 400 }
        );
      }

      // Validar Actor
      if (!Object.values(ActoresSistema).includes(Actor as ActoresSistema)) {
        return NextResponse.json(
          {
            success: false,
            message: "Actor no válido",
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          },
          { status: 400 }
        );
      }

      // ✅ NUEVA VALIDACIÓN: ID_o_DNI puede ser ID (directivos) o DNI (otros)
      if (
        !ID_o_DNI ||
        typeof ID_o_DNI !== "string" ||
        ID_o_DNI.trim().length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "ID_o_DNI es requerido y debe ser válido",
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          },
          { status: 400 }
        );
      }

      // Para estudiantes y personal no-directivo, validar que sea DNI de 8 dígitos
      if (Actor !== ActoresSistema.Directivo) {
        const dniValidation = validateDNI(ID_o_DNI, true);
        if (!dniValidation.isValid) {
          return NextResponse.json(
            {
              success: false,
              message: `ID_o_DNI inválido para ${Actor}: ${dniValidation.errorMessage}`,
              errorType: dniValidation.errorType,
            },
            { status: 400 }
          );
        }
      }
      // Para directivos, el ID puede ser cualquier string válido (números generalmente)

      // Validar TipoAsistencia
      if (!Object.values(TipoAsistencia).includes(tipoAsistenciaParam)) {
        return NextResponse.json(
          {
            success: false,
            message: "TipoAsistencia no válido",
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          },
          { status: 400 }
        );
      }

      actorFinal = Actor as ActoresSistema;
      idODniFinal = ID_o_DNI;
      tipoAsistenciaFinal = tipoAsistenciaParam;
    }

    // Validar parámetros comunes obligatorios
    if (!FechaHoraEsperadaISO || !ModoRegistro) {
      return NextResponse.json(
        {
          success: false,
          message: "Se requieren FechaHoraEsperadaISO y ModoRegistro",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        },
        { status: 400 }
      );
    }

    // Validar Modo de Registro
    if (!Object.values(ModoRegistro).includes(ModoRegistro)) {
      return NextResponse.json(
        {
          success: false,
          message: "Modo de registro no válido",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        },
        { status: 400 }
      );
    }

    const esEstudiante = actorFinal === ActoresSistema.Estudiante;

    if (esEstudiante) {
      // Validar que se proporcionaron datos requeridos para estudiantes
      if (!NivelDelEstudiante) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Se requiere nivel educativo para registrar asistencia de estudiantes",
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          },
          { status: 400 }
        );
      }

      if (!Grado || !Seccion) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Se requieren grado y sección para registrar asistencia de estudiantes",
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          },
          { status: 400 }
        );
      }

      // Validar que el grado sea numérico y esté en rango válido
      if (typeof Grado !== "number" || Grado < 1 || Grado > 6) {
        return NextResponse.json(
          {
            success: false,
            message: "El grado debe ser un número entre 1 y 6",
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          },
          { status: 400 }
        );
      }

      // Validar que la sección sea una letra válida
      if (typeof Seccion !== "string" || !/^[A-Z]$/.test(Seccion)) {
        return NextResponse.json(
          {
            success: false,
            message: "La sección debe ser una letra mayúscula (A-Z)",
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          },
          { status: 400 }
        );
      }
    }

    // ✅ NUEVA VALIDACIÓN: Verificar permisos de registro
    const validacionPermisos = validarPermisosRegistro(
      rol!,
      actorFinal,
      tipoAsistenciaFinal,
      idODniFinal,
      MI_ID_O_DNI,
      esRegistroPropio,
      Grado,
      Seccion,
      NivelDelEstudiante
    );

    if (!validacionPermisos.esValido) {
      return NextResponse.json(
        {
          success: false,
          message: validacionPermisos.mensaje,
          errorType: PermissionErrorTypes.INSUFFICIENT_PERMISSIONS,
        },
        { status: 403 }
      );
    }

    // ✅ Usar la nueva función que maneja todos los offsets para obtener timestamp actual
    const fechaActualPeru = obtenerFechaHoraActualPeru();
    const timestampActual = fechaActualPeru.getTime();

    // Calcular desfase en segundos
    const desfaseSegundos = Math.floor(
      (timestampActual - new Date(FechaHoraEsperadaISO).getTime()) / 1000
    );

    // Crear clave para Redis usando la función original (mantiene retrocompatibilidad)
    const fechaHoy = obtenerFechaActualPeru();
    let clave: string;

    if (esEstudiante) {
      // Para estudiantes: incluir nivel, grado y sección en la clave
      clave = `${fechaHoy}:${ModoRegistro}:${actorFinal}:${idODniFinal}:${NivelDelEstudiante}:${Grado}:${Seccion}`;
    } else {
      // Para personal: clave tradicional
      clave = `${fechaHoy}:${ModoRegistro}:${actorFinal}:${idODniFinal}`;
    }

    // Usar el TipoAsistencia determinado
    const redisClientInstance = redisClient(tipoAsistenciaFinal);

    // Verificar si ya existe un registro en Redis
    const registroExistente = await redisClientInstance.get(clave);
    const esNuevoRegistro = !registroExistente;

    if (esNuevoRegistro) {
      // Crear valor para Redis según el tipo de actor
      if (esEstudiante) {
        // Para estudiantes: Valor es simplemente "A" o "T"
        const estado =
          desfaseSegundos > MINUTOS_TOLERANCIA * 60
            ? EstadosAsistencia.Tarde
            : EstadosAsistencia.Temprano;

        // Establecer la expiración
        const segundosHastaExpiracion = calcularSegundosHastaExpiracion();
        await redisClientInstance.set(clave, estado, segundosHastaExpiracion);
      } else {
        // Para personal: Valor es array [timestamp, desfaseSegundos]
        const valor = [timestampActual.toString(), desfaseSegundos.toString()];

        // Establecer la expiración
        const segundosHastaExpiracion = calcularSegundosHastaExpiracion();
        await redisClientInstance.set(clave, valor, segundosHastaExpiracion);
      }
    }

    console.log(
      `✅ Registro de asistencia: ${
        esRegistroPropio ? "PROPIO" : "OTROS"
      } - Actor: ${actorFinal} - ${esNuevoRegistro ? "NUEVO" : "EXISTENTE"}`
    );

    return NextResponse.json(
      {
        success: true,
        message: esNuevoRegistro
          ? "Asistencia registrada correctamente"
          : "La asistencia ya había sido registrada anteriormente",
        data: {
          timestamp: timestampActual,
          desfaseSegundos,
          esNuevoRegistro,
          esRegistroPropio: MI_ID_O_DNI === ID_o_DNI,
          actorRegistrado: actorFinal, // ✅ Esto enviará la abreviación (D, A, PP, PS, T, R, PA, E)
          tipoAsistencia: tipoAsistenciaFinal,
        },
      } as RegistrarAsistenciaIndividualSuccessResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al registrar asistencia:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Error al registrar asistencia",
        errorType: SystemErrorTypes.UNKNOWN_ERROR,
        ErrorDetails: error instanceof Error ? error.message : String(error),
      } as ErrorResponseAPIBase,
      { status: 500 }
    );
  }
}
