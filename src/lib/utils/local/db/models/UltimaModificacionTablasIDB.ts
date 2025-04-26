import IndexedDBConnection from "../IndexedDBConnection";
import TablasSistema, {
  TablasLocal,
  TablasRemoto,
  ITablaInfo,
} from "../../../../../interfaces/shared/TablasSistema";
import { DatabaseModificationOperations } from "../../../../../interfaces/shared/DatabaseModificationOperations";
import { T_Ultima_Modificacion_Tablas } from "@prisma/client";

import { logout } from "@/lib/helpers/logout";
import { LogoutTypes } from "@/interfaces/LogoutTypes";
import comprobarSincronizacion from "@/lib/helpers/validations/comprobarSincronizacion";
import fetchSiasisApiGenerator from "@/lib/helpers/generators/fetchSiasisApisGenerator";
import { SiasisAPIS } from "@/interfaces/shared/SiasisComponents";
import userStorage from "./UserStorage";
import {
  MAX_CACHE_LIFETIME_SECONDS,
  MIN_CACHE_LIFETIME_SECONDS,
} from "@/constants/CACHE_LIFETIME";

class UltimaModificacionTablasIDB {
  // Información completa de la tabla que incluye nombre local, remoto, descripción, etc.
  private tablaInfo: ITablaInfo = TablasSistema.ULTIMA_MODIFICACION;

  constructor(private siasisAPI: SiasisAPIS) {}

  /**
   * Método de sincronización que verifica y actualiza datos desde el servidor
   * basado en un intervalo de tiempo aleatorio
   * @param forzarSincronizacion Si es true, se fuerza la sincronización sin importar el tiempo transcurrido
   * @returns Promise que se resuelve con true si se sincronizó, false en caso contrario
   */
  public async sync(forzarSincronizacion: boolean = false): Promise<boolean> {
    try {
      // Utilizamos la función comprobarSincronizacion para determinar si debemos sincronizar
      const debeSincronizar = await comprobarSincronizacion(
        MIN_CACHE_LIFETIME_SECONDS,
        MAX_CACHE_LIFETIME_SECONDS,
        forzarSincronizacion
      );

      // Si debe sincronizar, obtenemos datos del servidor
      if (debeSincronizar) {
        await this.fetchYActualizarModificaciones();
      }

      return debeSincronizar;
    } catch (error) {
      console.error(
        "Error en proceso de sincronización de modificaciones:",
        error
      );

      // Cerrar sesión con detalles del error
      const errorDetails = {
        origen: "UltimaModificacionTablasIDB.sync",
        mensaje: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
        contexto: `forzarSincronizacion=${forzarSincronizacion}`,
      };

      logout(LogoutTypes.ERROR_SINCRONIZACION, errorDetails);
      return false;
    }
  }

  /**
   * Obtiene las modificaciones de tablas desde la API y las almacena localmente
   * @returns Promise que se resuelve cuando las modificaciones han sido actualizadas
   */
  public async fetchYActualizarModificaciones(): Promise<void> {
    try {
      // Usar el generador para API01 (o la que corresponda)
      const { fetchSiasisAPI } = fetchSiasisApiGenerator(this.siasisAPI);

      // Realizar la petición al endpoint
      const fetchCancelable = await fetchSiasisAPI({
        endpoint: "/api/modificaciones-tablas",
        method: "GET",
      });

      if (!fetchCancelable) {
        throw new Error(
          "No se pudo crear la petición de modificaciones de tablas"
        );
      }

      // Ejecutar la petición
      const response = await fetchCancelable.fetch();

      if (!response.ok) {
        throw new Error(
          `Error al obtener modificaciones de tablas: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          `Error en respuesta de modificaciones de tablas: ${data.message}`
        );
      }

      // Actualizar modificaciones en la base de datos local
      await this.updateFromApiResponse(data.data);

      console.log("Modificaciones de tablas actualizadas correctamente");
    } catch (error) {
      console.error(
        "Error al obtener y actualizar modificaciones de tablas:",
        error
      );

      // Determinar el tipo de error
      let logoutType = LogoutTypes.ERROR_SINCRONIZACION;

      if (error instanceof Error) {
        // Si es un error de red o problemas de conexión
        if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          logoutType = LogoutTypes.ERROR_RED;
        }
        // Si es un error relacionado con la respuesta del servidor
        else if (error.message.includes("obtener modificaciones")) {
          logoutType = LogoutTypes.ERROR_SINCRONIZACION;
        }
      }

      // Crear detalles del error
      const errorDetails = {
        origen: "UltimaModificacionTablasIDB.fetchYActualizarModificaciones",
        mensaje: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
        codigo: error instanceof Error && error.name ? error.name : undefined,
      };

      logout(logoutType, errorDetails);
      throw error;
    }
  }

  /**
   * Obtiene todos los registros de modificación, sincronizando antes si es necesario
   * @param forzarSincronizacion Si es true, fuerza la sincronización sin importar el tiempo
   * @returns Lista de registros de última modificación
   */
  public async getAll(
    forzarSincronizacion: boolean = false
  ): Promise<T_Ultima_Modificacion_Tablas[]> {
    try {
      // Intentar sincronizar antes de obtener los datos
      await this.sync(forzarSincronizacion);

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
        `Error al obtener registros de última modificación (${this.tablaInfo.descripcion}):`,
        error
      );

      // Crear detalles del error
      const errorDetails = {
        origen: "UltimaModificacionTablasIDB.getAll",
        mensaje: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
        contexto: `forzarSincronizacion=${forzarSincronizacion}, tabla=${this.tablaInfo.nombreLocal}`,
      };

      logout(LogoutTypes.ERROR_BASE_DATOS, errorDetails);
      throw error;
    }
  }

  /**
   * Obtiene el registro de última modificación para una tabla específica
   * @param nombreTabla Nombre de la tabla (remoto o local)
   * @returns Registro de última modificación o null si no existe
   */
  public async getByTabla(
    nombreTabla: TablasRemoto | TablasLocal
  ): Promise<T_Ultima_Modificacion_Tablas | null> {
    try {
      // Intentar sincronizar antes de obtener los datos
      await this.sync();

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
        `Error al obtener última modificación para la tabla ${nombreTabla}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Obtiene los registros de modificación por tipo de operación
   * @param operacion Tipo de operación (INSERT, UPDATE, DELETE)
   * @returns Lista de registros filtrados por operación
   */
  public async getByOperacion(
    operacion: DatabaseModificationOperations
  ): Promise<T_Ultima_Modificacion_Tablas[]> {
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
        `Error al obtener modificaciones con operación ${operacion}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Obtiene los registros de modificación dentro de un rango de fechas
   * @param fechaInicio Fecha de inicio (ISO 8601 string)
   * @param fechaFin Fecha de fin (ISO 8601 string)
   * @returns Lista de registros dentro del rango de fechas
   */
  public async getByRangoFechas(
    fechaInicio: string,
    fechaFin: string
  ): Promise<T_Ultima_Modificacion_Tablas[]> {
    try {
      const store = await IndexedDBConnection.getStore(
        this.tablaInfo.nombreLocal!
      );
      const index = store.index("por_fecha");

      return new Promise((resolve, reject) => {
        const request = index.getAll(IDBKeyRange.bound(fechaInicio, fechaFin));

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(
        `Error al obtener modificaciones en rango de fechas:`,
        error
      );
      throw error;
    }
  }

  /**
   * Registra una nueva modificación de tabla
   * @param modificacion Datos de la modificación
   */
  public async add(modificacion: T_Ultima_Modificacion_Tablas): Promise<void> {
    try {
      // Asegurar que tengamos una fecha de modificación
      if (!modificacion.Fecha_Modificacion) {
        modificacion.Fecha_Modificacion = new Date();
      }

      const store = await IndexedDBConnection.getStore(
        this.tablaInfo.nombreLocal!,
        "readwrite"
      );

      return new Promise((resolve, reject) => {
        const request = store.put(modificacion); // Usamos put en lugar de add para sobrescribir si ya existe

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(`Error al registrar modificación de tabla:`, error);
      throw error;
    }
  }

  /**
   * Elimina un registro de modificación de tabla
   * @param nombreTabla Nombre de la tabla (remoto o local)
   */
  public async delete(nombreTabla: TablasRemoto | TablasLocal): Promise<void> {
    try {
      const store = await IndexedDBConnection.getStore(
        this.tablaInfo.nombreLocal!,
        "readwrite"
      );

      return new Promise((resolve, reject) => {
        const request = store.delete(nombreTabla);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(
        `Error al eliminar registro de modificación para la tabla ${nombreTabla}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Actualiza las modificaciones localmente desde la respuesta de la API
   * @param modificaciones Array de modificaciones de la API
   */
  public async updateFromApiResponse(
    modificaciones: T_Ultima_Modificacion_Tablas[]
  ): Promise<void> {
    try {
      const store = await IndexedDBConnection.getStore(
        this.tablaInfo.nombreLocal!,
        "readwrite"
      );

      // Procesar cada modificación de manera individual
      for (const modificacion of modificaciones) {
        try {
          await new Promise<void>((resolve, reject) => {
            // Usar simplemente put con un solo parámetro
            // para respetar las claves en línea configuradas en el store
            const request = store.put(modificacion);

            request.onsuccess = () => resolve();
            request.onerror = (event) => {
              console.error(
                "Error al guardar modificación:",
                event,
                modificacion
              );
              reject(request.error);
            };
          });
        } catch (itemError) {
          console.warn(
            `Error al actualizar modificación individual para tabla ${modificacion.Nombre_Tabla}:`,
            itemError
          );
        }
      }

      // Actualizar la fecha de sincronización en el almacenamiento del usuario
      userStorage.guardarUltimaSincronizacion(Date.now());

      console.log(
        `Actualizadas ${modificaciones.length} modificaciones desde la API`
      );
    } catch (error) {
      console.error(`Error al actualizar modificaciones desde la API:`, error);

      // Crear detalles del error
      const errorDetails = {
        origen: "UltimaModificacionTablasIDB.updateFromApiResponse",
        mensaje: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
        contexto: `totalModificaciones=${modificaciones?.length || 0}`,
      };

      logout(LogoutTypes.ERROR_BASE_DATOS, errorDetails);
      throw error;
    }
  }
  /**
   * Obtiene la modificación más reciente por fecha
   * @returns La modificación más reciente o null si no hay registros
   */
  public async getMasReciente(): Promise<T_Ultima_Modificacion_Tablas | null> {
    try {
      const todas = await this.getAll();

      if (todas.length === 0) {
        return null;
      }

      // Ordenar por fecha descendente
      const ordenadas = todas.sort(
        (a, b) =>
          new Date(b.Fecha_Modificacion).getTime() -
          new Date(a.Fecha_Modificacion).getTime()
      );

      return ordenadas[0];
    } catch (error) {
      console.error(`Error al obtener la modificación más reciente:`, error);
      throw error;
    }
  }

  /**
   * Obtiene las modificaciones más recientes para todas las tablas
   * @param limit Límite de resultados por tabla (por defecto 1)
   * @returns Objeto con las tablas y sus modificaciones más recientes
   */
  public async getModificacionesRecientesPorTabla(
    limit: number = 1
  ): Promise<Record<string, T_Ultima_Modificacion_Tablas[]>> {
    try {
      const todas = await this.getAll();
      const resultado: Record<string, T_Ultima_Modificacion_Tablas[]> = {};

      // Agrupar por tabla
      todas.forEach((modificacion) => {
        const nombreTabla = modificacion.Nombre_Tabla;
        if (!resultado[nombreTabla]) {
          resultado[nombreTabla] = [];
        }
        resultado[nombreTabla].push(modificacion);
      });

      // Ordenar cada grupo por fecha y limitar resultados
      Object.keys(resultado).forEach((tabla) => {
        resultado[tabla].sort(
          (a, b) =>
            new Date(b.Fecha_Modificacion).getTime() -
            new Date(a.Fecha_Modificacion).getTime()
        );
        resultado[tabla] = resultado[tabla].slice(0, limit);
      });

      return resultado;
    } catch (error) {
      console.error(
        `Error al obtener modificaciones recientes por tabla:`,
        error
      );
      throw error;
    }
  }

  /**
   * Obtiene las tablas que han sido modificadas desde una fecha específica
   * @param fechaReferencia Fecha ISO string desde la cual buscar
   * @returns Array con los nombres de las tablas modificadas después de la fecha
   */
  public async getTablasModificadasDesdeFecha(
    fechaReferencia: string
  ): Promise<string[]> {
    try {
      const timestampReferencia = new Date(fechaReferencia).getTime();
      const todas = await this.getAll();

      // Filtrar las modificaciones posteriores a la fecha de referencia
      const modificacionesRecientes = todas.filter(
        (mod) =>
          new Date(mod.Fecha_Modificacion).getTime() > timestampReferencia
      );

      // Obtener nombres únicos de tablas
      const tablasModificadas = Array.from(
        new Set(modificacionesRecientes.map((mod) => mod.Nombre_Tabla))
      );

      return tablasModificadas;
    } catch (error) {
      console.error(`Error al obtener tablas modificadas desde fecha:`, error);
      throw error;
    }
  }
}

export default UltimaModificacionTablasIDB;
