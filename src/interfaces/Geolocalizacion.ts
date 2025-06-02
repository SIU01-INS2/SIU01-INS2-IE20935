



export interface PuntoGeografico {
  latitud: number;
  longitud: number;
}


// src/enums/GeolocationEnums.ts

/**
 * Estados posibles del dispositivo en relación a la geolocalización
 */
export enum EstadoDispositivo {
  DENTRO_DEL_COLEGIO = 'DENTRO_DEL_COLEGIO',
  FUERA_DEL_COLEGIO = 'FUERA_DEL_COLEGIO',
  UBICACION_DESCONOCIDA = 'UBICACION_DESCONOCIDA',
  ERROR_PERMISOS = 'ERROR_PERMISOS',
  ERROR_TIMEOUT = 'ERROR_TIMEOUT',
  ERROR_POSICION_NO_DISPONIBLE = 'ERROR_POSICION_NO_DISPONIBLE',
  ERROR_DESCONOCIDO = 'ERROR_DESCONOCIDO',
  CARGANDO = 'CARGANDO'
}

/**
 * Estados de permisos de geolocalización
 */
export enum EstadoPermisos {
  CONCEDIDO = 'granted',
  DENEGADO = 'denied',
  SOLICITADO = 'prompt',
  NO_SOPORTADO = 'not-supported'
}

/**
 * Tipos de errores de geolocalización
 */
export enum TipoErrorGeolocalizacion {
  PERMISSION_DENIED = 1,
  POSITION_UNAVAILABLE = 2,
  TIMEOUT = 3
}

/**
 * Tipos de modales a mostrar
 */
export enum TipoModal {
  BIENVENIDA_DENTRO_COLEGIO = 'BIENVENIDA_DENTRO_COLEGIO',
  ALERTA_FUERA_COLEGIO = 'ALERTA_FUERA_COLEGIO',
  ERROR_PERMISOS_UBICACION = 'ERROR_PERMISOS_UBICACION',
  ERROR_UBICACION_NO_DISPONIBLE = 'ERROR_UBICACION_NO_DISPONIBLE',
  ERROR_TIMEOUT = 'ERROR_TIMEOUT',
  CARGANDO_UBICACION = 'CARGANDO_UBICACION',
  ERROR_GENERICO = 'ERROR_GENERICO'
}

/**
 * Acciones disponibles en los modales
 */
export enum AccionModal {
  REINTENTAR = 'REINTENTAR',
  CONFIGURAR_PERMISOS = 'CONFIGURAR_PERMISOS',
  CONTINUAR = 'CONTINUAR',
  CANCELAR = 'CANCELAR',
  CERRAR = 'CERRAR'
}