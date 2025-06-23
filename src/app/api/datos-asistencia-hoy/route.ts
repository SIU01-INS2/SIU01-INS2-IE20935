import { NextRequest, NextResponse } from "next/server";
import { LogoutTypes, ErrorDetailsForLogout } from "@/interfaces/LogoutTypes";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { NOMBRE_ARCHIVO_CON_DATOS_ASISTENCIA_DIARIOS } from "@/constants/NOMBRE_ARCHIVOS_EN_BLOBS";
import {
  AuxiliarAsistenciaResponse,
  BaseAsistenciaResponse,
  DatosAsistenciaHoyIE20935,
  DirectivoAsistenciaResponse,
  PersonalAdministrativoAsistenciaResponse,
  ProfesorPrimariaAsistenciaResponse,
  ProfesorTutorSecundariaAsistenciaResponse,
  ResponsableAsistenciaResponse,
} from "@/interfaces/shared/Asistencia/DatosAsistenciaHoyIE20935";

import { NivelEducativo } from "@/interfaces/shared/NivelEducativo";
import { verifyAuthToken } from "@/lib/utils/backend/auth/functions/jwtComprobations";
import { redirectToLogin } from "@/lib/utils/backend/auth/functions/redirectToLogin";
import { redisClient } from "../../../../config/Redis/RedisClient";

// Función auxiliar para verificar si el contenido es realmente JSON
async function esContenidoJSON(response: Response): Promise<boolean> {
  try {
    // Verificar header Content-Type
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      // Si no es application/json, verificamos el contenido mismo
      const texto = await response.clone().text();

      // Intentar hacer un parse del texto para ver si es JSON válido
      JSON.parse(texto);
      return true;
    }
    return true;
  } catch (error) {
    console.warn("El contenido recibido no es JSON válido:", error);
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { decodedToken, rol, error } = await verifyAuthToken(req);

    if (error) return error;

    let datosCompletos: DatosAsistenciaHoyIE20935;
    let usandoRespaldo = false;

    try {
      // Intento principal: obtener datos del blob
      const response = await fetch(
        `${process.env
          .RDP04_THIS_INSTANCE_VERCEL_BLOB_BASE_URL!}/${NOMBRE_ARCHIVO_CON_DATOS_ASISTENCIA_DIARIOS}`
      );

      if (!response.ok || !(await esContenidoJSON(response))) {
        throw new Error("Respuesta del blob inválida o no es JSON");
      }

      datosCompletos = await response.json();
    } catch (blobError) {
      // Plan B: Si el primer fetch falla, intentar con Google Drive
      console.warn(
        "Error al obtener datos del blob, usando respaldo:",
        blobError
      );
      usandoRespaldo = true;

      try {
        // Obtener el ID de Google Drive desde Redis
        const archivoDatosAsistenciaHoyGoogleDriveID = await redisClient().get(
          NOMBRE_ARCHIVO_CON_DATOS_ASISTENCIA_DIARIOS
        );

        if (!archivoDatosAsistenciaHoyGoogleDriveID) {
          throw new Error("No se encontró el ID del archivo en Redis");
        }

        // Hacer el fetch de respaldo desde Google Drive
        const respaldoResponse = await fetch(
          `https://drive.google.com/uc?export=download&id=${archivoDatosAsistenciaHoyGoogleDriveID}`
        );

        if (
          !respaldoResponse.ok ||
          !(await esContenidoJSON(respaldoResponse))
        ) {
          throw new Error(
            `Error en la respuesta de respaldo: ${respaldoResponse.status} ${respaldoResponse.statusText}`
          );
        }

        datosCompletos = await respaldoResponse.json();
        console.log("Datos obtenidos exitosamente desde respaldo Google Drive");
      } catch (respaldoError) {
        // Si también falla el respaldo, lanzar un error más descriptivo
        console.error("Error al obtener datos desde respaldo:", respaldoError);
        throw new Error(
          `Falló el acceso principal y el respaldo: ${
            (respaldoError as Error).message
          }`
        );
      }
    }

    // Filtrar datos según el rol
    const datosFiltrados = filtrarDatosSegunRol(
      datosCompletos,
      rol,
      decodedToken.ID_Usuario
    );

    // Devolver los datos filtrados con indicador de fuente
    return NextResponse.json({
      ...datosFiltrados,
      _debug: usandoRespaldo
        ? "Datos obtenidos desde respaldo"
        : "Datos obtenidos desde fuente principal",
    });
  } catch (error) {
    console.error("Error al obtener datos de asistencia:", error);
    // Determinar el tipo de error
    let logoutType = LogoutTypes.ERROR_SISTEMA;
    const errorDetails: ErrorDetailsForLogout = {
      mensaje: "Error al recuperar datos de asistencia",
      origen: "api/datos-asistencia-hoy",
      timestamp: Date.now(),
      siasisComponent: "RDP04", // Principal componente es RDP04 (blob)
    };

    if (error instanceof Error) {
      // Si es un error de red o problemas de conexión
      if (
        error.message.includes("fetch") ||
        error.message.includes("network") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("timeout")
      ) {
        logoutType = LogoutTypes.ERROR_RED;
        errorDetails.mensaje =
          "Error de conexión al obtener datos de asistencia";
      }
      // Si es un error de parseo de JSON
      else if (
        error.message.includes("JSON") ||
        error.message.includes("parse") ||
        error.message.includes("no es JSON válido")
      ) {
        logoutType = LogoutTypes.ERROR_DATOS_CORRUPTOS;
        errorDetails.mensaje = "Error al procesar los datos de asistencia";
        errorDetails.contexto = "Formato de datos inválido";
      }
      // Si falló la búsqueda en Redis
      else if (error.message.includes("No se encontró el ID")) {
        logoutType = LogoutTypes.ERROR_DATOS_NO_DISPONIBLES;
        errorDetails.mensaje =
          "No se pudo encontrar la información de asistencia";
        errorDetails.siasisComponent = "RDP05"; // Error específico de Redis
      }
      // Si falló tanto el acceso principal como el respaldo
      else if (
        error.message.includes("Falló el acceso principal y el respaldo")
      ) {
        logoutType = LogoutTypes.ERROR_DATOS_NO_DISPONIBLES;
        errorDetails.mensaje =
          "No se pudo obtener la información de asistencia";
        errorDetails.contexto =
          "Falló tanto el acceso a blob como a Google Drive";
      }

      errorDetails.mensaje += `: ${error.message}`;
    }

    return redirectToLogin(logoutType, errorDetails);
  }
}

// Función para filtrar los datos según el rol
function filtrarDatosSegunRol(
  datos: DatosAsistenciaHoyIE20935,
  rol: RolesSistema,
  idUsuario: string
): BaseAsistenciaResponse {
  // Datos base para todos los roles
  const datosBase: BaseAsistenciaResponse = {
    DiaEvento: datos.DiaEvento,
    FechaUTC: datos.FechaUTC,
    FechaLocalPeru: datos.FechaLocalPeru,
    FueraAñoEscolar: datos.FueraAñoEscolar,
    Semana_De_Gestion: datos.Semana_De_Gestion,
    Vacaciones_Interescolares: datos.Vacaciones_Interescolares,
    ComunicadosParaMostrarHoy: datos.ComunicadosParaMostrarHoy,
  };

  switch (rol) {
    case RolesSistema.Directivo:
      // Directivos tienen acceso a todos los datos
      return {
        ...datosBase,
        ListaDePersonalesAdministrativos:
          datos.ListaDePersonalesAdministrativos,
        ListaDeDirectivos: datos.ListaDeDirectivos,
        ListaDeProfesoresPrimaria: datos.ListaDeProfesoresPrimaria,
        ListaDeProfesoresSecundaria: datos.ListaDeProfesoresSecundaria,
        HorariosLaboraresGenerales: datos.HorariosLaboraresGenerales,
        HorariosEscolares: datos.HorariosEscolares,
        ListaDeAuxiliares: datos.ListaDeAuxiliares,
      } as DirectivoAsistenciaResponse;

    case RolesSistema.ProfesorPrimaria:
      // Profesores de primaria reciben su horario y el de estudiantes de primaria
      return {
        ...datosBase,
        HorarioTomaAsistenciaProfesorPrimaria:
          datos.HorariosLaboraresGenerales.TomaAsistenciaProfesorPrimaria,
        HorarioEscolarPrimaria:
          datos.HorariosEscolares[NivelEducativo.PRIMARIA],
      } as ProfesorPrimariaAsistenciaResponse;

    case RolesSistema.Auxiliar:
      // Auxiliares reciben su horario y el de estudiantes de secundaria
      return {
        ...datosBase,
        HorarioTomaAsistenciaAuxiliares:
          datos.HorariosLaboraresGenerales.TomaAsistenciaAuxiliares,
        HorarioEscolarSecundaria:
          datos.HorariosEscolares[NivelEducativo.SECUNDARIA],
      } as AuxiliarAsistenciaResponse;

    case RolesSistema.ProfesorSecundaria:
    case RolesSistema.Tutor:
      // Profesores de secundaria y tutores reciben su propio horario y el de estudiantes de secundaria
      const profesorInfo = datos.ListaDeProfesoresSecundaria.find(
        (p) => p.DNI_Profesor_Secundaria === idUsuario
      );

      return {
        ...datosBase,
        HorarioProfesor: profesorInfo
          ? {
              Hora_Entrada_Dia_Actual: profesorInfo.Hora_Entrada_Dia_Actual,
              Hora_Salida_Dia_Actual: profesorInfo.Hora_Salida_Dia_Actual,
            }
          : false,
        HorarioEscolarSecundaria:
          datos.HorariosEscolares[NivelEducativo.SECUNDARIA],
      } as ProfesorTutorSecundariaAsistenciaResponse;

    case RolesSistema.Responsable:
      // Responsables reciben los horarios escolares de primaria y secundaria
      return {
        ...datosBase,
        HorariosEscolares: datos.HorariosEscolares,
      } as ResponsableAsistenciaResponse;

    case RolesSistema.PersonalAdministrativo:
      // Personal administrativo recibe solo su propio horario
      const personalInfo = datos.ListaDePersonalesAdministrativos.find(
        (p) => p.DNI_Personal_Administrativo == idUsuario
      );
      return {
        ...datosBase,
        HorarioPersonal: personalInfo
          ? {
              Horario_Laboral_Entrada: personalInfo.Hora_Entrada_Dia_Actual,
              Horario_Laboral_Salida: personalInfo.Hora_Salida_Dia_Actual,
            }
          : false,
      } as PersonalAdministrativoAsistenciaResponse;

    default:
      // Por defecto, solo devolver los datos base
      return datosBase;
  }
}
