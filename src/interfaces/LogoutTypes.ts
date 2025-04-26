import { SiasisComponent } from "./shared/SiasisComponents";

export enum LogoutTypes {
  ERROR_DATOS_NO_DISPONIBLES = "ERROR_DATOS_NO_DISPONIBLES",
  DECISION_USUARIO = "DECISION_USUARIO",
  SESION_EXPIRADA = "SESION_EXPIRADA",
  ERROR_SISTEMA = "ERROR_SISTEMA",
  ERROR_SINCRONIZACION = "ERROR_SINCRONIZACION",
  ERROR_BASE_DATOS = "ERROR_BASE_DATOS",
  ERROR_RED = "ERROR_RED",
  ERROR_DATOS_CORRUPTOS = "ERROR_DATOS_CORRUPTOS",
  ERROR_PARSEO = "ERROR_PARSEO",
  PERMISOS_INSUFICIENTES = "PERMISOS_INSUFICIENTES",
}

export interface ErrorDetailsForLogout {
  codigo?: string;
  origen?: string;
  mensaje?: string;
  timestamp?: number;
  contexto?: string;
  siasisComponent?: SiasisComponent;
}
