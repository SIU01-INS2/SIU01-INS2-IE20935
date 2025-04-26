import IndexedDBConnection from "../IndexedDBConnection";
import TablasSistema, {
  TablasLocal,
  ITablaInfo,
} from "../../../../../interfaces/shared/TablasSistema";
import { DatabaseModificationOperations } from "../../../../../interfaces/shared/DatabaseModificationOperations";
import { logout } from "@/lib/helpers/logout";
import { LogoutTypes } from "@/interfaces/LogoutTypes";

export interface T_Ultima_Actualizacion_Tablas_Locales {
  Nombre_Tabla: string; // Nombre de la tabla (actúa como clave primaria)
  Operacion: string; // Tipo de operación (INSERT, UPDATE, DELETE)
  Fecha_Actualizacion: Date | string; // Fecha de la última actualización local
}

export class UltimaActualizacionTablasLocalesIDB {
  // Información completa de la tabla
  private tablaInfo: ITablaInfo = TablasSistema.ULTIMA_ACTUALIZACION_LOCAL;

  constructor() {}

  /**
   * Registra o actualiza la información de última actualización para una tabla
   * @param nombreTabla Nombre de la tabla (local o remota)
   * @param operacion Tipo de operación realizada
   * @returns Promise que se resuelve cuando se ha guardado el registro
   */
  public async registrarActualizacion(
    nombreTabla: TablasLocal,
    operacion: DatabaseModificationOperations
  ): Promise<void> {
    try {
      const actualizacion: T_Ultima_Actualizacion_Tablas_Locales = {
        Nombre_Tabla: nombreTabla,
        Operacion: operacion,
        Fecha_Actualizacion: new Date(),
      };

      const store = await IndexedDBConnection.getStore(
        this.tablaInfo.nombreLocal!,
        "readwrite"
      );

      return new Promise((resolve, reject) => {
        // Eliminar el segundo parámetro (la clave) para usar la clave en línea
        const request = store.put(actualizacion);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = (event) => {
          console.error(
            "Error al registrar actualización local:",
            event,
            actualizacion
          );
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(
        `Error al registrar actualización local para ${nombreTabla}:`,
        error
      );

      // Crear detalles del error
      const errorDetails = {
        origen: "UltimaActualizacionTablasLocalesIDB.registrarActualizacion",
        mensaje: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
        contexto: `tabla=${nombreTabla}, operacion=${operacion}`,
      };

      logout(LogoutTypes.ERROR_BASE_DATOS, errorDetails);
      throw error;
    }
  }

  /**
   * Obtiene todas las actualizaciones locales registradas
   * @returns Promise con el array de actualizaciones
   */
  public async getAll(): Promise<T_Ultima_Actualizacion_Tablas_Locales[]> {
    try {
      const store = await IndexedDBConnection.getStore(
        this.tablaInfo.nombreLocal!
      );

      return new Promise((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(
        `Error al obtener registros de actualizaciones locales:`,
        error
      );

      // Crear detalles del error
      const errorDetails = {
        origen: "UltimaActualizacionTablasLocalesIDB.getAll",
        mensaje: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      };

      logout(LogoutTypes.ERROR_BASE_DATOS, errorDetails);
      throw error;
    }
  }

  /**
   * Obtiene la información de actualización para una tabla específica
   * @param nombreTabla Nombre de la tabla
   * @returns Registro de actualización o null si no existe
   */
  public async getByTabla(
    nombreTabla: TablasLocal
  ): Promise<T_Ultima_Actualizacion_Tablas_Locales | null> {
    try {
      const store = await IndexedDBConnection.getStore(
        this.tablaInfo.nombreLocal!
      );

      return new Promise((resolve, reject) => {
        const request = store.get(nombreTabla);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(
        `Error al obtener actualización local para tabla ${nombreTabla}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Obtiene las actualizaciones por tipo de operación
   * @param operacion Tipo de operación (INSERT, UPDATE, DELETE)
   * @returns Lista de actualizaciones que coinciden con la operación
   */
  public async getByOperacion(
    operacion: DatabaseModificationOperations
  ): Promise<T_Ultima_Actualizacion_Tablas_Locales[]> {
    try {
      const store = await IndexedDBConnection.getStore(
        this.tablaInfo.nombreLocal!
      );
      const index = store.index("por_operacion");

      return new Promise((resolve, reject) => {
        const request = index.getAll(IDBKeyRange.only(operacion));

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(
        `Error al obtener actualizaciones con operación ${operacion}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Obtiene actualizaciones realizadas después de una fecha específica
   * @param fecha Fecha de referencia
   * @returns Lista de actualizaciones posteriores a la fecha
   */
  public async getActualizacionesDesdeFecha(
    fecha: Date | string
  ): Promise<T_Ultima_Actualizacion_Tablas_Locales[]> {
    try {
      // Convertir a fecha si es string
      const fechaReferencia =
        typeof fecha === "string" ? new Date(fecha) : fecha;

      const store = await IndexedDBConnection.getStore(
        this.tablaInfo.nombreLocal!
      );
      const index = store.index("por_fecha");

      // Crear un rango desde la fecha hasta el infinito
      const range = IDBKeyRange.lowerBound(fechaReferencia);

      return new Promise((resolve, reject) => {
        const request = index.getAll(range);

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(`Error al obtener actualizaciones desde fecha:`, error);
      throw error;
    }
  }

  /**
   * Obtiene la actualización más reciente entre todas las tablas
   * @returns La actualización más reciente o null si no hay registros
   */
  public async getMasReciente(): Promise<T_Ultima_Actualizacion_Tablas_Locales | null> {
    try {
      const todas = await this.getAll();

      if (todas.length === 0) {
        return null;
      }

      // Ordenar por fecha descendente
      const ordenadas = todas.sort(
        (a, b) =>
          new Date(b.Fecha_Actualizacion).getTime() -
          new Date(a.Fecha_Actualizacion).getTime()
      );

      return ordenadas[0];
    } catch (error) {
      console.error(`Error al obtener la actualización más reciente:`, error);
      throw error;
    }
  }

  /**
   * Limpia todos los registros de actualizaciones
   * Útil para reiniciar el seguimiento o limpiar registros antiguos
   */
  public async limpiarRegistros(): Promise<void> {
    try {
      const store = await IndexedDBConnection.getStore(
        this.tablaInfo.nombreLocal!,
        "readwrite"
      );

      return new Promise((resolve, reject) => {
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(
        `Error al limpiar registros de actualizaciones locales:`,
        error
      );

      // Crear detalles del error
      const errorDetails = {
        origen: "UltimaActualizacionTablasLocalesIDB.limpiarRegistros",
        mensaje: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      };

      logout(LogoutTypes.ERROR_BASE_DATOS, errorDetails);
      throw error;
    }
  }

  /**
   * Obtiene las tablas que han sido actualizadas después de una fecha específica
   * @param fecha Fecha de referencia
   * @returns Lista de nombres de tablas actualizadas
   */
  public async getTablasActualizadasDesdeFecha(
    fecha: Date | string
  ): Promise<string[]> {
    try {
      const actualizaciones = await this.getActualizacionesDesdeFecha(fecha);

      // Extraer nombres únicos de tablas
      return Array.from(new Set(actualizaciones.map((a) => a.Nombre_Tabla)));
    } catch (error) {
      console.error(`Error al obtener tablas actualizadas desde fecha:`, error);
      throw error;
    }
  }
}

// Singleton instance
const ultimaActualizacionTablasLocalesIDB =
  new UltimaActualizacionTablasLocalesIDB();
export default ultimaActualizacionTablasLocalesIDB;
