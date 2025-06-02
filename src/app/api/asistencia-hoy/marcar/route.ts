import { NextRequest, NextResponse } from "next/server";
import { EstadosAsistencia } from "@/interfaces/shared/EstadosAsistenciaEstudiantes";
import { ActoresSistema } from "@/interfaces/shared/ActoresSistema";
import {
  RegistrarAsistenciaIndividualRequestBody,
  RegistrarAsistenciaIndividualSuccessResponse,
} from "@/interfaces/shared/apis/api01/asistencia/types";
import { validateDNI } from "@/lib/helpers/validators/data/validateDNI";
import {
  RequestErrorTypes,
  SystemErrorTypes,
} from "@/interfaces/shared/apis/errors";
import { redisClient } from "../../../../../config/Redis/RedisClient";
import { ErrorResponseAPIBase } from "@/interfaces/shared/apis/types";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { TipoAsistencia } from "@/interfaces/shared/AsistenciaRequests";
import { HORA_MAXIMA_EXPIRACION_PARA_REGISTROS_EN_REDIS } from "@/constants/expirations";
import { obtenerFechaActualPeru } from "../../_helpers/obtenerFechaActualPeru";
// import { ENTORNO } from "@/constants/ENTORNO";
// import { Entorno } from "@/interfaces/shared/Entornos";


// Constantes de configuración
const MINUTOS_TOLERANCIA = 5; // 5 minutos de tolerancia para considerar llegada temprana

const calcularSegundosHastaExpiracion = (): number => {
  const fechaActualPeru = new Date();
  fechaActualPeru.setHours(fechaActualPeru.getHours() - 5); // Ajustar a hora de Perú (UTC-5)

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
    // Parsear el cuerpo de la solicitud como JSON
    const body = (await req.json()) as RegistrarAsistenciaIndividualRequestBody;

    const {
      Actor,
      DNI,
      FechaHoraEsperadaISO,
      ModoRegistro,
      TipoAsistencia: tipoAsistenciaParam,
      NivelDelEstudiante,
      Grado,
      Seccion,
    } = body;

    // Validar DNI
    const dniValidation = validateDNI(DNI, true);
    if (!dniValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: dniValidation.errorMessage,
          errorType: dniValidation.errorType,
        },
        { status: 400 }
      );
    }

    // Validar Actor
    if (
      !Object.values(ActoresSistema).includes(Actor as ActoresSistema) &&
      !Object.values(RolesSistema).includes(Actor as RolesSistema)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Actor no válido",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        },
        { status: 400 }
      );
    }

    // Validar TipoAsistencia
    if (
      !tipoAsistenciaParam ||
      !Object.values(TipoAsistencia).includes(tipoAsistenciaParam)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "TipoAsistencia no válido o faltante",
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

    // Obtener timestamp actual (en Perú, UTC-5)
    const fechaActualPeru = new Date();
    fechaActualPeru.setHours(fechaActualPeru.getHours() - 5);
    const timestampActual = fechaActualPeru.getTime();

    const esEstudiante = Actor === ActoresSistema.Estudiante;

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

    // Calcular desfase en segundos
    const desfaseSegundos = Math.floor(
      (timestampActual - new Date(FechaHoraEsperadaISO).getTime()) / 1000
    );

    // Crear clave para Redis
    const fechaHoy = obtenerFechaActualPeru();
    let clave: string;

    if (esEstudiante) {
      // Para estudiantes: incluir nivel, grado y sección en la clave
      clave = `${fechaHoy}:${ModoRegistro}:${Actor}:${DNI}:${NivelDelEstudiante}:${Grado}:${Seccion}`;
    } else {
      // Para personal: clave tradicional
      clave = `${fechaHoy}:${ModoRegistro}:${Actor}:${DNI}`;
    }

    // Usar el TipoAsistencia del request
    const tipoAsistencia = tipoAsistenciaParam;
    const redisClientInstance = redisClient(tipoAsistencia);

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
        },
      } as RegistrarAsistenciaIndividualSuccessResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al registrar asistencia:", error);

    // Si ocurrió un error
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
