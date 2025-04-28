import { NextRequest, NextResponse } from "next/server";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { Meses } from "@/interfaces/shared/Meses";
import { LogoutTypes, ErrorDetailsForLogout } from "@/interfaces/LogoutTypes";
import { verifyAuthToken } from "@/lib/utils/backend/auth/functions/jwtComprobations";
import { redirectToLogin } from "@/lib/utils/backend/auth/functions/redirectToLogin";
import { redisClient } from "../../../../../config/Redis/RedisClient";
import { obtenerFechaActualPeru } from "../../_helpers/obtenerFechaActualPeru";
import {
  NOMBRE_BANDERA_INICIO_TOMA_ASISTENCIA_PERSONAL,
  NOMBRE_BANDERA_INICIO_TOMA_ASISTENCIA_PRIMARIA,
  NOMBRE_BANDERA_INICIO_TOMA_ASISTENCIA_SECUNDARIA,
} from "@/constants/NOMBRES_BANDERAS_INICIO_TOMA_ASISTENCIAS";
import {
  EstadoTomaAsistenciaResponseBody,
  IniciarTomaAsistenciaRequestBody,
  TipoAsistencia,
} from "@/interfaces/shared/AsistenciaRequests";

/**
 * Calcula los segundos que faltan hasta las 23:59:59 del día actual en hora peruana
 * @returns Segundos hasta el final del día en Perú
 */
function calcularSegundosHastaFinDiaPeru(): number {
  // Obtener fecha y hora actual en UTC
  const fechaUTC = new Date();

  // Crear una nueva fecha que represente las 23:59:59 en Perú el día actual
  // Para esto, usamos la fecha UTC y ajustamos manualmente la hora a 23:59:59 en zona horaria peruana (UTC-5)
  // Por lo tanto, en UTC esto sería 04:59:59 del día siguiente
  // Primero obtenemos la fecha actual en Perú para saber de qué día estamos hablando
  const offsetPeruHoras = -5;
  const fechaPeruanaActual = new Date(
    fechaUTC.getTime() + offsetPeruHoras * 60 * 60 * 1000
  );
  const fechaPeruanaStr = fechaPeruanaActual.toISOString().split("T")[0];

  // Ahora creamos la fecha que representa las 23:59:59 en hora peruana de ese mismo día
  // Esto es UTC 04:59:59 del día siguiente si no estamos cerca del cambio de día
  const finDiaPeruanoEnUTC = new Date(`${fechaPeruanaStr}T23:59:59.999-05:00`);

  // Calcular diferencia en segundos
  const segundosRestantes = Math.floor(
    (finDiaPeruanoEnUTC.getTime() - fechaUTC.getTime()) / 1000
  );

  // Log para depuración
  console.log(`Fecha UTC actual: ${fechaUTC.toISOString()}`);
  console.log(`Fecha peruana calculada: ${fechaPeruanaActual.toISOString()}`);
  console.log(
    `Fin del día peruano en UTC: ${finDiaPeruanoEnUTC.toISOString()}`
  );
  console.log(`Segundos restantes calculados: ${segundosRestantes}`);

  // Asegurar que devolvemos al menos 1 segundo y como máximo un día
  return Math.max(Math.min(segundosRestantes, 86400), 1);
}

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación - solo roles con permisos para iniciar asistencia
    const { error } = await verifyAuthToken(req, [
      RolesSistema.Directivo,
      RolesSistema.Auxiliar,
      RolesSistema.ProfesorPrimaria,
    ]);

    if (error) return error;

    // Obtener datos del body
    const body = (await req.json()) as IniciarTomaAsistenciaRequestBody;

    // Validar que se proporcionó TipoAsistencia
    if (!body.TipoAsistencia) {
      return NextResponse.json(
        {
          success: false,
          message: "Se requiere el parámetro TipoAsistencia en el body",
        },
        { status: 400 }
      );
    }

    // Validar que TipoAsistencia sea válido
    if (!Object.values(TipoAsistencia).includes(body.TipoAsistencia)) {
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
    const tipoAsistencia = body.TipoAsistencia;

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

    // Calcular segundos hasta el final del día en Perú
    const segundosHastaFinDia = calcularSegundosHastaFinDiaPeru();

    console.log(
      `Estableciendo bandera con expiración de ${segundosHastaFinDia} segundos (hasta las 23:59:59 hora peruana)`
    );
    console.log(
      `En tiempo legible: ${Math.floor(
        segundosHastaFinDia / 3600
      )}h ${Math.floor((segundosHastaFinDia % 3600) / 60)}m ${
        segundosHastaFinDia % 60
      }s`
    );

    // Obtener la instancia de Redis correspondiente al tipo de asistencia
    const redisClientInstance = redisClient(tipoAsistencia);

    // Almacenar en Redis con expiración al final del día peruano
    const valorGuardado = await redisClientInstance.set(redisKey, "true", 
     segundosHastaFinDia    );

    if (valorGuardado !== "OK") {
      return NextResponse.json(
        {
          success: false,
          message: "Error al almacenar el estado de asistencia en Redis",
        },
        { status: 500 }
      );
    }

    // Construir la respuesta
    const respuesta: EstadoTomaAsistenciaResponseBody = {
      TipoAsistencia: tipoAsistencia,
      Dia: dia,
      Mes: mes as Meses,
      Anio: anio,
      AsistenciaIniciada: true,
    };

    return NextResponse.json(respuesta, { status: 200 });
  } catch (error) {
    console.error("Error al iniciar estado de toma de asistencia:", error);

    // Determinar el tipo de error
    let logoutType: LogoutTypes | null = null;
    const errorDetails: ErrorDetailsForLogout = {
      mensaje: "Error al iniciar estado de toma de asistencia",
      origen: "api/estado-toma-asistencia",
      timestamp: Date.now(),
      siasisComponent: "RDP05", // Componente Redis
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
      // Si es un error de parseo de JSON
      else if (
        error.message.includes("JSON") ||
        error.message.includes("parse") ||
        error.message.includes("Unexpected token")
      ) {
        logoutType = LogoutTypes.ERROR_DATOS_CORRUPTOS;
        errorDetails.mensaje = "Error al procesar los datos de la solicitud";
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