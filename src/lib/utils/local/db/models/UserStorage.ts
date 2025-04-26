import { SuccessLoginData } from "@/interfaces/shared/apis/shared/login/types";
import dbConnection from "../IndexedDBConnection";
import { logout } from "@/lib/helpers/logout";
import { LogoutTypes, ErrorDetailsForLogout } from "@/interfaces/LogoutTypes";
import { Genero } from "@/interfaces/shared/Genero";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";

// Extendemos SuccessLoginData con la nueva propiedad
export interface UserData extends SuccessLoginData {
  ultimaSincronizacionTablas?: number; // Nueva propiedad añadida
}

class UserStorage {
  private storeName: string = "user_data";

  /**
   * Maneja los errores según su tipo y realiza logout si es necesario
   * @param error Error capturado
   * @param operacion Descripción de la operación que falló
   * @param detalles Detalles adicionales del error
   */
  private handleError(
    error: unknown,
    operacion: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    detalles?: Record<string, any>
  ): void {
    console.error(`Error en UserStorage (${operacion}):`, error);

    // Crear objeto con detalles del error
    const errorDetails: ErrorDetailsForLogout = {
      origen: `UserStorage.${operacion}`,
      mensaje: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
      contexto: JSON.stringify(detalles || {}),
      siasisComponent: "CLN01",
    };

    // Determinar el tipo de error
    let logoutType: LogoutTypes;

    if (error instanceof Error) {
      if (error.name === "QuotaExceededError") {
        logoutType = LogoutTypes.ERROR_BASE_DATOS;
      } else if (error.name === "AbortError") {
        logoutType = LogoutTypes.ERROR_BASE_DATOS;
      } else if (error.message.includes("No hay datos de usuario")) {
        logoutType = LogoutTypes.SESION_EXPIRADA;
      } else if (error.message.includes("token")) {
        logoutType = LogoutTypes.SESION_EXPIRADA;
      } else {
        logoutType = LogoutTypes.ERROR_SISTEMA;
      }
    } else {
      logoutType = LogoutTypes.ERROR_SISTEMA;
    }

    // Cerrar sesión con los detalles del error
    logout(logoutType, errorDetails);
  }

  /**
   * Guarda los datos del usuario en IndexedDB, actualizando solo las propiedades proporcionadas
   * @param userData Datos parciales del usuario a guardar
   * @returns Promise que se resuelve cuando los datos se han guardado
   */
  public async saveUserData(userData: Partial<UserData>): Promise<void> {
    try {
      // Asegurarnos de que la conexión está inicializada
      await dbConnection.init();

      // Primero, obtenemos los datos actuales (si existen)
      const currentUserData = await this.getUserData();

      // Obtener el almacén de datos
      const store = await dbConnection.getStore(this.storeName, "readwrite");

      // Combinamos los datos actuales con los nuevos datos
      // Si currentUserData es null, usamos un objeto vacío
      const dataToSave = {
        ...(currentUserData || {}),
        ...userData, // Solo se sobrescriben las propiedades incluidas en userData
        last_updated: Date.now(),
      };

      // Usamos un ID fijo 'current_user' para siempre actualizar los mismos datos
      return new Promise((resolve, reject) => {
        const request = store.put(dataToSave, "current_user");

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = (event) => {
          reject(
            new Error(
              `Error al guardar datos de usuario: ${
                (event.target as IDBRequest).error
              }`
            )
          );
        };
      });
    } catch (error) {
      this.handleError(error, "saveUserData", {
        datosSolicitados: Object.keys(userData),
        timeStamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Obtiene los datos del usuario almacenados
   * @returns Promise que se resuelve con los datos del usuario o null si no hay datos
   */
  public async getUserData(): Promise<UserData | null> {
    try {
      // Asegurarnos de que la conexión está inicializada
      await dbConnection.init();

      // Obtener el almacén de datos
      const store = await dbConnection.getStore(this.storeName, "readonly");

      return new Promise((resolve, reject) => {
        const request = store.get("current_user");

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = (event) => {
          reject(
            new Error(
              `Error al obtener datos de usuario: ${
                (event.target as IDBRequest).error
              }`
            )
          );
        };
      });
    } catch (error) {
      this.handleError(error, "getUserData");
      throw error;
    }
  }

  /**
   * Actualiza solo el token de autenticación
   * @param token Nuevo token de autenticación
   * @returns Promise que se resuelve cuando el token se ha actualizado
   */
  public async updateAuthToken(token: string): Promise<void> {
    try {
      const userData = await this.getUserData();

      if (!userData) {
        throw new Error("No hay datos de usuario para actualizar el token");
      }

      // Actualizar solo el token
      await this.saveUserData({
        ...userData,
        token,
      });
    } catch (error) {
      this.handleError(error, "updateAuthToken", {
        tokenLength: token?.length || 0,
      });
      throw error;
    }
  }

  /**
   * Obtiene solo el token de autenticación
   * @returns Promise que se resuelve con el token o null si no hay token
   */
  public async getAuthToken(): Promise<string> {
    try {
      const userData = await this.getUserData();
      if (!userData?.token) {
        throw new Error("Token no disponible en los datos del usuario");
      }
      return userData.token;
    } catch (error) {
      this.handleError(error, "getAuthToken");
      throw error;
    }
  }

  /**
   * Obtiene el rol del usuario almacenado
   * @returns Promise que se resuelve con el rol del usuario o null si no hay datos
   */
  public async getRol(): Promise<RolesSistema> {
    try {
      const userData = await this.getUserData();
      if (!userData?.Rol) {
        throw new Error("Rol no disponible en los datos del usuario");
      }
      return userData.Rol;
    } catch (error) {
      this.handleError(error, "getRol");
      throw error;
    }
  }

  /**
   * Obtiene el género del usuario almacenado
   * @returns Promise que se resuelve con el género del usuario o null si no hay datos
   */
  public async getGenero(): Promise<Genero | null> {
    try {
      const userData = await this.getUserData();
      return userData?.Genero || null;
    } catch (error) {
      this.handleError(error, "getGenero");
      throw error;
    }
  }

  /**
   * Obtiene el nombre completo del usuario
   * @returns Promise que se resuelve con el nombre completo o null si no hay datos
   */
  public async getNombres(): Promise<string | null> {
    try {
      const userData = await this.getUserData();
      if (!userData?.Nombres) {
        throw new Error("Nombres no disponibles en los datos del usuario");
      }
      return userData.Nombres;
    } catch (error) {
      this.handleError(error, "getNombres");
      throw error;
    }
  }

  /**
   * Obtiene los apellidos del usuario
   * @returns Promise que se resuelve con los apellidos o null si no hay datos
   */
  public async getApellidos(): Promise<string | null> {
    try {
      const userData = await this.getUserData();
      if (!userData?.Apellidos) {
        throw new Error("Apellidos no disponibles en los datos del usuario");
      }
      return userData.Apellidos;
    } catch (error) {
      this.handleError(error, "getApellidos");
      throw error;
    }
  }

  /**
   * Obtiene el primer nombre del usuario
   * @returns Promise que se resuelve con el primer nombre o null si no hay datos
   */
  public async getPrimerNombre(): Promise<string | null> {
    try {
      const nombres = await this.getNombres();
      if (!nombres) return null;

      // Dividir el nombre por espacios y tomar el primer elemento
      const primerNombre = nombres.split(" ")[0];

      return primerNombre;
    } catch (error) {
      this.handleError(error, "getPrimerNombre");
      throw error;
    }
  }

  /**
   * Obtiene el primer apellido del usuario
   * @returns Promise que se resuelve con el primer apellido o null si no hay datos
   */
  public async getPrimerApellido(): Promise<string | null> {
    try {
      const apellidos = await this.getApellidos();

      if (!apellidos) return null;

      // Dividir los apellidos por espacios y tomar el primer elemento
      const primerApellido = apellidos.split(" ")[0];
      return primerApellido;
    } catch (error) {
      this.handleError(error, "getPrimerApellido");
      throw error;
    }
  }

  /**
   * Obtiene las iniciales del nombre y apellido del usuario
   * @returns Promise que se resuelve con las iniciales o null si no hay datos
   */
  public async getIniciales(): Promise<string | null> {
    try {
      const primerNombre = await this.getPrimerNombre();
      const primerApellido = await this.getPrimerApellido();

      if (!primerNombre || !primerApellido) return null;

      return `${primerNombre.charAt(0)}${primerApellido.charAt(
        0
      )}`.toUpperCase();
    } catch (error) {
      this.handleError(error, "getIniciales");
      throw error;
    }
  }

  /**
   * Obtiene el nombre completo del usuario (nombres + apellidos)
   * @returns Promise que se resuelve con el nombre completo o null si no hay datos
   */
  public async getNombreCompleto(): Promise<string | null> {
    try {
      const nombres = await this.getNombres();
      const apellidos = await this.getApellidos();

      if (!nombres || !apellidos) return null;

      return `${nombres} ${apellidos}`;
    } catch (error) {
      this.handleError(error, "getNombreCompleto");
      throw error;
    }
  }

  /**
   * Obtiene el nombre de usuario para mostrar en la interfaz
   * @returns Promise que se resuelve con el nombre de usuario formateado
   */
  public async getNombreCompletoCorto(): Promise<string | null> {
    try {
      const userData = await this.getUserData();
      if (!userData) return null;

      const primerNombre = await this.getPrimerNombre();
      const apellidos = await this.getPrimerApellido();

      if (!primerNombre || !apellidos) return null;

      return `${primerNombre} ${apellidos}`;
    } catch (error) {
      this.handleError(error, "getNombreCompletoCorto");
      throw error;
    }
  }

  /**
   * Guarda la última marca de tiempo de sincronización de las tablas
   * @param timestamp Marca de tiempo de la sincronización
   * @returns Promise que se resuelve cuando se ha guardado la marca de tiempo
   */
  public async guardarUltimaSincronizacion(timestamp: number): Promise<void> {
    try {
      const userData = await this.getUserData();

      await this.saveUserData({
        ...(userData || {}),
        ultimaSincronizacionTablas: timestamp,
      });
    } catch (error) {
      this.handleError(error, "guardarUltimaSincronizacion", { timestamp });
      throw error;
    }
  }

  /**
   * Obtiene la última marca de tiempo de sincronización de las tablas
   * @returns Promise que se resuelve con la marca de tiempo o null si no hay marca de tiempo
   */
  public async obtenerUltimaSincronizacion(): Promise<number | null> {
    try {
      const userData = await this.getUserData();
      return userData?.ultimaSincronizacionTablas || null;
    } catch (error) {
      this.handleError(error, "obtenerUltimaSincronizacion");
      throw error;
    }
  }

  /**
   * Elimina todos los datos del usuario
   * @returns Promise que se resuelve cuando los datos se han eliminado
   */
  public async clearUserData(): Promise<void> {
    try {
      // Asegurarnos de que la conexión está inicializada
      await dbConnection.init();

      // Obtener el almacén de datos
      const store = await dbConnection.getStore(this.storeName, "readwrite");

      return new Promise((resolve, reject) => {
        const request = store.delete("current_user");

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = (event) => {
          reject(
            new Error(
              `Error al eliminar datos de usuario: ${
                (event.target as IDBRequest).error
              }`
            )
          );
        };
      });
    } catch (error) {
      // Para este método en particular, no hacemos logout ya que probablemente
      // ya se está en proceso de cerrar sesión
      console.error("Error al eliminar datos de usuario:", error);
      throw error;
    }
  }
}

// Exportar una instancia singleton
const userStorage = new UserStorage();
export default userStorage;
