/* eslint-disable @typescript-eslint/no-explicit-any */
import { logout } from "@/lib/helpers/logout";
import { LogoutTypes, ErrorDetailsForLogout } from "@/interfaces/LogoutTypes";
import IndexedDBConnection from "../../IndexedDBConnection";
import { ModoRegistro } from "@/interfaces/shared/ModoRegistroPersonal";
import {
  AsistenciaDiariaResultado,
  ConsultarAsistenciasTomadasPorActorEnRedisResponseBody,
  DetallesAsistenciaUnitariaPersonal,
  EliminarAsistenciaRequestBody,
  RegistroAsistenciaUnitariaPersonal,
  TipoAsistencia,
} from "../../../../../../interfaces/shared/AsistenciaRequests";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { Meses } from "@/interfaces/shared/Meses";
import { ActoresSistema } from "@/interfaces/shared/ActoresSistema";
import {
  ApiResponseBase,
  ErrorResponseAPIBase,
  MessageProperty,
} from "@/interfaces/shared/apis/types";
import AllErrorTypes, {
  DataConflictErrorTypes,
  SystemErrorTypes,
  UserErrorTypes,
  DataErrorTypes,
} from "@/interfaces/shared/apis/errors";
import { SiasisAPIS } from "@/interfaces/shared/SiasisComponents";
import fetchSiasisApiGenerator from "@/lib/helpers/generators/fetchSiasisApisGenerator";
import {
  MINUTOS_TOLERANCIA_ENTRADA_PERSONAL,
  MINUTOS_TOLERANCIA_SALIDA_PERSONAL,
} from "@/constants/MINUTOS_TOLERANCIA_ASISTENCIA_PERSONAL";
import { EstadosAsistenciaPersonal } from "@/interfaces/shared/EstadosAsistenciaPersonal";
import { DIA_ESCOLAR_MINIMO_PARA_CONSULTAR_API } from "@/constants/DISPONIBILLIDAD_IDS_RDP02_GENERADOS";
import {
  AsistenciaCompletaMensualDePersonal,
  GetAsistenciaMensualDePersonalSuccessResponse,
} from "@/interfaces/shared/apis/api01/personal/types";
import store from "@/global/store";
import {
  AsistenciaPersonalHoy,
  AsistenciasTomadasHoyIDB,
  ConsultaAsistenciaHoy,
} from "./AsistenciasTomadasHoyIDB";

// Re-exportar para acceso externo
export { ModoRegistro } from "@/interfaces/shared/ModoRegistroPersonal";

// Interfaces para los registros de entrada/salida
export interface RegistroEntradaSalida {
  timestamp: number;
  desfaseSegundos: number;
  estado: EstadosAsistenciaPersonal;
}

// Interfaces para asistencia mensual
export interface AsistenciaMensualPersonal {
  Id_Registro_Mensual: number;
  mes: Meses;
  Dni_Personal: string;
  registros: Record<string, RegistroEntradaSalida>;
}

// Enumeración para los diferentes tipos de personal
export enum TipoPersonal {
  PROFESOR_PRIMARIA = "profesor_primaria",
  PROFESOR_SECUNDARIA = "profesor_secundaria",
  AUXILIAR = "auxiliar",
  PERSONAL_ADMINISTRATIVO = "personal_administrativo",
}

export class AsistenciaDePersonalIDB {
  private siasisAPI: SiasisAPIS;
  private setIsSomethingLoading?: (isLoading: boolean) => void;
  private setError?: (error: ErrorResponseAPIBase | null) => void;
  private setSuccessMessage?: (message: MessageProperty | null) => void;

  // ✅ NUEVA PROPIEDAD: Cache para asistencias de hoy
  private cacheAsistenciasHoy: AsistenciasTomadasHoyIDB;

  constructor(
    siasisAPI: SiasisAPIS,
    setIsSomethingLoading?: (isLoading: boolean) => void,
    setError?: (error: ErrorResponseAPIBase | null) => void,
    setSuccessMessage?: (message: MessageProperty | null) => void
  ) {
    this.siasisAPI = siasisAPI;
    this.setIsSomethingLoading = setIsSomethingLoading;
    this.setError = setError;
    this.setSuccessMessage = setSuccessMessage;

    // ✅ INICIALIZAR cache de asistencias
    this.cacheAsistenciasHoy = new AsistenciasTomadasHoyIDB();

    // ✅ INICIALIZAR rutinas de mantenimiento del cache
    this.cacheAsistenciasHoy.inicializarMantenimiento();
  }

  /**
   * Obtiene el nombre del almacén según el tipo de personal y el modo de registro
   */
  private getStoreName(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro
  ): string {
    const storeMapping = {
      [TipoPersonal.PROFESOR_PRIMARIA]: {
        [ModoRegistro.Entrada]: "control_entrada_profesores_primaria",
        [ModoRegistro.Salida]: "control_salida_profesores_primaria",
      },
      [TipoPersonal.PROFESOR_SECUNDARIA]: {
        [ModoRegistro.Entrada]: "control_entrada_profesores_secundaria",
        [ModoRegistro.Salida]: "control_salida_profesores_secundaria",
      },
      [TipoPersonal.AUXILIAR]: {
        [ModoRegistro.Entrada]: "control_entrada_auxiliar",
        [ModoRegistro.Salida]: "control_salida_auxiliar",
      },
      [TipoPersonal.PERSONAL_ADMINISTRATIVO]: {
        [ModoRegistro.Entrada]: "control_entrada_personal_administrativo",
        [ModoRegistro.Salida]: "control_salida_personal_administrativo",
      },
    };

    return storeMapping[tipoPersonal][modoRegistro];
  }

  /**
   * Obtiene el nombre del campo de identificación según el tipo de personal
   */
  private getIdFieldName(tipoPersonal: TipoPersonal): string {
    const fieldMapping = {
      [TipoPersonal.PROFESOR_PRIMARIA]: "DNI_Profesor_Primaria",
      [TipoPersonal.PROFESOR_SECUNDARIA]: "DNI_Profesor_Secundaria",
      [TipoPersonal.AUXILIAR]: "DNI_Auxiliar",
      [TipoPersonal.PERSONAL_ADMINISTRATIVO]: "DNI_Personal_Administrativo",
    };

    return fieldMapping[tipoPersonal];
  }

  /**
   * Obtiene el nombre del campo ID según el tipo de personal y modo de registro
   */
  private getIdFieldForStore(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro
  ): string {
    const prefijo =
      modoRegistro === ModoRegistro.Entrada ? "Id_C_E_M_P_" : "Id_C_S_M_P_";

    switch (tipoPersonal) {
      case TipoPersonal.PROFESOR_PRIMARIA:
        return `${prefijo}Profesores_Primaria`;
      case TipoPersonal.PROFESOR_SECUNDARIA:
        return `${prefijo}Profesores_Secundaria`;
      case TipoPersonal.AUXILIAR:
        return `${prefijo}Auxiliar`;
      case TipoPersonal.PERSONAL_ADMINISTRATIVO:
        return `${prefijo}Administrativo`;
      default:
        throw new Error(`Tipo de personal no soportado: ${tipoPersonal}`);
    }
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
        "Error al obtener fecha desde Redux en AsistenciaDePersonalIDB:",
        error
      );
      return null;
    }
  }

  /**
   * Obtiene el nombre del índice para la búsqueda por personal y mes
   */
  private getIndexNameForPersonalMes(tipoPersonal: TipoPersonal): string {
    const indexMapping = {
      [TipoPersonal.PROFESOR_PRIMARIA]: "por_profesor_mes",
      [TipoPersonal.PROFESOR_SECUNDARIA]: "por_profesor_mes",
      [TipoPersonal.AUXILIAR]: "por_auxiliar_mes",
      [TipoPersonal.PERSONAL_ADMINISTRATIVO]: "por_administrativo_mes",
    };

    return indexMapping[tipoPersonal] || "por_profesor_mes";
  }

  /**
   * Convierte un rol del sistema al tipo de personal correspondiente
   */
  private obtenerTipoPersonalDesdeRolOActor(
    rol: RolesSistema | ActoresSistema
  ): TipoPersonal {
    switch (rol) {
      case RolesSistema.ProfesorPrimaria:
      case ActoresSistema.ProfesorPrimaria:
        return TipoPersonal.PROFESOR_PRIMARIA;
      case RolesSistema.ProfesorSecundaria:
      case RolesSistema.Tutor:
      case ActoresSistema.ProfesorSecundaria:
        return TipoPersonal.PROFESOR_SECUNDARIA;
      case RolesSistema.Auxiliar:
      case ActoresSistema.Auxiliar:
        return TipoPersonal.AUXILIAR;
      case RolesSistema.PersonalAdministrativo:
      case ActoresSistema.PersonalAdministrativo:
        return TipoPersonal.PERSONAL_ADMINISTRATIVO;
      default:
        throw new Error(`Rol no válido o no soportado: ${rol}`);
    }
  }

  /**
   * Determina el estado de asistencia basado en el desfase de tiempo
   */
  private determinarEstadoAsistencia(
    desfaseSegundos: number,
    modoRegistro: ModoRegistro
  ): EstadosAsistenciaPersonal {
    const TOLERANCIA_TARDANZA = MINUTOS_TOLERANCIA_ENTRADA_PERSONAL * 60;
    const TOLERANCIA_TEMPRANO = MINUTOS_TOLERANCIA_SALIDA_PERSONAL * 60;

    if (modoRegistro === ModoRegistro.Entrada) {
      if (desfaseSegundos <= 0) {
        return EstadosAsistenciaPersonal.En_Tiempo;
      } else if (desfaseSegundos <= TOLERANCIA_TARDANZA) {
        return EstadosAsistenciaPersonal.En_Tiempo; // Tolerancia de 5 minutos
      } else {
        return EstadosAsistenciaPersonal.Tarde;
      }
    } else {
      if (desfaseSegundos >= 0) {
        return EstadosAsistenciaPersonal.Cumplido;
      } else if (desfaseSegundos >= -TOLERANCIA_TEMPRANO) {
        return EstadosAsistenciaPersonal.Cumplido; // Tolerancia de 15 minutos
      } else {
        return EstadosAsistenciaPersonal.Salida_Anticipada;
      }
    }
  }

  /**
   * Calcula el día escolar del mes (sin contar fines de semana)
   */
  private calcularDiaEscolarDelMes(): number {
    const fechaActual = new Date();
    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth(); // 0-11
    const diaActual = fechaActual.getDate();

    let diaEscolar = 0;

    // Contar solo días hábiles (lunes a viernes) desde el inicio del mes hasta hoy
    for (let dia = 1; dia <= diaActual; dia++) {
      const fecha = new Date(anio, mes, dia);
      const diaSemana = fecha.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado

      // Si es día hábil (lunes a viernes)
      if (diaSemana >= 1 && diaSemana <= 5) {
        diaEscolar++;
      }
    }

    return diaEscolar;
  }

  /**
   * Determina si debemos consultar la API basándose en el día escolar
   */
  private debeConsultarAPI(diaEscolar: number): boolean {
    // Si estamos en el primer día escolar del mes, es seguro que no hay IDs en PostgreSQL
    if (diaEscolar <= 1) {
      return false;
    }

    // A partir del segundo día escolar, es probable que ya tengamos registros con IDs
    return diaEscolar >= DIA_ESCOLAR_MINIMO_PARA_CONSULTAR_API;
  }

  /**
   * ✅ NUEVA FUNCIÓN: Verifica si los registros locales necesitan actualización
   */
  private verificarSiNecesitaActualizacion(
    registroEntrada: AsistenciaMensualPersonal | null,
    registroSalida: AsistenciaMensualPersonal | null,
    diaActual: number
  ): boolean {
    // Calcular el último día registrado en ambos registros
    let ultimoDiaEntrada = 0;
    let ultimoDiaSalida = 0;

    if (registroEntrada && registroEntrada.registros) {
      const diasEntrada = Object.keys(registroEntrada.registros)
        .map((d) => parseInt(d))
        .filter((d) => !isNaN(d));
      ultimoDiaEntrada = diasEntrada.length > 0 ? Math.max(...diasEntrada) : 0;
    }

    if (registroSalida && registroSalida.registros) {
      const diasSalida = Object.keys(registroSalida.registros)
        .map((d) => parseInt(d))
        .filter((d) => !isNaN(d));
      ultimoDiaSalida = diasSalida.length > 0 ? Math.max(...diasSalida) : 0;
    }

    const ultimoDiaLocal = Math.max(ultimoDiaEntrada, ultimoDiaSalida);

    // Si el último día local es menor que el día actual - 1, necesita actualización
    // (dejamos margen de 1 día para evitar consultas constantes)
    const necesitaActualizacion = ultimoDiaLocal < diaActual - 1;

    console.log(`🔍 Verificación actualización:`, {
      ultimoDiaEntrada,
      ultimoDiaSalida,
      ultimoDiaLocal,
      diaActual,
      necesitaActualizacion,
    });

    return necesitaActualizacion;
  }

  /**
   * ✅ NUEVA FUNCIÓN: Elimina registros mensuales locales
   */
  private async eliminarRegistroMensual(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    dni: string,
    mes: number
  ): Promise<void> {
    try {
      await IndexedDBConnection.init();
      const storeName = this.getStoreName(tipoPersonal, modoRegistro);
      const store = await IndexedDBConnection.getStore(storeName, "readwrite");
      const indexName = this.getIndexNameForPersonalMes(tipoPersonal);

      return new Promise((resolve, reject) => {
        try {
          const index = store.index(indexName);
          const keyValue = [dni, mes];
          const request = index.get(keyValue);

          request.onsuccess = () => {
            if (request.result) {
              const idField = this.getIdFieldForStore(
                tipoPersonal,
                modoRegistro
              );
              const id = request.result[idField];

              const deleteRequest = store.delete(id);
              deleteRequest.onsuccess = () => {
                console.log(
                  `🗑️ Registro eliminado: ${storeName} - ${dni} - mes ${mes}`
                );
                resolve();
              };
              deleteRequest.onerror = (event) => {
                reject(
                  new Error(
                    `Error al eliminar registro: ${
                      (event.target as IDBRequest).error
                    }`
                  )
                );
              };
            } else {
              resolve(); // No hay registro que eliminar
            }
          };

          request.onerror = (event) => {
            reject(
              new Error(
                `Error al buscar registro para eliminar: ${
                  (event.target as IDBRequest).error
                }`
              )
            );
          };
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      console.error("Error al eliminar registro mensual:", error);
      throw error;
    }
  }

  /**
   * Maneja los errores según su tipo y realiza logout si es necesario
   */
  private handleError(
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
   * Verifica si existe un registro mensual para un personal específico
   */
  private async verificarExistenciaRegistroMensual(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    dni: string,
    mes: number
  ): Promise<number | null> {
    try {
      await IndexedDBConnection.init();
      const storeName = this.getStoreName(tipoPersonal, modoRegistro);
      const store = await IndexedDBConnection.getStore(storeName, "readonly");
      const indexName = this.getIndexNameForPersonalMes(tipoPersonal);
      const idField = this.getIdFieldForStore(tipoPersonal, modoRegistro);

      return new Promise((resolve, reject) => {
        try {
          const index = store.index(indexName);
          const keyValue = [dni, mes];
          const request = index.get(keyValue);

          request.onsuccess = () => {
            if (request.result) {
              resolve(request.result[idField]);
            } else {
              resolve(null);
            }
          };

          request.onerror = (event) => {
            reject(
              new Error(
                `Error al verificar existencia: ${
                  (event.target as IDBRequest).error
                }`
              )
            );
          };
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      console.error(
        "Error al verificar existencia de registro mensual:",
        error
      );
      return null;
    }
  }

  /**
   * Consulta la API para obtener asistencias mensuales
   */
  private async consultarAsistenciasMensualesAPI(
    rol: RolesSistema | ActoresSistema,
    dni: string,
    mes: number
  ): Promise<AsistenciaCompletaMensualDePersonal | null> {
    try {
      const { fetchSiasisAPI } = fetchSiasisApiGenerator(this.siasisAPI);

      const fetchCancelable = await fetchSiasisAPI({
        endpoint: `/api/personal/asistencias-mensuales?Rol=${rol}&DNI=${dni}&Mes=${mes}`,
        method: "GET",
      });

      if (!fetchCancelable) {
        throw new Error(
          "No se pudo crear la petición de asistencias mensuales"
        );
      }

      const response = await fetchCancelable.fetch();

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Error al obtener asistencias: ${response.statusText}`);
      }

      const objectResponse = (await response.json()) as ApiResponseBase;

      if (!objectResponse.success) {
        if (
          (objectResponse as ErrorResponseAPIBase).errorType ===
          DataErrorTypes.NO_DATA_AVAILABLE
        ) {
          return null;
        }
        throw new Error(`Error en respuesta: ${objectResponse.message}`);
      }

      const { data } =
        objectResponse as GetAsistenciaMensualDePersonalSuccessResponse;
      return data;
    } catch (error) {
      console.error(
        "Error al consultar asistencias mensuales desde API:",
        error
      );
      return null;
    }
  }

  /**
   * Procesa los registros JSON de la API
   */
  private procesarRegistrosJSON(
    registrosJSON: any,
    modoRegistro: ModoRegistro
  ): Record<string, RegistroEntradaSalida> {
    const registrosProcesados: Record<string, RegistroEntradaSalida> = {};

    Object.entries(registrosJSON).forEach(
      ([dia, registroRaw]: [string, any]) => {
        if (registroRaw === null) {
          registrosProcesados[dia] = {
            timestamp: 0,
            desfaseSegundos: 0,
            estado: EstadosAsistenciaPersonal.Inactivo,
          };
          return;
        }

        if (registroRaw && typeof registroRaw === "object") {
          const timestamp = registroRaw.Timestamp;
          const desfaseSegundos = registroRaw.DesfaseSegundos;

          if (timestamp === null && desfaseSegundos === null) {
            registrosProcesados[dia] = {
              timestamp: 0,
              desfaseSegundos: 0,
              estado: EstadosAsistenciaPersonal.Falta,
            };
            return;
          }

          if (timestamp === null) {
            registrosProcesados[dia] = {
              timestamp: 0,
              desfaseSegundos: 0,
              estado: EstadosAsistenciaPersonal.Inactivo,
            };
            return;
          }

          if (desfaseSegundos === null) {
            registrosProcesados[dia] = {
              timestamp: timestamp || 0,
              desfaseSegundos: 0,
              estado: EstadosAsistenciaPersonal.Sin_Registro,
            };
            return;
          }

          const estado = this.determinarEstadoAsistencia(
            desfaseSegundos,
            modoRegistro
          );

          registrosProcesados[dia] = {
            timestamp: timestamp || 0,
            desfaseSegundos: desfaseSegundos || 0,
            estado,
          };
        }
      }
    );

    return registrosProcesados;
  }

  /**
   * ✅ FUNCIÓN MEJORADA: Verifica si los registros de entrada y salida están sincronizados
   * CRITERIO: Deben tener la misma cantidad de días ESCOLARES registrados (EXCLUYENDO EL DÍA ACTUAL)
   * DÍAS ESCOLARES: Solo lunes a viernes (fines de semana se ignoran)
   * MOTIVO: Durante el día actual puede haber entradas pero aún no salidas
   */
  private verificarSincronizacionEntradaSalida(
    registroEntrada: AsistenciaMensualPersonal | null,
    registroSalida: AsistenciaMensualPersonal | null
  ): {
    estanSincronizados: boolean;
    razon: string;
    diasEntrada: number;
    diasSalida: number;
    diasEscolaresEntrada: number;
    diasEscolaresSalida: number;
  } {
    // ✅ OBTENER DÍA ACTUAL desde Redux
    const fechaActualRedux = this.obtenerFechaActualDesdeRedux();
    if (!fechaActualRedux) {
      console.error(
        "❌ No se pudo obtener fecha desde Redux para verificar sincronización"
      );
      // Fallback: usar todos los días si no podemos obtener la fecha actual
      const diasEntrada = registroEntrada
        ? Object.keys(registroEntrada.registros || {}).length
        : 0;
      const diasSalida = registroSalida
        ? Object.keys(registroSalida.registros || {}).length
        : 0;

      return {
        estanSincronizados: diasEntrada === diasSalida,
        razon:
          diasEntrada === diasSalida
            ? `Ambos tienen ${diasEntrada} días (sin verificar día actual ni días escolares)`
            : `Diferente cantidad: entrada=${diasEntrada}, salida=${diasSalida} (sin verificar día actual ni días escolares)`,
        diasEntrada,
        diasSalida,
        diasEscolaresEntrada: diasEntrada,
        diasEscolaresSalida: diasSalida,
      };
    }

    const añoActual = fechaActualRedux.getFullYear();
    const mesActual = fechaActualRedux.getMonth(); // 0-11
    const diaActual = fechaActualRedux.getDate().toString();

    // ✅ FUNCIÓN para verificar si un día es día escolar (lunes a viernes)
    const esDiaEscolar = (dia: string): boolean => {
      const diaNumero = parseInt(dia);
      if (isNaN(diaNumero)) return false;

      const fecha = new Date(añoActual, mesActual, diaNumero);
      const diaSemana = fecha.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
      return diaSemana >= 1 && diaSemana <= 5; // Solo lunes a viernes
    };

    // Función para contar días escolares excluyendo el día actual
    const contarDiasEscolaresSinActual = (
      registro: AsistenciaMensualPersonal | null
    ): number => {
      if (!registro || !registro.registros) return 0;

      const diasEscolaresSinActual = Object.keys(registro.registros).filter(
        (dia) => {
          return dia !== diaActual && esDiaEscolar(dia);
        }
      );

      return diasEscolaresSinActual.length;
    };

    // Contar días en cada registro (incluyendo día actual y fines de semana para info)
    const diasEntrada = registroEntrada
      ? Object.keys(registroEntrada.registros || {}).length
      : 0;
    const diasSalida = registroSalida
      ? Object.keys(registroSalida.registros || {}).length
      : 0;

    // ✅ CONTAR SOLO DÍAS ESCOLARES EXCLUYENDO EL DÍA ACTUAL (esto es lo importante para sincronización)
    const diasEscolaresEntrada = contarDiasEscolaresSinActual(registroEntrada);
    const diasEscolaresSalida = contarDiasEscolaresSinActual(registroSalida);

    console.log(
      `🔍 Verificando sincronización de días escolares (día actual: ${diaActual}):`
    );
    console.log(
      `   📊 Entrada: ${diasEntrada} días total → ${diasEscolaresEntrada} días escolares históricos`
    );
    console.log(
      `   📊 Salida: ${diasSalida} días total → ${diasEscolaresSalida} días escolares históricos`
    );

    // ✅ VERIFICACIÓN: Solo comparar días escolares anteriores al actual
    if (diasEscolaresEntrada === diasEscolaresSalida) {
      console.log(
        `✅ SINCRONIZADOS: Ambos tienen ${diasEscolaresEntrada} días escolares históricos`
      );
      return {
        estanSincronizados: true,
        razon: `Ambos registros tienen ${diasEscolaresEntrada} días escolares históricos (excluyendo fines de semana y día actual)`,
        diasEntrada,
        diasSalida,
        diasEscolaresEntrada,
        diasEscolaresSalida,
      };
    }

    // ❌ DESINCRONIZADOS: Diferente cantidad de días escolares
    console.log(
      `❌ DESINCRONIZADOS: Entrada=${diasEscolaresEntrada} días escolares, Salida=${diasEscolaresSalida} días escolares`
    );
    return {
      estanSincronizados: false,
      razon: `Diferente cantidad de días escolares históricos: entrada=${diasEscolaresEntrada}, salida=${diasEscolaresSalida} (solo lunes-viernes, excluyendo día actual)`,
      diasEntrada,
      diasSalida,
      diasEscolaresEntrada,
      diasEscolaresSalida,
    };
  }

  /**
   * ✅ FUNCIÓN NUEVA: Fuerza la sincronización completa desde la API
   * Elimina ambos registros locales y los reemplaza con datos frescos de la API
   */
  private async forzarSincronizacionCompleta(
    rol: RolesSistema,
    dni: string,
    mes: number
  ): Promise<{
    entrada?: AsistenciaMensualPersonal;
    salida?: AsistenciaMensualPersonal;
    sincronizado: boolean;
    mensaje: string;
  }> {
    try {
      const tipoPersonal = this.obtenerTipoPersonalDesdeRolOActor(rol);

      console.log(
        `🔄 FORZANDO SINCRONIZACIÓN COMPLETA para ${dni} - mes ${mes}`
      );

      // PASO 1: Eliminar ambos registros locales (entrada y salida)
      console.log("🗑️ Eliminando registros locales desincronizados...");
      await Promise.allSettled([
        this.eliminarRegistroMensual(
          tipoPersonal,
          ModoRegistro.Entrada,
          dni,
          mes
        ),
        this.eliminarRegistroMensual(
          tipoPersonal,
          ModoRegistro.Salida,
          dni,
          mes
        ),
      ]);

      // PASO 2: Consultar API para obtener datos frescos
      console.log("📡 Consultando API para datos frescos...");
      const asistenciaAPI = await this.consultarAsistenciasMensualesAPI(
        rol,
        dni,
        mes
      );

      if (!asistenciaAPI) {
        console.log(
          "❌ API no devolvió datos después de la sincronización forzada"
        );
        return {
          sincronizado: false,
          mensaje:
            "No se encontraron datos en la API después de la sincronización",
        };
      }

      // PASO 3: Procesar y guardar AMBOS tipos de registro desde la API
      console.log("💾 Guardando datos frescos de la API...");
      await this.procesarYGuardarAsistenciaDesdeAPI(asistenciaAPI);

      // PASO 4: Verificar que ambos registros se guardaron correctamente
      const [nuevaEntrada, nuevaSalida] = await Promise.all([
        this.obtenerRegistroMensual(
          tipoPersonal,
          ModoRegistro.Entrada,
          dni,
          mes,
          asistenciaAPI.Id_Registro_Mensual_Entrada
        ),
        this.obtenerRegistroMensual(
          tipoPersonal,
          ModoRegistro.Salida,
          dni,
          mes,
          asistenciaAPI.Id_Registro_Mensual_Salida
        ),
      ]);

      // PASO 5: Verificar que la sincronización fue exitosa
      const verificacion = this.verificarSincronizacionEntradaSalida(
        nuevaEntrada,
        nuevaSalida
      );

      if (verificacion.estanSincronizados) {
        console.log(
          `✅ Datos sincronizados: ${verificacion.diasEscolaresEntrada} días escolares históricos + día actual y fines de semana permitidos`
        );
        return {
          entrada: nuevaEntrada || undefined,
          salida: nuevaSalida || undefined,
          sincronizado: true,
          mensaje: `Datos sincronizados exitosamente: ${verificacion.diasEscolaresEntrada} días escolares históricos`,
        };
      } else {
        console.log(`❌ Sincronización falló: ${verificacion.razon}`);
        return {
          entrada: nuevaEntrada || undefined,
          salida: nuevaSalida || undefined,
          sincronizado: false,
          mensaje: `Error en sincronización: ${verificacion.razon}`,
        };
      }
    } catch (error) {
      console.error("❌ Error durante sincronización forzada:", error);
      return {
        sincronizado: false,
        mensaje: `Error durante la sincronización: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * Guarda un registro mensual de asistencia usando el ID real de la API
   */
  public async guardarRegistroMensual(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    datos: AsistenciaMensualPersonal
  ): Promise<void> {
    try {
      await IndexedDBConnection.init();
      const storeName = this.getStoreName(tipoPersonal, modoRegistro);
      const store = await IndexedDBConnection.getStore(storeName, "readwrite");
      const idFieldName = this.getIdFieldName(tipoPersonal);
      const idField = this.getIdFieldForStore(tipoPersonal, modoRegistro);

      return new Promise((resolve, reject) => {
        try {
          const registroToSave: any = {
            [idField]: datos.Id_Registro_Mensual,
            Mes: datos.mes,
            [idFieldName]: datos.Dni_Personal,
          };

          if (modoRegistro === ModoRegistro.Entrada) {
            registroToSave.Entradas = datos.registros;
          } else {
            registroToSave.Salidas = datos.registros;
          }

          const putRequest = store.put(registroToSave);

          putRequest.onsuccess = () => {
            resolve();
          };

          putRequest.onerror = (event) => {
            reject(
              new Error(
                `Error al guardar registro mensual: ${
                  (event.target as IDBRequest).error
                }`
              )
            );
          };
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      this.handleError(error, "guardarRegistroMensual", {
        tipoPersonal,
        modoRegistro,
        Dni_Personal: datos.Dni_Personal,
        mes: datos.mes,
        Id_Registro_Mensual: datos.Id_Registro_Mensual,
      });
      throw error;
    }
  }

  /**
   * Obtiene el registro mensual de asistencia para un personal específico
   */
  public async obtenerRegistroMensual(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    Dni_Personal: string,
    mes: number,
    id_registro_mensual?: number
  ): Promise<AsistenciaMensualPersonal | null> {
    try {
      await IndexedDBConnection.init();
      const storeName = this.getStoreName(tipoPersonal, modoRegistro);
      const store = await IndexedDBConnection.getStore(storeName, "readonly");

      if (id_registro_mensual) {
        return new Promise((resolve, reject) => {
          try {
            const request = store.get(id_registro_mensual);

            request.onsuccess = () => {
              if (request.result) {
                const registroMensual: AsistenciaMensualPersonal =
                  this.mapearRegistroMensualDesdeStore(
                    request.result,
                    tipoPersonal,
                    modoRegistro
                  );
                resolve(registroMensual);
              } else {
                resolve(null);
              }
            };

            request.onerror = (event) => {
              reject(
                new Error(
                  `Error al obtener registro mensual por ID: ${
                    (event.target as IDBRequest).error
                  }`
                )
              );
            };
          } catch (error) {
            reject(error);
          }
        });
      }

      const indexName = this.getIndexNameForPersonalMes(tipoPersonal);

      return new Promise((resolve, reject) => {
        try {
          const index = store.index(indexName);
          const keyValue = [Dni_Personal, mes];
          const request = index.get(keyValue);

          request.onsuccess = () => {
            if (request.result) {
              const registroMensual: AsistenciaMensualPersonal =
                this.mapearRegistroMensualDesdeStore(
                  request.result,
                  tipoPersonal,
                  modoRegistro
                );
              resolve(registroMensual);
            } else {
              resolve(null);
            }
          };

          request.onerror = (event) => {
            reject(
              new Error(
                `Error al obtener registro mensual por índice: ${
                  (event.target as IDBRequest).error
                }`
              )
            );
          };
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      this.handleError(error, "obtenerRegistroMensual", {
        tipoPersonal,
        modoRegistro,
        Dni_Personal,
        mes,
        id_registro_mensual,
      });
      throw error;
    }
  }

  /**
   * Mapea un registro obtenido del store a la interfaz AsistenciaMensualPersonal
   */
  private mapearRegistroMensualDesdeStore(
    registroStore: any,
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro
  ): AsistenciaMensualPersonal {
    const idField = this.getIdFieldForStore(tipoPersonal, modoRegistro);
    const idPersonalField = this.getIdFieldName(tipoPersonal);

    return {
      Id_Registro_Mensual: registroStore[idField],
      mes: registroStore.Mes,
      Dni_Personal: registroStore[idPersonalField],
      registros:
        modoRegistro === ModoRegistro.Entrada
          ? registroStore.Entradas
          : registroStore.Salidas,
    };
  }

  /**
   * Actualiza un registro existente agregando un nuevo día
   */
  private async actualizarRegistroExistente(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    dni: string,
    mes: number,
    dia: number,
    registro: RegistroEntradaSalida,
    idRegistroExistente: number
  ): Promise<void> {
    try {
      const registroActual = await this.obtenerRegistroMensual(
        tipoPersonal,
        modoRegistro,
        dni,
        mes,
        idRegistroExistente
      );

      if (registroActual) {
        registroActual.registros[dia.toString()] = registro;
        await this.guardarRegistroMensual(
          tipoPersonal,
          modoRegistro,
          registroActual
        );
      }
    } catch (error) {
      this.handleError(error, "actualizarRegistroExistente", {
        tipoPersonal,
        modoRegistro,
        dni,
        mes,
        dia,
      });
      throw error;
    }
  }

  private async procesarYGuardarAsistenciaDesdeAPI(
    asistenciaAPI: AsistenciaCompletaMensualDePersonal,
    modoRegistroSolicitado?: ModoRegistro
  ): Promise<void> {
    const tipoPersonal = this.obtenerTipoPersonalDesdeRolOActor(
      asistenciaAPI.Rol
    );

    const procesarYGuardar = async (modoRegistro: ModoRegistro) => {
      const registrosData =
        modoRegistro === ModoRegistro.Entrada
          ? asistenciaAPI.Entradas
          : asistenciaAPI.Salidas;

      const idReal =
        modoRegistro === ModoRegistro.Entrada
          ? asistenciaAPI.Id_Registro_Mensual_Entrada
          : asistenciaAPI.Id_Registro_Mensual_Salida;

      const registrosProcesados = this.procesarRegistrosJSON(
        registrosData,
        modoRegistro
      );

      if (Object.keys(registrosProcesados).length > 0) {
        await this.guardarRegistroMensual(tipoPersonal, modoRegistro, {
          Id_Registro_Mensual: idReal,
          mes: asistenciaAPI.Mes,
          Dni_Personal: asistenciaAPI.DNI_Usuario,
          registros: registrosProcesados,
        });
      }
    };

    if (modoRegistroSolicitado) {
      await procesarYGuardar(modoRegistroSolicitado);
    } else {
      await Promise.all([
        procesarYGuardar(ModoRegistro.Entrada),
        procesarYGuardar(ModoRegistro.Salida),
      ]);
    }
  }

  /**
   * ✅ NUEVA FUNCIÓN: Fuerza la actualización desde la API eliminando datos locales
   */
  public async forzarActualizacionDesdeAPI(
    rol: RolesSistema,
    dni: string,
    mes: number
  ): Promise<{
    entrada?: AsistenciaMensualPersonal;
    salida?: AsistenciaMensualPersonal;
    encontrado: boolean;
    mensaje: string;
  }> {
    try {
      const tipoPersonal = this.obtenerTipoPersonalDesdeRolOActor(rol);

      console.log(
        `🔄 Forzando actualización desde API para ${rol} ${dni} - mes ${mes}...`
      );

      // Eliminar registros locales existentes
      await Promise.all([
        this.eliminarRegistroMensual(
          tipoPersonal,
          ModoRegistro.Entrada,
          dni,
          mes
        ),
        this.eliminarRegistroMensual(
          tipoPersonal,
          ModoRegistro.Salida,
          dni,
          mes
        ),
      ]);

      // Consultar API y guardar
      return await this.obtenerAsistenciaMensualConAPI(rol, dni, mes);
    } catch (error) {
      console.error("Error al forzar actualización desde API:", error);
      this.handleError(error, "forzarActualizacionDesdeAPI", {
        rol,
        dni,
        mes,
      });

      return {
        encontrado: false,
        mensaje: "Error al forzar la actualización de datos",
      };
    }
  }

  /**
   * Obtiene todos los días laborales anteriores al día actual en el mes (usando fecha Redux)
   */
  private obtenerDiasLaboralesAnteriores(): number[] {
    const fechaActual = this.obtenerFechaActualDesdeRedux();

    if (!fechaActual) {
      console.error("No se pudo obtener la fecha desde Redux");
      return [];
    }

    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth(); // 0-11
    const diaActual = fechaActual.getDate();

    const diasLaborales: number[] = [];

    // Buscar días hábiles (lunes a viernes) desde el inicio del mes hasta AYER
    for (let dia = 1; dia < diaActual; dia++) {
      // Nota: dia < diaActual (no <=)
      const fecha = new Date(anio, mes, dia);
      const diaSemana = fecha.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado

      // Si es día hábil (lunes a viernes)
      if (diaSemana >= 1 && diaSemana <= 5) {
        diasLaborales.push(dia);
      }
    }

    return diasLaborales;
  }

  /**
   * Verifica si el registro mensual tiene TODOS los días laborales anteriores
   */
  private verificarRegistroMensualCompleto(
    registroMensual: AsistenciaMensualPersonal | null,
    diasLaboralesAnteriores: number[]
  ): boolean {
    if (!registroMensual || !registroMensual.registros) {
      return false;
    }

    // Si no hay días laborales anteriores (primer día laboral del mes), consideramos completo
    if (diasLaboralesAnteriores.length === 0) {
      return true;
    }

    // Verificar que TODOS los días laborales anteriores estén registrados
    for (const diaLaboral of diasLaboralesAnteriores) {
      const diaRegistrado = registroMensual.registros[diaLaboral.toString()];
      if (!diaRegistrado) {
        console.log(
          `❌ Falta el día laboral ${diaLaboral} en el registro mensual`
        );
        return false;
      }
    }

    console.log(
      `✅ Todos los días laborales anteriores están registrados: [${diasLaboralesAnteriores.join(
        ", "
      )}]`
    );
    return true;
  }

  /**
   * ✅ FUNCIÓN AUXILIAR: Genera clave para cache (formato compatible con Redis)
   */
  private generarClaveCache(
    actor: ActoresSistema,
    modoRegistro: ModoRegistro,
    dni: string,
    fecha: string
  ): string {
    return `${fecha}:${modoRegistro}:${actor}:${dni}`;
  }

  /**
   * ✅ FUNCIÓN NUEVA: Consulta cache de asistencias para el día actual
   * 🔍 OPTIMIZADA: Con logging detallado para debugging
   */
  private async consultarCacheAsistenciaHoy(
    actor: ActoresSistema,
    modoRegistro: ModoRegistro,
    dni: string,
    fecha: string
  ): Promise<AsistenciaPersonalHoy | null> {
    try {
      const consulta: ConsultaAsistenciaHoy = {
        dni,
        actor,
        modoRegistro,
        tipoAsistencia: TipoAsistencia.ParaPersonal,
        fecha,
      };

      console.log(
        `🔍 Consultando cache: ${actor} - ${modoRegistro} - ${dni} - ${fecha}`
      );

      const resultado = await this.cacheAsistenciasHoy.consultarAsistencia(
        consulta
      );

      if (resultado) {
        console.log(
          `✅ Encontrado en cache: ${dni} - ${modoRegistro} - ${
            (resultado as AsistenciaPersonalHoy).estado
          }`
        );
      } else {
        console.log(`❌ No encontrado en cache: ${dni} - ${modoRegistro}`);
      }

      return resultado as AsistenciaPersonalHoy | null;
    } catch (error) {
      console.error("Error al consultar cache de asistencias:", error);
      return null;
    }
  }

  /**
   * ✅ FUNCIÓN NUEVA: Integra datos del cache en el registro mensual
   * 📝 DETALLADA: Con logging para seguimiento de la integración
   */
  private integrarDatosDeCacheEnRegistroMensual(
    registroMensual: AsistenciaMensualPersonal | null,
    datosCache: AsistenciaPersonalHoy,
    diaActual: number,
    modoRegistro: ModoRegistro,
    dni: string,
    fecha: string
  ): AsistenciaMensualPersonal {
    // Si no existe registro mensual, crear uno nuevo
    if (!registroMensual) {
      const fechaObj = new Date(fecha);
      const mes = (fechaObj.getMonth() + 1) as Meses;

      console.log(`📝 Creando nuevo registro mensual para ${dni} - mes ${mes}`);

      registroMensual = {
        Id_Registro_Mensual: 0, // ID temporal
        mes,
        Dni_Personal: dni,
        registros: {},
      };
    }

    // Agregar/actualizar el día actual con datos del cache
    const registroDia: RegistroEntradaSalida = {
      timestamp: datosCache.timestamp,
      desfaseSegundos: datosCache.desfaseSegundos,
      estado: datosCache.estado,
    };

    registroMensual.registros[diaActual.toString()] = registroDia;

    console.log(
      `🔄 Día ${diaActual} integrado desde cache: ${datosCache.estado} (timestamp: ${datosCache.timestamp})`
    );

    return registroMensual;
  }
  /**
   * ✅ FUNCIÓN AUXILIAR: Mapea rol del sistema a actor
   */
  private obtenerActorDesdeRol(rol: RolesSistema): ActoresSistema {
    switch (rol) {
      case RolesSistema.ProfesorPrimaria:
        return ActoresSistema.ProfesorPrimaria;
      case RolesSistema.ProfesorSecundaria:
      case RolesSistema.Tutor:
        return ActoresSistema.ProfesorSecundaria;
      case RolesSistema.Auxiliar:
        return ActoresSistema.Auxiliar;
      case RolesSistema.PersonalAdministrativo:
        return ActoresSistema.PersonalAdministrativo;
      default:
        throw new Error(`Rol no válido para asistencia personal: ${rol}`);
    }
  }

  /**
   * ✅ FUNCIÓN NUEVA: Combina datos históricos (IndexedDB) con datos del día actual (cache Redis)
   */
  private async combinarDatosHistoricosYActuales(
    registroEntrada: AsistenciaMensualPersonal | null,
    registroSalida: AsistenciaMensualPersonal | null,
    rol: RolesSistema,
    dni: string,
    esConsultaMesActual: boolean,
    diaActual: number,
    mensajeBase: string
  ): Promise<{
    entrada?: AsistenciaMensualPersonal;
    salida?: AsistenciaMensualPersonal;
    encontrado: boolean;
    mensaje: string;
  }> {
    let entradaFinal = registroEntrada;
    let salidaFinal = registroSalida;
    let encontradoEnCache = false;

    // ✅ INTEGRACIÓN CACHE: Solo para consultas del mes actual
    if (esConsultaMesActual) {
      console.log(
        `🔍 Consultando cache Redis para el día actual (${diaActual})...`
      );

      const actor = this.obtenerActorDesdeRol(rol);
      const fechaHoy = this.obtenerFechaActualDesdeRedux()
        ?.toISOString()
        .split("T")[0];

      if (fechaHoy) {
        // Consultar cache para entrada y salida del día actual
        const [entradaCache, salidaCache] = await Promise.all([
          this.consultarCacheAsistenciaHoy(
            actor,
            ModoRegistro.Entrada,
            dni,
            fechaHoy
          ),
          this.consultarCacheAsistenciaHoy(
            actor,
            ModoRegistro.Salida,
            dni,
            fechaHoy
          ),
        ]);

        // ✅ INTEGRAR ENTRADA desde cache
        if (entradaCache) {
          console.log(`📱 Entrada del día actual encontrada en cache`);
          entradaFinal = this.integrarDatosDeCacheEnRegistroMensual(
            entradaFinal,
            entradaCache,
            diaActual,
            ModoRegistro.Entrada,
            dni,
            fechaHoy
          );
          encontradoEnCache = true;
        }

        // ✅ INTEGRAR SALIDA desde cache
        if (salidaCache) {
          console.log(`📱 Salida del día actual encontrada en cache`);
          salidaFinal = this.integrarDatosDeCacheEnRegistroMensual(
            salidaFinal,
            salidaCache,
            diaActual,
            ModoRegistro.Salida,
            dni,
            fechaHoy
          );
          encontradoEnCache = true;
        }
      }
    }

    const encontrado = !!(entradaFinal || salidaFinal);
    let mensaje = mensajeBase;

    if (encontradoEnCache) {
      mensaje += " + datos del día actual desde cache Redis";
    }

    return {
      entrada: entradaFinal || undefined,
      salida: salidaFinal || undefined,
      encontrado,
      mensaje,
    };
  }

  /**
   * ✅ FUNCIÓN NUEVA: Obtiene solo datos del día actual cuando no hay datos históricos
   * 🎯 MEJORADA: Maneja casos de fallback cuando no hay datos en API
   */
  private async obtenerSoloDatosDelDiaActual(
    rol: RolesSistema,
    dni: string,
    diaActual: number
  ): Promise<{
    entrada?: AsistenciaMensualPersonal;
    salida?: AsistenciaMensualPersonal;
    encontrado: boolean;
    mensaje: string;
  }> {
    const actor = this.obtenerActorDesdeRol(rol);
    const fechaHoy = this.obtenerFechaActualDesdeRedux()
      ?.toISOString()
      .split("T")[0];

    if (!fechaHoy) {
      return {
        encontrado: false,
        mensaje: "No se pudo obtener la fecha actual",
      };
    }

    console.log(
      `🔍 Buscando datos del día actual en cache para ${dni} - ${fechaHoy}`
    );

    const [entradaCache, salidaCache] = await Promise.all([
      this.consultarCacheAsistenciaHoy(
        actor,
        ModoRegistro.Entrada,
        dni,
        fechaHoy
      ),
      this.consultarCacheAsistenciaHoy(
        actor,
        ModoRegistro.Salida,
        dni,
        fechaHoy
      ),
    ]);

    let entrada: AsistenciaMensualPersonal | undefined;
    let salida: AsistenciaMensualPersonal | undefined;

    if (entradaCache) {
      entrada = this.integrarDatosDeCacheEnRegistroMensual(
        null,
        entradaCache,
        diaActual,
        ModoRegistro.Entrada,
        dni,
        fechaHoy
      );
      console.log(
        `✅ Entrada del día actual encontrada en cache: ${entradaCache.estado}`
      );
    }

    if (salidaCache) {
      salida = this.integrarDatosDeCacheEnRegistroMensual(
        null,
        salidaCache,
        diaActual,
        ModoRegistro.Salida,
        dni,
        fechaHoy
      );
      console.log(
        `✅ Salida del día actual encontrada en cache: ${salidaCache.estado}`
      );
    }

    const encontrado = !!(entrada || salida);

    if (encontrado) {
      console.log(
        `🎯 Datos del día actual encontrados en cache: entrada=${!!entrada}, salida=${!!salida}`
      );
    } else {
      console.log(
        `❌ No se encontraron datos del día actual en cache para ${dni}`
      );
    }

    return {
      entrada,
      salida,
      encontrado,
      mensaje: encontrado
        ? "Solo datos del día actual encontrados en cache Redis"
        : "No se encontraron registros de asistencia para el mes consultado",
    };
  }

  /**
   * ✅ FUNCIÓN MEJORADA: Obtiene asistencias mensuales con verificación de sincronización
   * 🆕 NUEVA FUNCIONALIDAD: Integra datos del día actual desde cache Redis
   * 📅 LÓGICA: Para el mes actual en curso, combina datos históricos + datos del día
   * 🔍 CASO 404: Si API no encuentra datos, busca en cache local para mostrar info disponible
   */
  public async obtenerAsistenciaMensualConAPI(
    rol: RolesSistema,
    dni: string,
    mes: number
  ): Promise<{
    entrada?: AsistenciaMensualPersonal;
    salida?: AsistenciaMensualPersonal;
    encontrado: boolean;
    mensaje: string;
  }> {
    try {
      const tipoPersonal = this.obtenerTipoPersonalDesdeRolOActor(rol);

      // ✅ OBTENER FECHA ACTUAL desde Redux
      const fechaActualRedux = this.obtenerFechaActualDesdeRedux();
      if (!fechaActualRedux) {
        throw new Error("No se pudo obtener la fecha desde Redux");
      }

      const mesActual = fechaActualRedux.getMonth() + 1;
      const diaActual = fechaActualRedux.getDate();
      const esConsultaMesActual = mes === mesActual;

      console.log(
        `🎯 Iniciando consulta para ${dni} - mes ${mes} (actual: ${mesActual})`
      );
      console.log(
        `📅 Es consulta del mes actual: ${esConsultaMesActual ? "SÍ" : "NO"}`
      );

      // PASO 1: Buscar registros locales (entrada y salida)
      const [registroEntradaLocal, registroSalidaLocal] = await Promise.all([
        this.obtenerRegistroMensual(
          tipoPersonal,
          ModoRegistro.Entrada,
          dni,
          mes
        ),
        this.obtenerRegistroMensual(
          tipoPersonal,
          ModoRegistro.Salida,
          dni,
          mes
        ),
      ]);

      // PASO 2: Verificar sincronización por cantidad de días
      const verificacion = this.verificarSincronizacionEntradaSalida(
        registroEntradaLocal,
        registroSalidaLocal
      );

      // PASO 3: Si NO están sincronizados, forzar sincronización desde API
      if (!verificacion.estanSincronizados) {
        console.log(`⚠️ DATOS DESINCRONIZADOS: ${verificacion.razon}`);
        console.log("🔄 Iniciando sincronización forzada desde API...");

        const resultadoSincronizacion = await this.forzarSincronizacionCompleta(
          rol,
          dni,
          mes
        );

        if (resultadoSincronizacion.sincronizado) {
          // Si logramos sincronizar desde API, aplicar integración con cache
          return await this.combinarDatosHistoricosYActuales(
            resultadoSincronizacion.entrada || null,
            resultadoSincronizacion.salida || null,
            rol,
            dni,
            esConsultaMesActual,
            diaActual,
            `🔄 ${resultadoSincronizacion.mensaje}`
          );
        } else {
          // ✅ NUEVO: Si sincronización falla, buscar en cache al menos el día actual
          if (esConsultaMesActual) {
            console.log(
              "🔍 Sincronización falló, buscando datos del día actual en cache..."
            );
            return await this.obtenerSoloDatosDelDiaActual(rol, dni, diaActual);
          } else {
            return {
              encontrado: false,
              mensaje: `❌ Error en sincronización: ${resultadoSincronizacion.mensaje}`,
            };
          }
        }
      }

      // PASO 4: Los datos están sincronizados, proceder según el tipo de consulta
      if (
        verificacion.diasEscolaresEntrada === 0 &&
        verificacion.diasEscolaresSalida === 0
      ) {
        // ✅ CASO 1: No hay datos históricos - Primera consulta del mes
        console.log(
          "📡 No hay datos escolares históricos, consultando API por primera vez..."
        );

        const asistenciaAPI = await this.consultarAsistenciasMensualesAPI(
          rol,
          dni,
          mes
        );

        if (asistenciaAPI) {
          console.log("✅ API devolvió datos históricos, guardando...");
          await this.procesarYGuardarAsistenciaDesdeAPI(asistenciaAPI);

          const [nuevaEntrada, nuevaSalida] = await Promise.all([
            this.obtenerRegistroMensual(
              tipoPersonal,
              ModoRegistro.Entrada,
              dni,
              mes,
              asistenciaAPI.Id_Registro_Mensual_Entrada
            ),
            this.obtenerRegistroMensual(
              tipoPersonal,
              ModoRegistro.Salida,
              dni,
              mes,
              asistenciaAPI.Id_Registro_Mensual_Salida
            ),
          ]);

          return await this.combinarDatosHistoricosYActuales(
            nuevaEntrada,
            nuevaSalida,
            rol,
            dni,
            esConsultaMesActual,
            diaActual,
            "Datos obtenidos y guardados desde la API"
          );
        } else {
          // ✅ CASO MEJORADO: API no tiene datos (404), buscar en cache local para mostrar info disponible
          console.log("❌ API devolvió 404 (sin datos históricos)");

          if (esConsultaMesActual) {
            console.log(
              "🔍 API sin datos, verificando cache Redis para mostrar al menos el día actual..."
            );
            const resultadoCache = await this.obtenerSoloDatosDelDiaActual(
              rol,
              dni,
              diaActual
            );

            if (resultadoCache.encontrado) {
              // ✅ ÉXITO: Encontramos datos del día actual en cache
              return {
                ...resultadoCache,
                mensaje:
                  "📱 API sin datos históricos, mostrando solo asistencia del día actual desde cache Redis",
              };
            } else {
              // ❌ Ni API ni cache tienen datos
              return {
                encontrado: false,
                mensaje:
                  "No se encontraron registros de asistencia para el mes consultado (ni en API ni en cache local)",
              };
            }
          } else {
            // Para meses anteriores sin datos en API
            return {
              encontrado: false,
              mensaje:
                "No se encontraron registros de asistencia para el mes consultado",
            };
          }
        }
      }

      // ✅ CASO 2: Hay datos históricos sincronizados
      console.log(
        `✅ Datos locales sincronizados: ${verificacion.diasEscolaresEntrada} días escolares históricos`
      );

      return await this.combinarDatosHistoricosYActuales(
        registroEntradaLocal,
        registroSalidaLocal,
        rol,
        dni,
        esConsultaMesActual,
        diaActual,
        `Datos sincronizados obtenidos desde IndexedDB: ${verificacion.diasEscolaresEntrada} días escolares históricos`
      );
    } catch (error) {
      console.error(
        "❌ Error al obtener asistencias mensuales con API:",
        error
      );

      // ✅ NUEVO: En caso de error, intentar mostrar al menos datos del cache si es mes actual
      const fechaActualRedux = this.obtenerFechaActualDesdeRedux();
      if (fechaActualRedux && mes === fechaActualRedux.getMonth() + 1) {
        console.log(
          "🆘 Error en consulta principal, intentando mostrar datos del cache como fallback..."
        );
        try {
          const fallbackCache = await this.obtenerSoloDatosDelDiaActual(
            rol,
            dni,
            fechaActualRedux.getDate()
          );

          if (fallbackCache.encontrado) {
            return {
              ...fallbackCache,
              mensaje:
                "⚠️ Error en consulta principal, mostrando datos del día actual desde cache como respaldo",
            };
          }
        } catch (cacheError) {
          console.error("Error también en fallback de cache:", cacheError);
        }
      }

      this.handleError(error, "obtenerAsistenciaMensualConAPI", {
        rol,
        dni,
        mes,
      });

      return {
        encontrado: false,
        mensaje: "Error al obtener los datos de asistencia",
      };
    }
  }

  /**
   * ✅ FUNCIÓN MEJORADA: Marca asistencia con nueva lógica optimizada
   * 🎯 CAMBIO PRINCIPAL: Si NO existe registro mensual, guarda en cache Redis en lugar de consultar API
   * 📱 OPTIMIZACIÓN: Evita consultas innecesarias a PostgreSQL para el primer registro del día
   */
  public async marcarAsistencia({
    datos,
  }: {
    datos: RegistroAsistenciaUnitariaPersonal;
  }): Promise<void> {
    try {
      const {
        ModoRegistro: modoRegistro,
        DNI: dni,
        Rol: rol,
        Dia: dia,
        Detalles,
      } = datos;

      // ✅ USAR FECHA REDUX en lugar de fecha del timestamp
      const fechaActualRedux = this.obtenerFechaActualDesdeRedux();
      if (!fechaActualRedux) {
        throw new Error("No se pudo obtener la fecha desde Redux");
      }

      const tipoPersonal = this.obtenerTipoPersonalDesdeRolOActor(rol);
      const mes = fechaActualRedux.getMonth() + 1; // Usar mes de Redux
      // const diaActualRedux = fechaActualRedux.getDate();

      const estado = this.determinarEstadoAsistencia(
        (Detalles as DetallesAsistenciaUnitariaPersonal)!.DesfaseSegundos,
        modoRegistro
      );

      const registro: RegistroEntradaSalida = {
        timestamp: (Detalles as DetallesAsistenciaUnitariaPersonal)!.Timestamp,
        estado: estado,
        desfaseSegundos: (Detalles as DetallesAsistenciaUnitariaPersonal)!
          .DesfaseSegundos,
      };

      console.log(
        `🚀 Iniciando marcado de asistencia: ${dni} - ${modoRegistro} - día ${dia} (fecha Redux: ${fechaActualRedux.toISOString()})`
      );

      // ✅ PASO 1: Verificar si ya existe un registro mensual en IndexedDB
      const registroMensualExistente = await this.obtenerRegistroMensual(
        tipoPersonal,
        modoRegistro,
        dni,
        mes
      );

      if (registroMensualExistente) {
        // ✅ CASO SIMPLE: Ya existe registro mensual → Agregar día actual directamente
        console.log(
          `📱 Registro mensual encontrado (ID: ${registroMensualExistente.Id_Registro_Mensual}), agregando día ${dia} directamente`
        );

        // Verificar si el día ya existe (evitar sobrescribir)
        if (registroMensualExistente.registros[dia.toString()]) {
          console.log(
            `⚠️ El día ${dia} ya tiene registro, sobrescribiendo con nuevo valor`
          );
        }

        // Agregar/actualizar el día actual
        registroMensualExistente.registros[dia.toString()] = registro;

        // Guardar el registro actualizado
        await this.guardarRegistroMensual(
          tipoPersonal,
          modoRegistro,
          registroMensualExistente
        );

        console.log(
          `✅ Asistencia marcada exitosamente (registro existente): ${rol} ${dni} - ${modoRegistro} - ${estado}`
        );

        return;
      }

      // ✅ NUEVA LÓGICA: No existe registro mensual → Guardar en cache Redis
      console.log(
        `💾 No existe registro mensual para ${dni} - mes ${mes}, guardando en cache Redis`
      );

      const tipoAsistencia = TipoAsistencia.ParaPersonal;

      // Crear asistencia para el cache
      const fechaString = fechaActualRedux.toISOString().split("T")[0]; // YYYY-MM-DD
      const clave = this.generarClaveCache(
        rol as ActoresSistema,
        modoRegistro,
        dni,
        fechaString
      );

      const asistenciaCache: AsistenciaPersonalHoy = {
        clave,
        dni,
        actor: rol as ActoresSistema,
        modoRegistro,
        tipoAsistencia,
        timestamp: registro.timestamp,
        desfaseSegundos: registro.desfaseSegundos,
        estado: registro.estado,
        fecha: fechaString,
        timestampConsulta: Date.now(),
      };

      // Guardar en cache Redis
      await this.cacheAsistenciasHoy.guardarAsistencia(asistenciaCache);

      console.log(
        `✅ Asistencia marcada exitosamente (guardada en cache Redis): ${rol} ${dni} - ${modoRegistro} - ${estado}`
      );
    } catch (error) {
      console.error(`❌ Error al marcar asistencia:`, error);

      this.handleError(error, "marcarAsistencia", {
        modo: datos.ModoRegistro,
        dni: datos.DNI,
        rol: datos.Rol,
        dia: datos.Dia,
      });

      throw error;
    }
  }

  /**
   * Sincroniza las asistencias registradas en Redis con la base de datos local IndexedDB
   */
  public async sincronizarAsistenciasDesdeRedis(
    datosRedis: ConsultarAsistenciasTomadasPorActorEnRedisResponseBody
  ): Promise<{
    totalRegistros: number;
    registrosNuevos: number;
    registrosExistentes: number;
    errores: number;
  }> {
    const stats = {
      totalRegistros: (datosRedis.Resultados as AsistenciaDiariaResultado[])
        .length,
      registrosNuevos: 0,
      registrosExistentes: 0,
      errores: 0,
    };

    try {
      const tipoPersonal = this.obtenerTipoPersonalDesdeRolOActor(
        datosRedis.Actor
      );

      const mesActual = datosRedis.Mes;
      const diaActual = datosRedis.Dia;

      if (diaActual === 0) {
        console.error(
          "No se pudo determinar el día desde los resultados de Redis"
        );
        return {
          ...stats,
          errores: stats.totalRegistros,
        };
      }

      for (const resultado of datosRedis.Resultados as AsistenciaDiariaResultado[]) {
        try {
          const registroExistente = await this.verificarSiExisteRegistroDiario(
            tipoPersonal,
            datosRedis.ModoRegistro,
            resultado.DNI,
            mesActual,
            diaActual
          );

          if (registroExistente) {
            stats.registrosExistentes++;
            continue;
          }

          const registro: RegistroAsistenciaUnitariaPersonal = {
            ModoRegistro: datosRedis.ModoRegistro,
            DNI: resultado.DNI,
            Rol: datosRedis.Actor,
            Dia: diaActual,
            Detalles: resultado.Detalles && {
              Timestamp: (
                resultado.Detalles as DetallesAsistenciaUnitariaPersonal
              ).Timestamp,
              DesfaseSegundos: (
                resultado.Detalles as DetallesAsistenciaUnitariaPersonal
              ).DesfaseSegundos,
            },
            esNuevoRegistro: true,
          };

          await this.marcarAsistencia({
            datos: registro,
          });

          stats.registrosNuevos++;
        } catch (error) {
          console.error(
            `Error al sincronizar registro para DNI ${resultado.DNI}:`,
            error
          );
          stats.errores++;
        }
      }

      return stats;
    } catch (error) {
      this.handleError(error, "sincronizarAsistenciasDesdeRedis", {
        actor: datosRedis.Actor,
        modoRegistro: datosRedis.ModoRegistro,
        mes: datosRedis.Mes,
        totalRegistros: (datosRedis.Resultados as AsistenciaDiariaResultado[])
          .length,
      });

      return {
        ...stats,
        errores: stats.totalRegistros,
      };
    }
  }

  /**
   * Verifica si ya existe un registro diario para un personal específico
   */
  private async verificarSiExisteRegistroDiario(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    dni: string,
    mes: number,
    dia: number
  ): Promise<boolean> {
    try {
      await IndexedDBConnection.init();
      const storeName = this.getStoreName(tipoPersonal, modoRegistro);
      const store = await IndexedDBConnection.getStore(storeName, "readonly");
      const indexName = this.getIndexNameForPersonalMes(tipoPersonal);

      return new Promise((resolve, reject) => {
        try {
          const index = store.index(indexName);
          const keyValue = [dni, mes];
          const request = index.get(keyValue);

          request.onsuccess = () => {
            if (request.result) {
              const registrosDias =
                modoRegistro === ModoRegistro.Entrada
                  ? request.result.Entradas
                  : request.result.Salidas;

              if (registrosDias && registrosDias[dia.toString()]) {
                resolve(true);
                return;
              }
            }
            resolve(false);
          };

          request.onerror = (event) => {
            reject(
              new Error(
                `Error al verificar existencia de registro diario: ${
                  (event.target as IDBRequest).error
                }`
              )
            );
          };
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      console.error("Error al verificar existencia de registro diario:", error);
      return false;
    }
  }

  /**
   * Verifica si un personal ha marcado asistencia (entrada o salida) hoy
   * USA FECHA REDUX en lugar de fecha local
   */
  public async hasMarcadoHoy(
    modoRegistro: ModoRegistro,
    rol: RolesSistema,
    dni: string
  ): Promise<{
    marcado: boolean;
    timestamp?: number;
    desfaseSegundos?: number;
    estado?: string;
  }> {
    try {
      // ✅ USAR FECHA REDUX
      const fechaActualRedux = this.obtenerFechaActualDesdeRedux();
      if (!fechaActualRedux) {
        console.error("No se pudo obtener la fecha desde Redux");
        return { marcado: false };
      }

      const tipoPersonal = this.obtenerTipoPersonalDesdeRolOActor(rol);
      const mes = fechaActualRedux.getMonth() + 1;
      const dia = fechaActualRedux.getDate();

      const haRegistrado = await this.verificarSiExisteRegistroDiario(
        tipoPersonal,
        modoRegistro,
        dni,
        mes,
        dia
      );

      if (haRegistrado) {
        // Obtener los detalles del registro
        const registroMensual = await this.obtenerRegistroMensual(
          tipoPersonal,
          modoRegistro,
          dni,
          mes
        );

        if (registroMensual && registroMensual.registros[dia.toString()]) {
          const registroDia = registroMensual.registros[dia.toString()];
          return {
            marcado: true,
            timestamp: registroDia.timestamp,
            desfaseSegundos: registroDia.desfaseSegundos,
            estado: registroDia.estado,
          };
        }
      }

      return { marcado: false };
    } catch (error) {
      console.error("Error al verificar si ha marcado hoy:", error);
      return { marcado: false };
    }
  }

  /**
   * Obtiene todos los registros mensuales para un tipo de personal y un mes específico
   */
  public async obtenerTodosRegistrosMensuales(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    mes: Meses
  ): Promise<AsistenciaMensualPersonal[]> {
    try {
      await IndexedDBConnection.init();
      const storeName = this.getStoreName(tipoPersonal, modoRegistro);
      const store = await IndexedDBConnection.getStore(storeName, "readonly");
      const idFieldName = this.getIdFieldName(tipoPersonal);
      const idField = this.getIdFieldForStore(tipoPersonal, modoRegistro);

      return new Promise((resolve, reject) => {
        try {
          const index = store.index("por_mes");
          const request = index.getAll(mes);

          request.onsuccess = () => {
            if (request.result && request.result.length > 0) {
              const registrosMensuales: AsistenciaMensualPersonal[] =
                request.result.map((item) => ({
                  Id_Registro_Mensual: item[idField], // Corregido: usar el valor real del campo ID
                  mes: item.Mes,
                  Dni_Personal: item[idFieldName],
                  registros:
                    modoRegistro === ModoRegistro.Entrada
                      ? item.Entradas
                      : item.Salidas,
                }));

              resolve(registrosMensuales);
            } else {
              resolve([]);
            }
          };

          request.onerror = (event) => {
            reject(
              new Error(
                `Error al obtener registros mensuales: ${
                  (event.target as IDBRequest).error
                }`
              )
            );
          };
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      this.handleError(error, "obtenerTodosRegistrosMensuales", {
        tipoPersonal,
        modoRegistro,
        mes,
      });
      throw error;
    }
  }

  /**
   * Maneja los errores de operaciones con IndexedDB adaptado al patrón actual
   */
  private handleIndexedDBError(error: unknown, operacion: string): void {
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
   * ✅ FUNCIÓN NUEVA: Elimina asistencia del cache de asistencias de hoy
   */
  private async eliminarAsistenciaDelCache(
    dni: string,
    rol: RolesSistema,
    modoRegistro: ModoRegistro,
    fecha: string
  ): Promise<boolean> {
    try {
      const actor = this.obtenerActorDesdeRol(rol);
      const consulta: ConsultaAsistenciaHoy = {
        dni,
        actor,
        modoRegistro,
        tipoAsistencia: TipoAsistencia.ParaPersonal,
        fecha,
      };

      // Verificar si existe en el cache
      const asistenciaCache =
        await this.cacheAsistenciasHoy.consultarAsistencia(consulta);

      if (!asistenciaCache) {
        console.log(
          `🗄️ No se encontró asistencia en cache para ${dni} - ${modoRegistro} - ${fecha}`
        );
        return false;
      }

      // Eliminar del cache usando la clave
      const clave = this.generarClaveCache(actor, modoRegistro, dni, fecha);
      await this.eliminarAsistenciaEspecificaDelCache(clave);

      console.log(`✅ Asistencia eliminada del cache: ${clave}`);
      return true;
    } catch (error) {
      console.error("Error al eliminar asistencia del cache:", error);
      return false;
    }
  }

  /**
   * ✅ FUNCIÓN AUXILIAR: Elimina una asistencia específica del cache por clave
   */
  private async eliminarAsistenciaEspecificaDelCache(
    clave: string
  ): Promise<void> {
    try {
      await IndexedDBConnection.init();
      const store = await IndexedDBConnection.getStore(
        "asistencias_tomadas_hoy",
        "readwrite"
      );

      return new Promise<void>((resolve, reject) => {
        const request = store.delete(clave);

        request.onsuccess = () => {
          console.log(`🗑️ Asistencia eliminada del cache: ${clave}`);
          resolve();
        };

        request.onerror = (event) => {
          reject(
            new Error(
              `Error al eliminar asistencia del cache: ${
                (event.target as IDBRequest).error
              }`
            )
          );
        };
      });
    } catch (error) {
      console.error(
        "Error al eliminar asistencia específica del cache:",
        error
      );
      throw error;
    }
  }

  /**
   * ✅ FUNCIÓN MEJORADA: Elimina asistencia del registro mensual (solo el día específico)
   * 🎯 LÓGICA: Elimina solo el día específico, mantiene el resto del registro mensual
   */
  private async eliminarAsistenciaDelRegistroMensual(
    rol: RolesSistema,
    dni: string,
    modoRegistro: ModoRegistro,
    dia: number,
    mes: number
  ): Promise<boolean> {
    try {
      const tipoPersonal = this.obtenerTipoPersonalDesdeRolOActor(rol);

      // Obtener el registro mensual actual
      const registroMensual = await this.obtenerRegistroMensual(
        tipoPersonal,
        modoRegistro,
        dni,
        mes
      );

      if (!registroMensual) {
        console.log(
          `📱 No se encontró registro mensual para DNI: ${dni}, mes: ${mes}, modo: ${modoRegistro}`
        );
        return false;
      }

      // Verificar si existe el día específico
      const claveDay = dia.toString();
      if (!registroMensual.registros[claveDay]) {
        console.log(
          `📱 No se encontró registro para el día ${dia} en el mes ${mes} (modo: ${modoRegistro})`
        );
        return false;
      }

      // ✅ ELIMINAR SOLO EL DÍA ESPECÍFICO
      delete registroMensual.registros[claveDay];
      console.log(`🗑️ Día ${dia} eliminado del registro mensual`);

      // ✅ DECIDIR si mantener o eliminar todo el registro mensual
      if (Object.keys(registroMensual.registros).length === 0) {
        // Si no quedan más días, eliminar todo el registro mensual
        console.log(`📱 Eliminando registro mensual completo (sin más días)`);
        await this.eliminarRegistroMensual(
          tipoPersonal,
          modoRegistro,
          dni,
          mes
        );
      } else {
        // Si quedan más días, actualizar el registro
        console.log(
          `📱 Actualizando registro mensual (quedan ${
            Object.keys(registroMensual.registros).length
          } días)`
        );
        await this.guardarRegistroMensual(
          tipoPersonal,
          modoRegistro,
          registroMensual
        );
      }

      console.log(
        `✅ Eliminación exitosa del registro mensual: DNI ${dni}, día ${dia}, modo ${modoRegistro}`
      );
      return true;
    } catch (error) {
      console.error(
        "Error al eliminar asistencia del registro mensual:",
        error
      );
      throw error;
    }
  }

  /**
   * ✅ FUNCIÓN MEJORADA: Eliminar asistencia de manera completa
   * 🔄 NUEVA LÓGICA: Elimina de Redis + Cache local + Registro mensual (solo el día específico)
   * 📱 OPTIMIZACIÓN: Maneja todos los posibles lugares donde puede estar guardada la asistencia
   */
  public async eliminarAsistencia({
    dni,
    rol,
    modoRegistro,
    dia,
    mes,
  }: {
    dni: string;
    rol: RolesSistema;
    modoRegistro: ModoRegistro;
    dia?: number;
    mes?: number;
    siasisAPI?: "API01" | "API02";
  }): Promise<{
    exitoso: boolean;
    mensaje: string;
    eliminadoLocal: boolean;
    eliminadoRedis: boolean;
    eliminadoCache: boolean;
  }> {
    try {
      this.setIsSomethingLoading?.(true);
      this.setError?.(null);

      // ✅ USAR FECHA REDUX si no se proporcionan día/mes
      const fechaActualRedux = this.obtenerFechaActualDesdeRedux();
      if (!fechaActualRedux && (!dia || !mes)) {
        throw new Error(
          "No se pudo obtener la fecha desde Redux y no se proporcionaron día/mes"
        );
      }

      const diaActual = dia || fechaActualRedux!.getDate();
      const mesActual = mes || fechaActualRedux!.getMonth() + 1;
      const fechaString =
        fechaActualRedux?.toISOString().split("T")[0] ||
        `${new Date().getFullYear()}-${mesActual
          .toString()
          .padStart(2, "0")}-${diaActual.toString().padStart(2, "0")}`;

      console.log(
        `🗑️ Iniciando eliminación COMPLETA de asistencia para DNI: ${dni}, Rol: ${rol}, Modo: ${modoRegistro}, Día: ${diaActual}, Mes: ${mesActual}`
      );

      let eliminadoLocal = false;
      let eliminadoRedis = false;
      let eliminadoCache = false;

      // ✅ PASO 1: Eliminar de Redis mediante API
      try {
        eliminadoRedis = await this.eliminarAsistenciaRedis(
          dni,
          rol,
          modoRegistro
        );
        console.log(
          `☁️ Eliminación Redis: ${
            eliminadoRedis ? "exitosa" : "no encontrada"
          }`
        );
      } catch (error) {
        console.error("Error al eliminar de Redis:", error);
      }

      // ✅ PASO 2: Eliminar del cache de asistencias de hoy
      try {
        eliminadoCache = await this.eliminarAsistenciaDelCache(
          dni,
          rol,
          modoRegistro,
          fechaString
        );
        console.log(
          `🗄️ Eliminación cache: ${
            eliminadoCache ? "exitosa" : "no encontrada"
          }`
        );
      } catch (error) {
        console.error("Error al eliminar del cache:", error);
      }

      // ✅ PASO 3: Eliminar del registro mensual (solo el día específico)
      try {
        eliminadoLocal = await this.eliminarAsistenciaDelRegistroMensual(
          rol,
          dni,
          modoRegistro,
          diaActual,
          mesActual
        );
        console.log(
          `📱 Eliminación local: ${
            eliminadoLocal ? "exitosa" : "no encontrada"
          }`
        );
      } catch (error) {
        console.error("Error al eliminar de registro mensual:", error);
      }

      // ✅ DETERMINAR resultado general
      const exitoso = eliminadoLocal || eliminadoRedis || eliminadoCache;
      let mensaje = "";

      if (eliminadoRedis && eliminadoCache && eliminadoLocal) {
        mensaje =
          "Asistencia eliminada completamente: Redis + Cache + Registro mensual";
      } else if (eliminadoRedis && eliminadoCache) {
        mensaje =
          "Asistencia eliminada de Redis y Cache (no estaba en registro mensual)";
      } else if (eliminadoRedis && eliminadoLocal) {
        mensaje =
          "Asistencia eliminada de Redis y Registro mensual (no estaba en cache)";
      } else if (eliminadoCache && eliminadoLocal) {
        mensaje =
          "Asistencia eliminada de Cache y Registro mensual (no estaba en Redis)";
      } else if (eliminadoRedis) {
        mensaje = "Asistencia eliminada solo de Redis";
      } else if (eliminadoCache) {
        mensaje = "Asistencia eliminada solo del Cache local";
      } else if (eliminadoLocal) {
        mensaje = "Asistencia eliminada solo del Registro mensual";
      } else {
        mensaje = "No se encontró la asistencia en ningún sistema";
      }

      if (exitoso && this.setSuccessMessage) {
        this.setSuccessMessage({ message: mensaje });
      }

      return {
        exitoso,
        mensaje,
        eliminadoLocal,
        eliminadoRedis,
        eliminadoCache,
      };
    } catch (error) {
      console.error("Error general al eliminar asistencia:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error desconocido al eliminar asistencia";
      this.setError?.({
        success: false,
        message: errorMessage,
      });

      return {
        exitoso: false,
        mensaje: errorMessage,
        eliminadoLocal: false,
        eliminadoRedis: false,
        eliminadoCache: false,
      };
    } finally {
      this.setIsSomethingLoading?.(false);
    }
  }

  /**
   * Función auxiliar para eliminar asistencia de IndexedDB local
   * USA FECHA REDUX para determinar mes y día por defecto
   */
  private async eliminarAsistenciaLocal(
    rol: RolesSistema,
    dni: string,
    modoRegistro: ModoRegistro,
    dia?: number,
    mes?: number
  ): Promise<boolean> {
    try {
      // ✅ USAR FECHA REDUX si no se proporcionan día/mes
      const fechaActualRedux = this.obtenerFechaActualDesdeRedux();
      if (!fechaActualRedux && (!dia || !mes)) {
        console.error(
          "No se pudo obtener la fecha desde Redux y no se proporcionaron día/mes"
        );
        return false;
      }

      const tipoPersonal = this.obtenerTipoPersonalDesdeRolOActor(rol);

      const diaFinal = dia || fechaActualRedux!.getDate();
      const mesFinal = mes || fechaActualRedux!.getMonth() + 1;

      // Obtener el registro mensual actual
      const registroMensual = await this.obtenerRegistroMensual(
        tipoPersonal,
        modoRegistro,
        dni,
        mesFinal
      );

      if (!registroMensual) {
        console.log(
          `📱 No se encontró registro mensual local para DNI: ${dni}, mes: ${mesFinal}`
        );
        return false;
      }

      // Verificar si existe el día específico
      const claveDay = diaFinal.toString();
      if (!registroMensual.registros[claveDay]) {
        console.log(
          `📱 No se encontró registro para el día ${diaFinal} en el mes ${mesFinal}`
        );
        return false;
      }

      // Eliminar el día específico del registro
      delete registroMensual.registros[claveDay];

      // Si no quedan más días, eliminar todo el registro mensual
      if (Object.keys(registroMensual.registros).length === 0) {
        console.log(`📱 Eliminando registro mensual completo (sin más días)`);
        await this.eliminarRegistroMensual(
          tipoPersonal,
          modoRegistro,
          dni,
          mesFinal
        );
      } else {
        // Si quedan más días, actualizar el registro
        console.log(
          `📱 Actualizando registro mensual (quedan ${
            Object.keys(registroMensual.registros).length
          } días)`
        );
        await this.guardarRegistroMensual(
          tipoPersonal,
          modoRegistro,
          registroMensual
        );
      }

      console.log(
        `✅ Eliminación local exitosa: DNI ${dni}, día ${diaFinal}, modo ${modoRegistro}`
      );
      return true;
    } catch (error) {
      console.error("Error al eliminar asistencia local:", error);
      throw error;
    }
  }
  /**
   * ✅ FUNCIÓN AUXILIAR: Eliminar asistencia de Redis mediante API
   */
  private async eliminarAsistenciaRedis(
    dni: string,
    rol: RolesSistema,
    modoRegistro: ModoRegistro
  ): Promise<boolean> {
    try {
      // Mapear RolesSistema a ActoresSistema
      let actor: ActoresSistema;
      switch (rol) {
        case RolesSistema.ProfesorPrimaria:
          actor = ActoresSistema.ProfesorPrimaria;
          break;
        case RolesSistema.ProfesorSecundaria:
        case RolesSistema.Tutor:
          actor = ActoresSistema.ProfesorSecundaria;
          break;
        case RolesSistema.Auxiliar:
          actor = ActoresSistema.Auxiliar;
          break;
        case RolesSistema.PersonalAdministrativo:
          actor = ActoresSistema.PersonalAdministrativo;
          break;
        default:
          throw new Error(`Rol no soportado para eliminación: ${rol}`);
      }

      // Crear el request body para la API de eliminación
      const requestBody: EliminarAsistenciaRequestBody = {
        DNI: dni,
        Actor: actor,
        ModoRegistro: modoRegistro,
        TipoAsistencia: TipoAsistencia.ParaPersonal,
      };

      console.log(`☁️ Enviando solicitud de eliminación a Redis:`, requestBody);

      // Hacer la petición a la API de eliminación
      const response = await fetch("/api/asistencia-hoy/descartar", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`☁️ Asistencia no encontrada en Redis (404)`);
          return false;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Error ${response.status}: ${
            errorData.message || response.statusText
          }`
        );
      }

      const responseData = await response.json();

      if (responseData.success) {
        console.log(`✅ Eliminación Redis exitosa:`, responseData.data);
        return responseData.data.asistenciaEliminada || false;
      } else {
        console.log(`❌ Eliminación Redis falló:`, responseData.message);
        return false;
      }
    } catch (error) {
      console.error("Error al eliminar de Redis:", error);
      throw error;
    }
  }

  /**
   * Verifica si una asistencia existe para hoy
   * USA FECHA REDUX en lugar de fecha local
   */
  public async verificarAsistenciaHoy(
    dni: string,
    rol: RolesSistema,
    modoRegistro: ModoRegistro
  ): Promise<boolean> {
    try {
      // ✅ USAR FECHA REDUX
      const fechaActualRedux = this.obtenerFechaActualDesdeRedux();
      if (!fechaActualRedux) {
        console.error("No se pudo obtener la fecha desde Redux");
        return false;
      }

      const mes = fechaActualRedux.getMonth() + 1;
      const dia = fechaActualRedux.getDate();

      const tipoPersonal = this.obtenerTipoPersonalDesdeRolOActor(rol);

      return await this.verificarSiExisteRegistroDiario(
        tipoPersonal,
        modoRegistro,
        dni,
        mes,
        dia
      );
    } catch (error) {
      console.error("Error al verificar asistencia de hoy:", error);
      return false;
    }
  }

  /**
   * Establece un mensaje de éxito usando el patrón actual
   */
  private handleSuccess(message: string): void {
    const successResponse: MessageProperty = { message };
    this.setSuccessMessage?.(successResponse);
  }
}
