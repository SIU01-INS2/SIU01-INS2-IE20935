import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import {
  AuxiliarAsistenciaResponse,
  BaseAsistenciaResponse,
  DirectivoAsistenciaResponse,
  PersonalAdministrativoAsistenciaResponse,
  ProfesorPrimariaAsistenciaResponse,
  ProfesorTutorSecundariaAsistenciaResponse,
  ResponsableAsistenciaResponse,
} from "@/interfaces/shared/Asistencia/DatosAsistenciaHoyIE20935";
import IndexedDBConnection from "../../IndexedDBConnection";
import { LogoutTypes, ErrorDetailsForLogout } from "@/interfaces/LogoutTypes";
import { logout } from "@/lib/helpers/logout";
import store from "@/global/store";
import { HandlerDirectivoAsistenciaResponse } from "./handlers/HandlerDirectivoAsistenciaResponse";
import { HandlerProfesorPrimariaAsistenciaResponse } from "./handlers/HandlerProfesorPrimariaAsistenciaResponse";
import { HandlerAuxiliarAsistenciaResponse } from "./handlers/HandlerAuxiliarAsistenciaResponse";
import { HandlerProfesorTutorSecundariaAsistenciaResponse } from "./handlers/HandlerProfesorTutorSecundariaAsistenciaResponse";
import { HandlerResponsableAsistenciaResponse } from "./handlers/HandlerResponsableAsistenciaResponse";
import { HandlerPersonalAdministrativoAsistenciaResponse } from "./handlers/HandlerPersonalAdministrativoAsistenciaResponse";
import userStorage from "../UserStorage";
import { Meses } from "@/interfaces/shared/Meses";
import {
  EstadoTomaAsistenciaResponseBody,
  TipoAsistencia,
} from "@/interfaces/shared/AsistenciaRequests";

// Interfaz para el objeto guardado en IndexedDB
export interface DatosAsistenciaAlmacenados {
  id: string; // 'datos_actuales'
  rol: RolesSistema;
  datos: BaseAsistenciaResponse;
  fechaGuardado: string;
}

export class DatosAsistenciaHoyIDB {
  private readonly storeName: string = "datos_asistencia_hoy";
  private static readonly STORAGE_KEY = "datos_asistencia_actuales";
  // Constantes para las nuevas keys
  private static readonly ESTADO_TOMA_ASISTENCIA_PERSONAL_KEY =
    "estado_toma_asistencia_de_personal";
  private static readonly ESTADO_TOMA_ASISTENCIA_SECUNDARIA_KEY =
    "estado_toma_asistencia_estudiantes_secundaria";
  private static readonly ESTADO_TOMA_ASISTENCIA_PRIMARIA_KEY =
    "estado_toma_asistencia_estudiantes_primaria";

  /**
   * Maneja los errores según su tipo y realiza logout si es necesario
   */
  private handleError(
    error: unknown,
    operacion: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    detalles?: Record<string, any>
  ): void {
    console.error(
      `Error en DatosAsistenciaHoyAlmacenamiento (${operacion}):`,
      error
    );

    const errorDetails: ErrorDetailsForLogout = {
      origen: `DatosAsistenciaHoyAlmacenamiento.${operacion}`,
      mensaje: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
      contexto: JSON.stringify(detalles || {}),
      siasisComponent: "CLN01", // Considera externalizar o configurar esto
    };

    let logoutType: LogoutTypes;

    if (error instanceof Error) {
      if (error.name === "QuotaExceededError" || error.name === "AbortError") {
        logoutType = LogoutTypes.ERROR_BASE_DATOS;
      } else if (
        error.message.includes("fetch") ||
        error.message.includes("network")
      ) {
        logoutType = LogoutTypes.ERROR_RED;
      } else if (
        error.message.includes("JSON") ||
        error.message.includes("parse")
      ) {
        logoutType = LogoutTypes.ERROR_DATOS_CORRUPTOS;
      } else {
        logoutType = LogoutTypes.ERROR_SISTEMA;
      }
    } else {
      logoutType = LogoutTypes.ERROR_SISTEMA;
    }

    logout(logoutType, errorDetails);
  }

  /**
   * Obtiene la fecha actual desde el estado de Redux
   * @returns Objeto Date con la fecha actual según el estado global o null si no se puede obtener.
   */
  private obtenerFechaActualDesdeRedux(): Date | null {
    try {
      // Obtenemos el estado actual de Redux
      const state = store.getState();

      // Accedemos a la fecha del estado global
      const fechaHoraRedux = state.others.fechaHoraActualReal.fechaHora;

      // Si tenemos fecha en Redux, la usamos
      if (fechaHoraRedux) {
        return new Date(fechaHoraRedux);
      }

      // Si no se puede obtener la fecha de Redux, retornamos null
      return null;
    } catch (error) {
      console.error(
        "Error al obtener fecha desde Redux en DatosAsistenciaHoyAlmacenamiento:",
        error
      );
      return null;
    }
  }

  /**
   * Formatea una fecha en formato ISO sin la parte de tiempo
   */
  private formatearFechaSoloDia(fecha: Date): string {
    return fecha.toISOString().split("T")[0];
  }

  /**
   * Compara si dos fechas ISO (solo día) son el mismo día
   */
  private esMismoDia(fecha1ISO: string, fecha2ISO: string): boolean {
    return fecha1ISO === fecha2ISO;
  }

  /**
   * Verifica si la fecha proporcionada corresponde a un sábado o domingo (Perú time).
   */
  private esFinDeSemana(fecha: Date | null): boolean {
    if (!fecha) {
      return false; // Si no hay fecha, no es fin de semana para esta lógica
    }
    const dayOfWeek = fecha.getUTCDay(); // 0 (Domingo) - 6 (Sábado)
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  /**
   * Obtiene los datos del servidor y los almacena en IndexedDB
   */
  private async fetchDatosFromServer(): Promise<BaseAsistenciaResponse> {
    try {
      const response = await fetch("/api/datos-asistencia-hoy");
      if (!response.ok) {
        throw new Error(
          `Error en la respuesta del servidor: ${response.status} ${response.statusText}`
        );
      }
      return await response.json();
    } catch (error) {
      this.handleError(error, "fetchDatosFromServer");
      throw error;
    }
  }

  /**
   * Guarda los datos de asistencia en IndexedDB
   */
  private async guardarDatosInterno(
    datos: BaseAsistenciaResponse
  ): Promise<void> {
    const fechaActual = this.obtenerFechaActualDesdeRedux();
    if (!fechaActual) {
      console.warn(
        "No se pudo guardar datos porque no se obtuvo la fecha de Redux."
      );
      return;
    }
    const rol = await userStorage.getRol();

    try {
      const store = await IndexedDBConnection.getStore(
        this.storeName,
        "readwrite"
      );

      const datosAlmacenados: DatosAsistenciaAlmacenados = {
        id: DatosAsistenciaHoyIDB.STORAGE_KEY,
        rol,
        datos,
        fechaGuardado: this.formatearFechaSoloDia(fechaActual),
      };

      return new Promise((resolve, reject) => {
        const request = store.put(
          datosAlmacenados,
          DatosAsistenciaHoyIDB.STORAGE_KEY
        );

        request.onsuccess = () => {
          resolve();
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request.onerror = (event: any) => {
          reject(
            new Error(
              `Error al guardar datos en IndexedDB: ${
                (event.target as IDBRequest).error
              }`
            )
          );
        };
      });
    } catch (error) {
      this.handleError(error, "guardarDatosInterno");
      throw error;
    }
  }

  /**
   * Obtiene el estado de toma de asistencia según la key especificada
   * Si no hay datos en IndexedDB, intenta obtenerlos del API
   */
  public async obtenerEstadoTomaAsistencia(
    tipoAsistencia: TipoAsistencia
  ): Promise<EstadoTomaAsistenciaResponseBody | null> {
    try {
      const key = this.getKeyPorTipo(tipoAsistencia);
      const store = await IndexedDBConnection.getStore(
        this.storeName,
        "readwrite"
      );

      // Primero intentamos obtener del IndexedDB
      const resultadoIDB =
        await new Promise<EstadoTomaAsistenciaResponseBody | null>(
          (resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => {
              resolve(request.result || null);
            };
            request.onerror = () => {
              reject(request.error);
            };
          }
        );

      // Si encontramos datos en IndexedDB, los devolvemos
      if (resultadoIDB) {
        return resultadoIDB;
      }

      // Si no hay datos en IndexedDB, consultamos la API
      console.log(
        `No se encontraron datos en IndexedDB para ${tipoAsistencia}, consultando API...`
      );

      try {
        const response = await fetch(
          `/api/asistencia-hoy/consultar-estado?TipoAsistencia=${tipoAsistencia}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Error al consultar API: ${response.status} ${response.statusText}`
          );
        }

        const datos =
          (await response.json()) as EstadoTomaAsistenciaResponseBody;

        // Guardar los datos obtenidos en IndexedDB para futuras consultas
        if (datos) {
          await this.guardarEstadoTomaAsistencia(datos);
        }

        return datos;
      } catch (apiError) {
        console.error(
          `Error al consultar API para estado de asistencia ${tipoAsistencia}:`,
          apiError
        );

        // Si falla la API, creamos un objeto con estado false basado en la fecha actual
        const fechaActual = this.obtenerFechaActualDesdeRedux();
        if (!fechaActual) return null;

        const estadoDefault: EstadoTomaAsistenciaResponseBody = {
          TipoAsistencia: tipoAsistencia,
          Dia: fechaActual.getDate(),
          Mes: (fechaActual.getMonth() + 1) as Meses,
          Anio: fechaActual.getFullYear(),
          AsistenciaIniciada: false,
        };

        // Guardamos este estado por defecto en IndexedDB
        await this.guardarEstadoTomaAsistencia(estadoDefault);

        return estadoDefault;
      }
    } catch (error) {
      this.handleError(error, "obtenerEstadoTomaAsistencia", {
        tipoAsistencia,
      });
      return null;
    }
  }

  /**
   * Guarda el estado de toma de asistencia para el tipo especificado
   */
  public async guardarEstadoTomaAsistencia(
    estado: EstadoTomaAsistenciaResponseBody
  ): Promise<void> {
    try {
      const key = this.getKeyPorTipo(estado.TipoAsistencia);
      const store = await IndexedDBConnection.getStore(
        this.storeName,
        "readwrite"
      );

      return new Promise((resolve, reject) => {
        const request = store.put(estado, key);
        request.onsuccess = () => {
          resolve();
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request.onerror = (event: any) => {
          reject(
            new Error(
              `Error al guardar estado de toma de asistencia: ${
                (event.target as IDBRequest).error
              }`
            )
          );
        };
      });
    } catch (error) {
      this.handleError(error, "guardarEstadoTomaAsistencia", {
        estado,
      });
      throw error;
    }
  }

  /**
   * Actualiza el campo AsistenciaIniciada para el tipo especificado
   */
  public async actualizarEstadoAsistenciaIniciada(
    tipoAsistencia: TipoAsistencia,
    iniciada: boolean
  ): Promise<void> {
    try {
      const estadoActual = await this.obtenerEstadoTomaAsistencia(
        tipoAsistencia
      );
      if (estadoActual) {
        // Solo actualiza el campo AsistenciaIniciada
        estadoActual.AsistenciaIniciada = iniciada;
        await this.guardarEstadoTomaAsistencia(estadoActual);
      } else {
        // Si no existe un estado, crear uno con los datos actuales
        const fechaActual = this.obtenerFechaActualDesdeRedux();
        if (!fechaActual) {
          throw new Error("No se pudo obtener la fecha actual");
        }

        const nuevoEstado: EstadoTomaAsistenciaResponseBody = {
          TipoAsistencia: tipoAsistencia,
          Dia: fechaActual.getDate(),
          Mes: (fechaActual.getMonth() + 1) as Meses,
          Anio: fechaActual.getFullYear(),
          AsistenciaIniciada: iniciada,
        };

        await this.guardarEstadoTomaAsistencia(nuevoEstado);
      }
    } catch (error) {
      this.handleError(error, "actualizarEstadoAsistenciaIniciada", {
        tipoAsistencia,
        iniciada,
      });
      throw error;
    }
  }

  /**
   * Verifica si la asistencia está iniciada para el tipo especificado en la fecha actual
   */
  public async verificarAsistenciaIniciadaHoy(
    tipoAsistencia: TipoAsistencia
  ): Promise<boolean> {
    try {
      const estadoActual = await this.obtenerEstadoTomaAsistencia(
        tipoAsistencia
      );
      if (!estadoActual) return false;

      const fechaActual = this.obtenerFechaActualDesdeRedux();
      if (!fechaActual) return false;

      // Verificar que sea el mismo día
      const esMismoDia =
        estadoActual.Dia === fechaActual.getDate() &&
        estadoActual.Mes === fechaActual.getMonth() + 1 &&
        estadoActual.Anio === fechaActual.getFullYear();

      return esMismoDia && estadoActual.AsistenciaIniciada;
    } catch (error) {
      this.handleError(error, "verificarAsistenciaIniciadaHoy", {
        tipoAsistencia,
      });
      return false;
    }
  }

  /**
   * Limpia todos los estados de toma de asistencia
   */
  public async limpiarTodosLosEstados(): Promise<void> {
    try {
      const store = await IndexedDBConnection.getStore(
        this.storeName,
        "readwrite"
      );
      const promises = [
        this.deleteKey(store, DatosAsistenciaHoyIDB.ESTADO_TOMA_ASISTENCIA_PERSONAL_KEY),
        this.deleteKey(store, DatosAsistenciaHoyIDB.ESTADO_TOMA_ASISTENCIA_SECUNDARIA_KEY),
        this.deleteKey(store, DatosAsistenciaHoyIDB.ESTADO_TOMA_ASISTENCIA_PRIMARIA_KEY),
      ];

      await Promise.all(promises);
    } catch (error) {
      this.handleError(error, "limpiarTodosLosEstados");
      throw error;
    }
  }

  /**
   * Método auxiliar para eliminar una key específica
   */
  private deleteKey(store: IDBObjectStore, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtiene la key correspondiente según el tipo de estado
   */
  private getKeyPorTipo(tipoAsistencia: TipoAsistencia): string {
    switch (tipoAsistencia) {
      case TipoAsistencia.ParaPersonal:
        return DatosAsistenciaHoyIDB.ESTADO_TOMA_ASISTENCIA_PERSONAL_KEY;
      case TipoAsistencia.ParaEstudiantesSecundaria:
        return DatosAsistenciaHoyIDB.ESTADO_TOMA_ASISTENCIA_SECUNDARIA_KEY;
      case TipoAsistencia.ParaEstudiantesPrimaria:
        return DatosAsistenciaHoyIDB.ESTADO_TOMA_ASISTENCIA_PRIMARIA_KEY;
      default:
        throw new Error("Tipo de estado no reconocido");
    }
  }

  /**
   * Obtiene los datos almacenados en IndexedDB
   */
  private async obtenerDatosAlmacenados(): Promise<DatosAsistenciaAlmacenados | null> {
    try {
      const store = await IndexedDBConnection.getStore(this.storeName);
      return new Promise((resolve, reject) => {
        const request = store.get(DatosAsistenciaHoyIDB.STORAGE_KEY);
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      this.handleError(error, "obtenerDatosAlmacenados");
      return null;
    }
  }

  /**
   * Sincroniza los datos desde el servidor si es necesario y los devuelve.
   */
  public async obtenerDatos<
    T extends BaseAsistenciaResponse
  >(): Promise<T | null> {
    const fechaHoyRedux = this.obtenerFechaActualDesdeRedux();

    // Si no se pudo obtener la fecha de Redux, no hacer nada y retornar null
    if (!fechaHoyRedux) {
      return null;
    }

    try {
      const storedData = await this.obtenerDatosAlmacenados();

      const fechaHoyISO = this.formatearFechaSoloDia(fechaHoyRedux);

      // No sincronizar si es fin de semana
      if (this.esFinDeSemana(fechaHoyRedux) && storedData) {
        if (storedData && storedData.rol) {
          return storedData.datos as T;
        }
        return null; // No hay datos válidos para hoy (fin de semana)
      }

      if (
        !storedData ||
        !this.esMismoDia(String(storedData.datos.FechaLocalPeru), fechaHoyISO)
      ) {
        const freshData = await this.fetchDatosFromServer();
        await this.guardarDatosInterno(freshData);
        return freshData as T;
      }

      return storedData.datos as T;
    } catch (error) {
      console.error("Error al obtener o sincronizar datos:", error);
      return null;
    }
  }

  /**
   * Limpia los datos almacenados
   */
  public async limpiarDatos(): Promise<void> {
    try {
      const store = await IndexedDBConnection.getStore(
        this.storeName,
        "readwrite"
      );
      return new Promise((resolve, reject) => {
        const request = store.delete(DatosAsistenciaHoyIDB.STORAGE_KEY);
        request.onsuccess = () => {
          resolve();
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("Error al limpiar datos:", error);
    }
  }

  /**
   * Guarda los datos directamente sin verificar la fecha.
   */
  public async guardarDatosDirecto(
    datos: BaseAsistenciaResponse
  ): Promise<void> {
    await this.guardarDatosInterno(datos);
  }

  /**
   * Obtiene el handler correspondiente según el rol almacenado en IndexedDB.
   */
  public async getHandler() {
    const storedData = await this.obtenerDatosAlmacenados();
    if (!storedData) {
      return null;
    }

    switch (storedData.rol) {
      case RolesSistema.Directivo:
        return new HandlerDirectivoAsistenciaResponse(
          storedData.datos as DirectivoAsistenciaResponse // Ajusta el tipo según sea necesario
        );
      case RolesSistema.ProfesorPrimaria:
        return new HandlerProfesorPrimariaAsistenciaResponse(
          storedData.datos as ProfesorPrimariaAsistenciaResponse
        );
      case RolesSistema.Auxiliar:
        return new HandlerAuxiliarAsistenciaResponse(
          storedData.datos as AuxiliarAsistenciaResponse
        );
      case RolesSistema.ProfesorSecundaria:
      case RolesSistema.Tutor:
        return new HandlerProfesorTutorSecundariaAsistenciaResponse(
          storedData.datos as ProfesorTutorSecundariaAsistenciaResponse
        );
      case RolesSistema.Responsable:
        return new HandlerResponsableAsistenciaResponse(
          storedData.datos as ResponsableAsistenciaResponse
        );
      case RolesSistema.PersonalAdministrativo:
        return new HandlerPersonalAdministrativoAsistenciaResponse(
          storedData.datos as PersonalAdministrativoAsistenciaResponse
        );
      default:
        return null;
    }
  }
}
