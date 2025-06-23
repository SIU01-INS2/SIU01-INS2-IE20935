/**
 * 🔄 TIPOS DE ERROR UNIFICADOS - API01 & SIU01 COMPATIBLE
 *
 * ✅ Retrocompatible con ambos componentes
 * ✅ Sincronizado entre proyectos
 * ✅ Tipos adicionales para sistema de asistencia
 *
 * Última actualización: 2024-12-19
 */

/**
 * Errores relacionados con parámetros de solicitudes HTTP
 */
export enum RequestErrorTypes {
  INVALID_PARAMETERS = "INVALID_PARAMETERS",
  MISSING_PARAMETERS = "MISSING_PARAMETERS",
  REQUEST_FAILED = "REQUEST_FAILED",
  MALFORMED_REQUEST = "MALFORMED_REQUEST", // 🆕 Solicitud mal formada
  PAYLOAD_TOO_LARGE = "PAYLOAD_TOO_LARGE", // 🆕 Carga útil demasiado grande
}

/**
 * Errores relacionados con tokens de autenticación
 */
export enum TokenErrorTypes {
  TOKEN_UNAUTHORIZED = "TOKEN_UNAUTHORIZED",
  TOKEN_MISSING = "TOKEN_MISSING", // No se proporcionó token
  TOKEN_INVALID_FORMAT = "TOKEN_INVALID_FORMAT", // Formato Bearer inválido
  TOKEN_EXPIRED = "TOKEN_EXPIRED", // Token expirado
  TOKEN_MALFORMED = "TOKEN_MALFORMED", // Token mal formado (no decodificable)
  TOKEN_INVALID_SIGNATURE = "TOKEN_INVALID_SIGNATURE", // Firma inválida
  TOKEN_WRONG_ROLE = "TOKEN_WRONG_ROLE", // Token tiene rol equivocado
  TOKEN_REVOKED = "TOKEN_REVOKED", // 🆕 Token revocado
  TOKEN_NOT_ACTIVE_YET = "TOKEN_NOT_ACTIVE_YET", // 🆕 Token aún no activo
}

/**
 * Errores relacionados con usuarios
 */
export enum UserErrorTypes {
  USER_NOT_FOUND = "USER_NOT_FOUND", // Usuario no encontrado
  USER_INACTIVE = "USER_INACTIVE", // El usuario está inactivo
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  USER_ROLE_MISMATCH = "USER_ROLE_MISMATCH",
  USER_SUSPENDED = "USER_SUSPENDED", // 🆕 Usuario suspendido
  USER_DELETED = "USER_DELETED", // 🆕 Usuario eliminado
}

/**
 * Errores relacionados con roles y permisos
 */
export enum PermissionErrorTypes {
  ROLE_BLOCKED = "ROLE_BLOCKED", // El rol está temporalmente bloqueado
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS", // Sin permisos suficientes
  ROLE_NOT_FOUND = "ROLE_NOT_FOUND", // 🆕 Rol no encontrado
  PERMISSION_DENIED = "PERMISSION_DENIED", // 🆕 Permiso denegado explícitamente
}

/**
 * Errores técnicos del sistema
 */
export enum SystemErrorTypes {
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR", // Error al conectar con la base de datos
  UNKNOWN_ERROR = "UNKNOWN_ERROR", // Error desconocido
  SERVER_ERROR = "SERVER_ERROR", // 🆕 Error interno del servidor
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE", // 🆕 Servicio no disponible
  MAINTENANCE_MODE = "MAINTENANCE_MODE", // 🆕 Modo mantenimiento
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED", // 🆕 Límite de velocidad excedido
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR", // 🆕 Error de configuración
}

/**
 * Errores relacionados a validaciones de datos
 */
export enum ValidationErrorTypes {
  INVALID_DNI = "INVALID_DNI",
  INVALID_GENDER = "INVALID_GENDER",
  INVALID_PHONE = "INVALID_PHONE",
  INVALID_EMAIL = "INVALID_EMAIL",
  INVALID_USERNAME = "INVALID_USERNAME",
  INVALID_NAME = "INVALID_NAME",
  INVALID_LASTNAME = "INVALID_LASTNAME",
  STRING_TOO_LONG = "STRING_TOO_LONG",
  FIELD_REQUIRED = "FIELD_REQUIRED",
  INVALID_FORMAT = "INVALID_FORMAT",
  REQUIRED_FIELDS = "REQUIRED_FIELDS",
  INVALID_REFERENCE = "INVALID_REFERENCE",
  VALUE_ALREADY_EXISTS = "VALUE_ALREADY_EXISTS",
  INVALID_DATE_FORMAT = "INVALID_DATE_FORMAT", // 🆕 Formato de fecha inválido
  DATE_OUT_OF_RANGE = "DATE_OUT_OF_RANGE", // 🆕 Fecha fuera de rango
  INVALID_TIME_FORMAT = "INVALID_TIME_FORMAT", // 🆕 Formato de hora inválido
  INVALID_ENUM_VALUE = "INVALID_ENUM_VALUE", // 🆕 Valor de enumeración inválido
}

/**
 * Errores relacionados con conflictos de datos
 */
export enum DataConflictErrorTypes {
  VALUE_ALREADY_IN_USE = "CONFLICTO_VALOR_YA_EN_USO",
  RECORD_NOT_FOUND = "CONFLICTO_REGISTRO_NO_ENCONTRADO",
  RELATED_DATA_EXISTS = "CONFLICTO_DATOS_RELACIONADOS_EXISTEN",
  DATABASE_CONSTRAINT = "CONFLICTO_RESTRICCIÓN_BASE_DATOS",
  CONCURRENT_MODIFICATION = "CONFLICTO_MODIFICACIÓN_CONCURRENTE", // 🆕 Modificación concurrente
  VERSION_MISMATCH = "CONFLICTO_VERSIÓN_NO_COINCIDE", // 🆕 Versión no coincide
  DEPENDENCY_EXISTS = "CONFLICTO_DEPENDENCIA_EXISTE", // 🆕 Existe dependencia
}

/**
 * Errores relacionados con archivos
 */
export enum FileErrorTypes {
  FILE_MISSING = "FILE_MISSING",
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  FILE_UPLOAD_FAILED = "FILE_UPLOAD_FAILED",
  FILE_DELETE_FAILED = "FILE_DELETE_FAILED",
  FILE_CORRUPTED = "FILE_CORRUPTED", // 🆕 Archivo corrupto
  FILE_PROCESSING_FAILED = "FILE_PROCESSING_FAILED", // 🆕 Procesamiento falló
  INSUFFICIENT_STORAGE = "INSUFFICIENT_STORAGE", // 🆕 Almacenamiento insuficiente
}

/**
 * Errores relacionados con autenticación
 */
export enum AuthenticationErrorTypes {
  MAX_ATTEMPTS_EXCEEDED = "MAX_ATTEMPTS_EXCEEDED",
  VERIFICATION_FAILED = "VERIFICATION_FAILED",
  CHALLENGE_REQUIRED = "CHALLENGE_REQUIRED",
  OTP_INVALID = "OTP_INVALID",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  TEMPORARY_BLOCKED = "TEMPORARY_BLOCKED",
  OTP_EXPIRED = "OTP_EXPIRED", // 🆕 OTP expirado
  OTP_ALREADY_USED = "OTP_ALREADY_USED", // 🆕 OTP ya usado
  AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED", // 🆕 Autenticación requerida
}

/**
 * Errores relacionados con datos
 */
export enum DataErrorTypes {
  RECORD_NOT_FOUND = "RECORD_NOT_FOUND", // Registro específico no encontrado
  NO_DATA_AVAILABLE = "NO_DATA_AVAILABLE", // No hay datos disponibles para el período
  DATA_NOT_EXISTS = "DATA_NOT_EXISTS", // Los datos no existen para los parámetros dados
  INVALID_DATA_FORMAT = "INVALID_DATA_FORMAT", // 🆕 Formato de datos inválido
  DATA_CORRUPTED = "DATA_CORRUPTED", // 🆕 Datos corruptos
  DATA_INCONSISTENT = "DATA_INCONSISTENT", // 🆕 Datos inconsistentes
}

/**
 * 🆕 Errores relacionados con red y conectividad
 */
export enum NetworkErrorTypes {
  NETWORK_ERROR = "NETWORK_ERROR", // Error de red general
  CONNECTION_TIMEOUT = "CONNECTION_TIMEOUT", // Tiempo de conexión agotado
  TIMEOUT_ERROR = "TIMEOUT_ERROR", // Error de tiempo de espera
  CONNECTION_REFUSED = "CONNECTION_REFUSED", // Conexión rechazada
  DNS_ERROR = "DNS_ERROR", // Error de DNS
  OFFLINE = "OFFLINE", // Sin conexión
  POOR_CONNECTION = "POOR_CONNECTION", // Conexión débil
}

/**
 * 🆕 Errores relacionados con sincronización (para sistema de asistencia)
 */
export enum SyncErrorTypes {
  SYNC_ERROR = "SYNC_ERROR", // Error de sincronización general
  SYNC_CONFLICT = "SYNC_CONFLICT", // Conflicto de sincronización
  SYNC_TIMEOUT = "SYNC_TIMEOUT", // Tiempo de sincronización agotado
  SYNC_FAILED = "SYNC_FAILED", // Sincronización falló
  SYNC_INTERRUPTED = "SYNC_INTERRUPTED", // Sincronización interrumpida
  SYNC_DATA_MISMATCH = "SYNC_DATA_MISMATCH", // Datos no coinciden en sincronización
}

/**
 * 🆕 Errores relacionados con cache
 */
export enum CacheErrorTypes {
  CACHE_ERROR = "CACHE_ERROR", // Error de cache general
  CACHE_MISS = "CACHE_MISS", // Cache miss
  CACHE_EXPIRED = "CACHE_EXPIRED", // Cache expirado
  CACHE_CORRUPTED = "CACHE_CORRUPTED", // Cache corrupto
  CACHE_FULL = "CACHE_FULL", // Cache lleno
  CACHE_UNAVAILABLE = "CACHE_UNAVAILABLE", // Cache no disponible
}

/**
 * 🆕 Errores relacionados con almacenamiento local
 */
export enum StorageErrorTypes {
  STORAGE_FULL = "STORAGE_FULL", // Almacenamiento lleno
  STORAGE_ERROR = "STORAGE_ERROR", // Error de almacenamiento general
  STORAGE_UNAVAILABLE = "STORAGE_UNAVAILABLE", // Almacenamiento no disponible
  STORAGE_CORRUPTED = "STORAGE_CORRUPTED", // Almacenamiento corrupto
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED", // Cuota excedida
  INDEXEDDB_ERROR = "INDEXEDDB_ERROR", // Error específico de IndexedDB
}

/**
 * 🆕 Errores relacionados con operaciones de asistencia
 */
export enum AttendanceErrorTypes {
  ATTENDANCE_ALREADY_MARKED = "ATTENDANCE_ALREADY_MARKED", // Asistencia ya marcada
  ATTENDANCE_WINDOW_CLOSED = "ATTENDANCE_WINDOW_CLOSED", // Ventana de asistencia cerrada
  INVALID_ATTENDANCE_TIME = "INVALID_ATTENDANCE_TIME", // Hora de asistencia inválida
  ATTENDANCE_NOT_FOUND = "ATTENDANCE_NOT_FOUND", // Asistencia no encontrada
  ATTENDANCE_LOCKED = "ATTENDANCE_LOCKED", // Asistencia bloqueada
  SCHEDULE_CONFLICT = "SCHEDULE_CONFLICT", // Conflicto de horario
}

/**
 * Tipo unión que incluye todos los tipos de error
 * ✅ Retrocompatible con versiones anteriores
 * ✅ Extensible para nuevos tipos de error
 */
type AllErrorTypes =
  | RequestErrorTypes
  | TokenErrorTypes
  | UserErrorTypes
  | PermissionErrorTypes
  | SystemErrorTypes
  | ValidationErrorTypes
  | DataConflictErrorTypes
  | FileErrorTypes
  | DataErrorTypes
  | AuthenticationErrorTypes
  | NetworkErrorTypes // 🆕
  | SyncErrorTypes // 🆕
  | CacheErrorTypes // 🆕
  | StorageErrorTypes // 🆕
  | AttendanceErrorTypes; // 🆕

export default AllErrorTypes;

// ================================================================
// 🔄 EXPORTACIONES PARA RETROCOMPATIBILIDAD
// ================================================================



/**
 * 🆕 Grupos de errores para facilitar el manejo
 */
export const ErrorGroups = {
  // Errores críticos que requieren logout inmediato
  CRITICAL_ERRORS: [
    TokenErrorTypes.TOKEN_EXPIRED,
    TokenErrorTypes.TOKEN_REVOKED,
    AuthenticationErrorTypes.ACCOUNT_LOCKED,
    UserErrorTypes.USER_SUSPENDED,
    UserErrorTypes.USER_DELETED,
  ],

  // Errores de conectividad que permiten reintento
  CONNECTIVITY_ERRORS: [
    NetworkErrorTypes.NETWORK_ERROR,
    NetworkErrorTypes.CONNECTION_TIMEOUT,
    NetworkErrorTypes.TIMEOUT_ERROR,
    NetworkErrorTypes.CONNECTION_REFUSED,
    NetworkErrorTypes.OFFLINE,
  ],

  // Errores de datos que requieren sincronización
  SYNC_REQUIRED_ERRORS: [
    SyncErrorTypes.SYNC_CONFLICT,
    SyncErrorTypes.SYNC_DATA_MISMATCH,
    DataErrorTypes.DATA_INCONSISTENT,
    CacheErrorTypes.CACHE_CORRUPTED,
  ],

  // Errores de almacenamiento que requieren limpieza
  STORAGE_CLEANUP_ERRORS: [
    StorageErrorTypes.STORAGE_FULL,
    StorageErrorTypes.QUOTA_EXCEEDED,
    CacheErrorTypes.CACHE_FULL,
  ],

  // Errores de validación que el usuario puede corregir
  USER_CORRECTABLE_ERRORS: [
    ...Object.values(ValidationErrorTypes),
    RequestErrorTypes.INVALID_PARAMETERS,
    RequestErrorTypes.MISSING_PARAMETERS,
  ],
} as const;

