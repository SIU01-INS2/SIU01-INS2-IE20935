import { NextRequest, NextResponse } from "next/server";
import { NivelEducativo } from "@/interfaces/shared/NivelEducativo";
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

// Función para determinar el tipo de asistencia según el actor y nivel educativo
export const determinarTipoAsistencia = (
  actor: ActoresSistema | RolesSistema,
  nivelDelEstudiante?: NivelEducativo
): TipoAsistencia => {
  if (actor === ActoresSistema.Estudiante) {
    if (nivelDelEstudiante === NivelEducativo.PRIMARIA) {
      return TipoAsistencia.ParaEstudiantesPrimaria;
    } else {
      return TipoAsistencia.ParaEstudiantesSecundaria;
    }
  } else {
    // Todos los demás actores (profesores, auxiliares, etc.) usan el Redis para personal
    return TipoAsistencia.ParaPersonal;
  }
};

// Función para obtener la fecha actual en Perú (UTC-5)
const obtenerFechaActualPeru = (): string => {
  const fecha = new Date();
  fecha.setHours(fecha.getHours() - 5); // Ajustar a hora de Perú (UTC-5)
  return fecha.toISOString().split("T")[0]; // Formato YYYY-MM-DD
};

// Constantes de configuración
const MINUTOS_TOLERANCIA = 5; // 5 minutos de tolerancia para considerar llegada temprana

// Función para calcular los segundos hasta la hora de expiración (8 PM)
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
      AulaDelEstudiante,
      NivelDelEstudiante,
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
      // Validar que se proporcionaron nivel y aula para estudiantes
      if (!NivelDelEstudiante || !AulaDelEstudiante) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Se requiere nivel educativo y aula para registrar asistencia de estudiantes",
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
    const ModoRegistroActor = `${ModoRegistro}:${Actor}`;
    const clave = `${obtenerFechaActualPeru()}:${ModoRegistroActor}:${DNI}${
      NivelDelEstudiante ? ":" + NivelDelEstudiante : ""
    }${AulaDelEstudiante ? ":" + AulaDelEstudiante : ""}`;

    // Determinar el tipo de asistencia y obtener el cliente Redis correcto
    const tipoAsistencia = determinarTipoAsistencia(Actor, NivelDelEstudiante);
    const redisClientInstance = redisClient(tipoAsistencia);

    // Verificar si ya existe un registro en Redis
    const registroExistente = await redisClientInstance.get(clave);
    const esNuevoRegistro = !registroExistente;

    if (esNuevoRegistro) {
      // Crear valor para Redis
      let estado;
      if (esEstudiante) {
        estado =
          desfaseSegundos > MINUTOS_TOLERANCIA * 60
            ? EstadosAsistencia.Tarde
            : EstadosAsistencia.Temprano;
      }

      const valor = [
        ModoRegistroActor,
        timestampActual.toString(),
        desfaseSegundos.toString(),
        esEstudiante ? estado : "",
      ];

      // Establecer la expiración
      const segundosHastaExpiracion = calcularSegundosHastaExpiracion();
      await redisClientInstance.set(clave, valor, segundosHastaExpiracion);
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
