import { NextRequest, NextResponse } from "next/server";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { Meses } from "@/interfaces/shared/Meses";
import { LogoutTypes, ErrorDetailsForLogout } from "@/interfaces/LogoutTypes";
import { verifyAuthToken } from "@/lib/utils/backend/auth/functions/jwtComprobations";
import { redirectToLogin } from "@/lib/utils/backend/auth/functions/redirectToLogin";
import { redisClient } from "../../../../../config/Redis/RedisClient";
import { obtenerFechaActualPeru } from "../../_helpers/obtenerFechaActualPeru";
import {
  EstadoTomaAsistenciaResponseBody,
  TipoAsistencia,
} from "@/interfaces/shared/AsistenciaRequests";
import {
  NOMBRE_BANDERA_INICIO_TOMA_ASISTENCIA_PERSONAL,
  NOMBRE_BANDERA_INICIO_TOMA_ASISTENCIA_PRIMARIA,
  NOMBRE_BANDERA_INICIO_TOMA_ASISTENCIA_SECUNDARIA,
} from "@/constants/NOMBRES_BANDERAS_INICIO_TOMA_ASISTENCIAS";

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const { error } = await verifyAuthToken(req, [
      RolesSistema.Directivo,
      RolesSistema.Auxiliar,
      RolesSistema.ProfesorPrimaria,
      RolesSistema.ProfesorSecundaria,
      RolesSistema.Tutor,
    ]);

    if (error) return error;

    // Obtener parámetros de la consulta
    const searchParams = req.nextUrl.searchParams;
    const tipoAsistenciaParam = searchParams.get(
      "TipoAsistencia"
    ) as TipoAsistencia;

    // Validar parámetros
    if (!tipoAsistenciaParam) {
      return NextResponse.json(
        {
          success: false,
          message: "Se requiere el parámetro TipoAsistencia",
        },
        { status: 400 }
      );
    }

    // Validar que TipoAsistencia sea válido
    if (
      !Object.values(TipoAsistencia).includes(
        tipoAsistenciaParam as TipoAsistencia
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

    // Obtener la fecha actual en Perú
    const fechaActualPeru = obtenerFechaActualPeru();
    const [anio, mes, dia] = fechaActualPeru.split("-").map(Number);

    // Determinar la key correcta en Redis según el TipoAsistencia
    let redisKey;
    const tipoAsistencia = tipoAsistenciaParam;

    switch (tipoAsistencia) {
      case TipoAsistencia.ParaPersonal:
        redisKey = NOMBRE_BANDERA_INICIO_TOMA_ASISTENCIA_PERSONAL;
        break;
      case TipoAsistencia.ParaEstudiantesPrimaria:
        redisKey = NOMBRE_BANDERA_INICIO_TOMA_ASISTENCIA_PRIMARIA;
        break;
      case TipoAsistencia.ParaEstudiantesSecundaria:
        redisKey = NOMBRE_BANDERA_INICIO_TOMA_ASISTENCIA_SECUNDARIA;
        break;
      default:
        return NextResponse.json(
          { success: false, message: "Tipo de asistencia no reconocido" },
          { status: 400 }
        );
    }

    // Obtener la instancia de Redis correspondiente al tipo de asistencia
    const redisClientInstance = redisClient(tipoAsistencia);

    // Consultar el valor en Redis
    const valor = await redisClientInstance.get(redisKey);

    // Determinar si la asistencia está iniciada - Si no hay valor, simplemente consideramos que no está iniciada
    const asistenciaIniciada = valor === true;
    console.log("prueba", valor);

    // Construir la respuesta - siempre devolvemos una respuesta válida con el estado actual
    const respuesta: EstadoTomaAsistenciaResponseBody = {
      TipoAsistencia: tipoAsistencia,
      Dia: dia,
      Mes: mes as Meses,
      Anio: anio,
      AsistenciaIniciada: asistenciaIniciada,
    };

    return NextResponse.json(respuesta, { status: 200 });
  } catch (error) {
    console.error("Error al consultar estado de toma de asistencia:", error);

    // Determinar el tipo de error
    let logoutType: LogoutTypes | null = null;
    const errorDetails: ErrorDetailsForLogout = {
      mensaje: "Error al consultar estado de toma de asistencia",
      origen: "api/estado-toma-asistencia",
      timestamp: Date.now(),
      siasisComponent: "RDP04",
    };

    if (error instanceof Error) {
      // Si es un error de redis crítico o problemas de conexión severos
      if (
        error.message.includes("Redis connection lost") ||
        error.message.includes("Redis connection failed") ||
        error.message.includes("Redis connection timed out")
      ) {
        logoutType = LogoutTypes.ERROR_SISTEMA;
        errorDetails.mensaje = "Error de conexión con el sistema de datos";
      }

      errorDetails.mensaje += `: ${error.message}`;
    }

    // Si identificamos un error crítico, redirigir al login
    if (logoutType) {
      return redirectToLogin(logoutType, errorDetails);
    }

    // Para otros errores, simplemente devolver una respuesta JSON de error
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
