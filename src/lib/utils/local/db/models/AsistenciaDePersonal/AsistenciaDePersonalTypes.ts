/* eslint-disable @typescript-eslint/no-explicit-any */
import { EstadosAsistenciaPersonal } from "@/interfaces/shared/EstadosAsistenciaPersonal";
import { Meses } from "@/interfaces/shared/Meses";
import { ModoRegistro } from "@/interfaces/shared/ModoRegistroPersonal";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { ActoresSistema } from "@/interfaces/shared/ActoresSistema";
import { TipoAsistencia } from "../../../../../../interfaces/shared/AsistenciaRequests";

// Re-exportar tipos existentes para facilitar el acceso
export { ModoRegistro } from "@/interfaces/shared/ModoRegistroPersonal";
export { EstadosAsistenciaPersonal } from "@/interfaces/shared/EstadosAsistenciaPersonal";
export { RolesSistema } from "@/interfaces/shared/RolesSistema";
export { ActoresSistema } from "@/interfaces/shared/ActoresSistema";
export { TipoAsistencia } from "../../../../../../interfaces/shared/AsistenciaRequests";

// Enumeración para los diferentes tipos de personal
export enum TipoPersonal {
  DIRECTIVO = "directivo",
  PROFESOR_PRIMARIA = "profesor_primaria",
  PROFESOR_SECUNDARIA = "profesor_secundaria",
  AUXILIAR = "auxiliar",
  PERSONAL_ADMINISTRATIVO = "personal_administrativo",
}

// ========================================================================================
// ✅ INTERFACES ACTUALIZADAS PARA FLUJO INTELIGENTE
// ========================================================================================

// Interfaces para los registros de entrada/salida
export interface RegistroEntradaSalida {
  timestamp: number;
  desfaseSegundos: number;
  estado: EstadosAsistenciaPersonal;
}

// ✅ INTERFAZ PRINCIPAL ACTUALIZADA: Asistencia mensual con campo obligatorio
export interface AsistenciaMensualPersonalLocal {
  Id_Registro_Mensual: number;
  mes: Meses;
  ID_o_DNI_Personal: string;
  registros: Record<string, RegistroEntradaSalida>;
  // ✅ NUEVO CAMPO OBLIGATORIO para flujo inteligente
  ultima_fecha_actualizacion: number; // Timestamp peruano
}

// ✅ NUEVA INTERFAZ: Para datos raw que vienen de API/BD (con entradas/salidas nullable)
export interface AsistenciaMensualPersonalRaw {
  Id_Registro_Mensual: number;
  Mes: number;
  ID_o_DNI_Personal: string;
  Entradas: string | null; // ✅ PERMITE NULL para 404s
  Salidas: string | null; // ✅ PERMITE NULL para 404s
  ultima_fecha_actualizacion: number; // ✅ OBLIGATORIO
}

// ✅ NUEVA INTERFAZ: Para optimización de consultas
export interface EstrategiaConsulta {
  tipo: "MES_FUTURO" | "MES_ANTERIOR" | "MES_ACTUAL";
  estrategia:
    | "NO_CONSULTAR"
    | "REDIS_ENTRADAS"
    | "REDIS_COMPLETO"
    | "API_CONSOLIDADO"
    | "INDEXEDDB_OPTIMIZADO"
    | "LOGOUT_FORZADO";
  debeConsultar: boolean;
  razon: string;
  horaActual?: number;
  usarCache?: boolean;
}

// ✅ NUEVA INTERFAZ: Para validación de datos existentes
export interface ValidacionDatosExistentes {
  existeEnIndexedDB: boolean;
  tieneUltimaActualizacion: boolean;
  ultimaFechaActualizacion: number | null;
  debeConsultarAPI: boolean;
  razon: string;
}

// Interface para el resultado de operaciones
export interface OperationResult {
  exitoso: boolean;
  mensaje: string;
  datos?: any;
}

// ✅ INTERFAZ ACTUALIZADA: Consulta con más información
export interface ConsultaAsistenciaResult {
  entrada?: AsistenciaMensualPersonalLocal;
  salida?: AsistenciaMensualPersonalLocal;
  encontrado: boolean;
  mensaje: string;
  // ✅ NUEVOS CAMPOS para diagnóstico
  estrategiaUsada?: string;
  fuenteDatos?: "INDEXEDDB" | "API" | "REDIS" | "CACHE_LOCAL";
  optimizado?: boolean;
}

// Interface para verificación de sincronización
export interface SincronizacionResult {
  estanSincronizados: boolean;
  razon: string;
  diasEntrada: number;
  diasSalida: number;
  diasEscolaresEntrada: number;
  diasEscolaresSalida: number;
}

// ✅ INTERFAZ ACTUALIZADA: Estadísticas con más información
export interface SincronizacionStats {
  totalRegistros: number;
  registrosNuevos: number;
  registrosExistentes: number;
  errores: number;
}

// Interface para configuración de servicios
export interface AsistenciaPersonalConfig {
  setIsSomethingLoading?: (isLoading: boolean) => void;
  setError?: (error: any) => void;
  setSuccessMessage?: (message: any) => void;
}

// ✅ INTERFAZ ACTUALIZADA: Cache con última actualización
export interface CacheData {
  clave: string;
  dni: string;
  actor: ActoresSistema;
  modoRegistro: ModoRegistro;
  tipoAsistencia: TipoAsistencia;
  timestamp: number;
  desfaseSegundos: number;
  estado: EstadosAsistenciaPersonal;
  fecha: string;
  timestampConsulta: number;
  // ✅ NUEVO CAMPO
  ultima_fecha_actualizacion: number;
}

// Interface para consulta de cache
export interface ConsultaCache {
  dni: string;
  actor: ActoresSistema;
  modoRegistro: ModoRegistro;
  tipoAsistencia: TipoAsistencia;
  fecha: string;
}

// ✅ INTERFAZ ACTUALIZADA: Eliminación con más detalles
export interface EliminacionResult {
  exitoso: boolean;
  mensaje: string;
  eliminadoLocal: boolean;
  eliminadoRedis: boolean;
  eliminadoCache: boolean;
}

// Interface para validación
export interface ValidacionResult {
  valido: boolean;
  errores: string[];
}

// Interface para verificación de marcado
export interface MarcadoHoyResult {
  marcado: boolean;
  timestamp?: number;
  desfaseSegundos?: number;
  estado?: string;
}

// Interface para parámetros de marcado de asistencia
export interface ParametrosMarcadoAsistencia {
  datos: {
    ModoRegistro: ModoRegistro;
    DNI: string;
    Rol: RolesSistema;
    Dia: number;
    Detalles?: {
      Timestamp: number;
      DesfaseSegundos: number;
    };
    esNuevoRegistro?: boolean;
  };
}

// Interface para parámetros de eliminación
export interface ParametrosEliminacionAsistencia {
  id_o_dni: string | number;
  rol: RolesSistema;
  modoRegistro: ModoRegistro;
  dia?: number;
  mes?: number;
  siasisAPI?: "API01" | "API02";
}

// ✅ INTERFAZ ACTUALIZADA: Consulta con opciones de optimización
export interface ParametrosConsultaAsistencia {
  rol: RolesSistema;
  id_o_dni: string | number;
  mes: number;
  // ✅ NUEVOS PARÁMETROS OPCIONALES para flujo inteligente
  forzarActualizacion?: boolean;
  saltarOptimizaciones?: boolean;
  estrategiaPersonalizada?: EstrategiaConsulta;
}

// ========================================================================================
// ✅ TYPE GUARDS CORREGIDOS Y ACTUALIZADOS
// ========================================================================================

// ✅ CORREGIDO: Usaba campo incorrecto
export function esAsistenciaMensualPersonal(
  obj: any
): obj is AsistenciaMensualPersonalLocal {
  return (
    obj &&
    typeof obj.Id_Registro_Mensual === "number" &&
    typeof obj.mes === "number" &&
    typeof obj.ID_o_DNI_Personal === "string" && // ✅ CORREGIDO: Era Dni_Personal
    typeof obj.registros === "object" &&
    typeof obj.ultima_fecha_actualizacion === "number" // ✅ NUEVO campo obligatorio
  );
}

// ✅ NUEVO: Type guard para datos raw de API/BD
export function esAsistenciaMensualPersonalRaw(
  obj: any
): obj is AsistenciaMensualPersonalRaw {
  return (
    obj &&
    typeof obj.Id_Registro_Mensual === "number" &&
    typeof obj.Mes === "number" &&
    typeof obj.ID_o_DNI_Personal === "string" &&
    (typeof obj.Entradas === "string" || obj.Entradas === null) &&
    (typeof obj.Salidas === "string" || obj.Salidas === null) &&
    typeof obj.ultima_fecha_actualizacion === "number"
  );
}

export function esRegistroEntradaSalida(
  obj: any
): obj is RegistroEntradaSalida {
  return (
    obj &&
    typeof obj.timestamp === "number" &&
    typeof obj.desfaseSegundos === "number" &&
    typeof obj.estado === "string"
  );
}

// ✅ NUEVO: Type guard para estrategia de consulta
export function esEstrategiaConsulta(obj: any): obj is EstrategiaConsulta {
  return (
    obj &&
    typeof obj.tipo === "string" &&
    typeof obj.estrategia === "string" &&
    typeof obj.debeConsultar === "boolean" &&
    typeof obj.razon === "string"
  );
}

// ========================================================================================
// CONSTANTES Y ENUMS ACTUALIZADOS
// ========================================================================================

// Constantes útiles
export const ROLES_VALIDOS_PERSONAL = [
  RolesSistema.ProfesorPrimaria,
  RolesSistema.ProfesorSecundaria,
  RolesSistema.Tutor,
  RolesSistema.Auxiliar,
  RolesSistema.PersonalAdministrativo,
] as const;

export const ESTADOS_ASISTENCIA_VALIDOS = [
  EstadosAsistenciaPersonal.En_Tiempo,
  EstadosAsistenciaPersonal.Tarde,
  EstadosAsistenciaPersonal.Cumplido,
  EstadosAsistenciaPersonal.Salida_Anticipada,
  EstadosAsistenciaPersonal.Falta,
  EstadosAsistenciaPersonal.Inactivo,
  EstadosAsistenciaPersonal.Sin_Registro,
] as const;

// ✅ NUEVA INTERFAZ: Para consulta específica de asistencia de hoy
export interface ConsultaMiAsistenciaHoyResult {
  marcada: boolean;
  timestamp?: number;
  estado?: EstadosAsistenciaPersonal;
  fuente: "REGISTRO_MENSUAL" | "CACHE_LOCAL" | "REDIS" | "NO_ENCONTRADO";
  mensaje: string;
}

// ✅ NUEVAS CONSTANTES para flujo inteligente
// export const HORARIOS_CONSULTA = {
//   INICIO_DIA_ESCOLAR: 6,
//   FIN_ENTRADAS: 12,
//   FIN_DIA_ESCOLAR: 22,
//   TOLERANCIA_TEMPRANO: 30, // minutos
// } as const;

export const ESTRATEGIAS_CONSULTA = {
  NO_CONSULTAR: "NO_CONSULTAR",
  REDIS_ENTRADAS: "REDIS_ENTRADAS",
  REDIS_COMPLETO: "REDIS_COMPLETO",
  API_CONSOLIDADO: "API_CONSOLIDADO",
  INDEXEDDB_OPTIMIZADO: "INDEXEDDB_OPTIMIZADO",
  LOGOUT_FORZADO: "LOGOUT_FORZADO",
} as const;

export const TIPOS_CONSULTA = {
  MES_FUTURO: "MES_FUTURO",
  MES_ANTERIOR: "MES_ANTERIOR",
  MES_ACTUAL: "MES_ACTUAL",
} as const;

// ✅ NUEVOS TIPOS PARA RETROCOMPATIBILIDAD
export type TipoConsulta = keyof typeof TIPOS_CONSULTA;
export type EstrategiaConsultaTipo = keyof typeof ESTRATEGIAS_CONSULTA;
