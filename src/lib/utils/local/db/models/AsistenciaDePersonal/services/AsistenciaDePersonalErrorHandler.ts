/* eslint-disable @typescript-eslint/no-explicit-any */
import { logout } from "@/lib/helpers/logout";
import { LogoutTypes, ErrorDetailsForLogout } from "@/interfaces/LogoutTypes";
import {
  ErrorResponseAPIBase,
  MessageProperty,
} from "@/interfaces/shared/apis/types";
import AllErrorTypes, {
  DataConflictErrorTypes,
  SystemErrorTypes,
  UserErrorTypes,
  DataErrorTypes,
  SyncErrorTypes,
  NetworkErrorTypes,
  StorageErrorTypes,
  PermissionErrorTypes,
} from "@/interfaces/shared/errors";

/**
 * 🎯 RESPONSABILIDAD: Manejo centralizado de errores
 * - Clasificar tipos de errores
 * - Decidir estrategias de recuperación
 * - Manejar logout cuando sea necesario
 * - Proporcionar mensajes de error útiles
 * - Registrar errores para debugging
 */
export class AsistenciaDePersonalErrorHandler {
  private setIsSomethingLoading?: (isLoading: boolean) => void;
  private setError?: (error: ErrorResponseAPIBase | null) => void;
  private setSuccessMessage?: (message: MessageProperty | null) => void;

  constructor(
    setIsSomethingLoading?: (isLoading: boolean) => void,
    setError?: (error: ErrorResponseAPIBase | null) => void,
    setSuccessMessage?: (message: MessageProperty | null) => void
  ) {
    this.setIsSomethingLoading = setIsSomethingLoading;
    this.setError = setError;
    this.setSuccessMessage = setSuccessMessage;
  }

  /**
   * Maneja los errores según su tipo y realiza logout si es necesario
   */
  public handleError(
    error: unknown,
    operacion: string,
    detalles?: Record<string, any>
  ): void {
    console.error(`Error en AsistenciaDePersonalIDB (${operacion}):`, error);

    const errorDetails: ErrorDetailsForLogout = {
      origen: `AsistenciaDePersonalIDB.${operacion}`,
      mensaje: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
      contexto: JSON.stringify(detalles || {}),
      siasisComponent: "CLN01",
    };

    let logoutType: LogoutTypes;

    if (error instanceof Error) {
      if (error.name === "QuotaExceededError") {
        logoutType = LogoutTypes.ERROR_BASE_DATOS;
      } else if (error.name === "AbortError") {
        logoutType = LogoutTypes.ERROR_BASE_DATOS;
      } else {
        logoutType = LogoutTypes.ERROR_SISTEMA;
      }
    } else {
      logoutType = LogoutTypes.ERROR_SISTEMA;
    }

    logout(logoutType, errorDetails);
  }

  /**
   * Maneja errores de operaciones con IndexedDB adaptado al patrón actual
   */
  public handleIndexedDBError(error: unknown, operacion: string): void {
    console.error(`Error en operación IndexedDB (${operacion}):`, error);

    let errorType: AllErrorTypes = SystemErrorTypes.UNKNOWN_ERROR;
    let message = `Error al ${operacion}`;

    if (error instanceof Error) {
      if (error.name === "ConstraintError") {
        errorType = DataConflictErrorTypes.VALUE_ALREADY_IN_USE;
        message = `Error de restricción al ${operacion}: valor duplicado`;
      } else if (error.name === "NotFoundError") {
        errorType = UserErrorTypes.USER_NOT_FOUND;
        message = `No se encontró el recurso al ${operacion}`;
      } else if (error.name === "QuotaExceededError") {
        errorType = SystemErrorTypes.DATABASE_ERROR;
        message = `Almacenamiento excedido al ${operacion}`;
      } else if (error.name === "TransactionInactiveError") {
        errorType = SystemErrorTypes.DATABASE_ERROR;
        message = `Transacción inactiva al ${operacion}`;
      } else {
        message = error.message || message;
      }
    }

    this.setError?.({
      success: false,
      message: message,
      errorType: errorType,
    });
  }

  /**
   * Establece un mensaje de éxito usando el patrón actual
   */
  public handleSuccess(message: string): void {
    const successResponse: MessageProperty = { message };
    this.setSuccessMessage?.(successResponse);
  }

  /**
   * Maneja errores específicos de API
   */
  public handleAPIError(error: any, operacion: string): void {
    console.error(`Error en operación API (${operacion}):`, error);

    let errorType: AllErrorTypes = SystemErrorTypes.UNKNOWN_ERROR;
    let message = `Error al ${operacion}`;

    // Errores HTTP específicos
    if (error?.response?.status === 404) {
      errorType = DataErrorTypes.NO_DATA_AVAILABLE;
      message = `No se encontraron datos para ${operacion}`;
    } else if (error?.response?.status === 401) {
      errorType = UserErrorTypes.INVALID_CREDENTIALS;
      message = `No autorizado para ${operacion}`;
    } else if (error?.response?.status === 403) {
      errorType = PermissionErrorTypes.INSUFFICIENT_PERMISSIONS;
      message = `Sin permisos para ${operacion}`;
    } else if (error?.response?.status === 500) {
      errorType = SystemErrorTypes.SERVER_ERROR;
      message = `Error del servidor al ${operacion}`;
    } else if (error?.code === "NETWORK_ERROR") {
      errorType = NetworkErrorTypes.NETWORK_ERROR;
      message = `Error de conexión al ${operacion}`;
    } else if (error?.code === "TIMEOUT") {
      errorType = NetworkErrorTypes.TIMEOUT_ERROR;
      message = `Tiempo de espera agotado al ${operacion}`;
    } else if (error instanceof Error) {
      message = error.message || message;
    }

    this.setError?.({
      success: false,
      message: message,
      errorType: errorType,
    });
  }

  /**
   * Maneja errores de cache
   */
  public handleCacheError(error: unknown, operacion: string): void {
    console.error(`Error en operación de cache (${operacion}):`, error);

    let errorType: AllErrorTypes = SystemErrorTypes.DATABASE_ERROR;
    let message = `Error en cache al ${operacion}`;

    if (error instanceof Error) {
      if (error.name === "QuotaExceededError") {
        errorType = StorageErrorTypes.STORAGE_FULL;
        message = `Cache lleno al ${operacion}`;
      } else if (error.name === "NotFoundError") {
        errorType = DataErrorTypes.NO_DATA_AVAILABLE;
        message = `No se encontró en cache al ${operacion}`;
      } else {
        message = error.message || message;
      }
    }

    this.setError?.({
      success: false,
      message: message,
      errorType: errorType,
    });
  }

  /**
   * Maneja errores de sincronización
   */
  public handleSyncError(error: unknown, operacion: string): void {
    console.error(`Error en sincronización (${operacion}):`, error);

    let errorType: AllErrorTypes = SyncErrorTypes.SYNC_ERROR;
    let message = `Error de sincronización al ${operacion}`;

    if (error instanceof Error) {
      if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        errorType = NetworkErrorTypes.NETWORK_ERROR;
        message = `Error de red durante sincronización al ${operacion}`;
      } else if (error.message.includes("timeout")) {
        errorType = NetworkErrorTypes.TIMEOUT_ERROR;
        message = `Tiempo agotado durante sincronización al ${operacion}`;
      } else {
        message = error.message || message;
      }
    }

    this.setError?.({
      success: false,
      message: message,
      errorType: errorType,
    });
  }

  /**
   * Determina si un error requiere logout
   */
  public shouldLogout(error: unknown): boolean {
    if (error instanceof Error) {
      // Errores críticos que requieren logout
      const criticalErrors = [
        "QuotaExceededError",
        "SecurityError",
        "InvalidStateError",
      ];

      return criticalErrors.includes(error.name);
    }

    // Errores de API que requieren logout
    if (error && typeof error === "object") {
      const apiError = error as any;
      if (
        apiError.response?.status === 401 ||
        apiError.response?.status === 403
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Obtiene el tipo de logout apropiado para el error
   */
  public getLogoutType(error: unknown): LogoutTypes {
    if (error instanceof Error) {
      if (error.name === "QuotaExceededError" || error.name === "AbortError") {
        return LogoutTypes.ERROR_BASE_DATOS;
      }
      if (error.name === "SecurityError") {
        return LogoutTypes.ERROR_SEGURIDAD;
      }
    }

    if (error && typeof error === "object") {
      const apiError = error as any;
      if (
        apiError.response?.status === 401 ||
        apiError.response?.status === 403
      ) {
        return LogoutTypes.ERROR_AUTENTICACION;
      }
    }

    return LogoutTypes.ERROR_SISTEMA;
  }

  /**
   * Registra un error para debugging sin mostrar al usuario
   */
  public logError(
    error: unknown,
    context: string,
    metadata?: Record<string, any>
  ): void {
    console.error(`[${context}] Error registrado:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Crea un mensaje de error amigable para el usuario
   */
  public createUserFriendlyMessage(error: unknown, operacion: string): string {
    if (error instanceof Error) {
      switch (error.name) {
        case "QuotaExceededError":
          return "El almacenamiento local está lleno. Por favor, libere espacio o contacte al administrador.";
        case "NetworkError":
          return "No hay conexión a internet. Verifique su conexión y vuelva a intentar.";
        case "TimeoutError":
          return "La operación tardó demasiado tiempo. Vuelva a intentar en unos momentos.";
        case "NotFoundError":
          return "No se encontraron los datos solicitados.";
        default:
          return `Error al ${operacion}. Si el problema persiste, contacte al soporte técnico.`;
      }
    }

    return `Ocurrió un error inesperado al ${operacion}. Por favor, intente nuevamente.`;
  }

  /**
   * Maneja errores con estrategia de recuperación
   */
  public handleErrorWithRecovery(
    error: unknown,
    operacion: string,
    recoveryStrategy?: () => Promise<void>
  ): void {
    const userMessage = this.createUserFriendlyMessage(error, operacion);

    this.setError?.({
      success: false,
      message: userMessage,
      errorType: SystemErrorTypes.UNKNOWN_ERROR,
    });

    // Ejecutar estrategia de recuperación si se proporciona
    if (recoveryStrategy) {
      recoveryStrategy().catch((recoveryError) => {
        console.error("Error en estrategia de recuperación:", recoveryError);
      });
    }

    // Decidir si hacer logout
    if (this.shouldLogout(error)) {
      const logoutType = this.getLogoutType(error);
      const errorDetails: ErrorDetailsForLogout = {
        origen: `AsistenciaPersonalErrorHandler.${operacion}`,
        mensaje: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
        contexto: JSON.stringify({ operacion }),
        siasisComponent: "CLN01",
      };

      logout(logoutType, errorDetails);
    }
  }

  /**
   * Maneja errores de validación
   */
  public handleValidationError(errores: string[], operacion: string): void {
    const message = `Errores de validación al ${operacion}: ${errores.join(
      ", "
    )}`;

    this.setError?.({
      success: false,
      message,
      errorType: DataErrorTypes.INVALID_DATA_FORMAT,
    });
  }

  // ✅ CORREGIDO - AsistenciaDePersonalErrorHandler.ts
  public clearErrors(): void {
    this.setError?.(null);
    // ❌ NO terminar loading aquí
    // this.setIsSomethingLoading?.(false);
  }

  // ✅ NUEVO método separado si necesitas limpiar loading
  public clearErrorsAndLoading(): void {
    this.setError?.(null);
    this.setIsSomethingLoading?.(false);
  }
  
  /**
   * Establece estado de loading
   */
  public setLoading(isLoading: boolean): void {
    this.setIsSomethingLoading?.(isLoading);
  }
}
