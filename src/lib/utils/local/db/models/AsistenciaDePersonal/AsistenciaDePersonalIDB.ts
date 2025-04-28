/* eslint-disable @typescript-eslint/no-explicit-any */
import { logout } from "@/lib/helpers/logout";
import { LogoutTypes, ErrorDetailsForLogout } from "@/interfaces/LogoutTypes";
import IndexedDBConnection from "../../IndexedDBConnection";
import { ModoRegistro } from "@/interfaces/shared/ModoRegistroPersonal";
import {
  ConsultarAsistenciasDiariasPorActorEnRedisResponseBody,
  RegistroAsistenciaUnitariaPersonal,
} from "../../../../../../interfaces/shared/AsistenciaRequests";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { Meses } from "@/interfaces/shared/Meses";
import { ActoresSistema } from "@/interfaces/shared/ActoresSistema";

export type EstadosAsistenciaDePersonal =
  | "Puntual"
  | "Tardanza"
  | "Temprano"
  | "Tarde"
  | "Falta"
  | "Tardanza Tolerada"
  | "Cumplido"
  | "Salida Anticipada Tolerada"
  | "Salida Anticipada";

// Interfaces para los registros de entrada/salida
export interface RegistroEntradaSalida {
  timestamp: number; // Timestamp Unix en milisegundos
  desfaseSegundos: number;
  estado: EstadosAsistenciaDePersonal;
}

// Interfaces para asistencia mensual
export interface AsistenciaMensualPersonal {
  Id_Registro_Mensual: number;
  mes: Meses;
  Dni_Personal: string; // DNI del personal correspondiente
  registros: Record<string, RegistroEntradaSalida>; // Clave: día del mes (1-31)
}

// Enumeración para los diferentes tipos de personal
export enum TipoPersonal {
  PROFESOR_PRIMARIA = "profesor_primaria",
  PROFESOR_SECUNDARIA = "profesor_secundaria",
  AUXILIAR = "auxiliar",
  PERSONAL_ADMINISTRATIVO = "personal_administrativo",
}

// Interfaces para las llaves compuestas
export interface LlaveAsistenciaMensual {
  Dni_Personal: string;
  mes: Meses;
}

export class AsistenciaDePersonalIDB {
  /**
   * Obtiene el nombre del almacén según el tipo de personal y el modo de registro
   * @param tipoPersonal Tipo de personal (profesor_primaria, profesor_secundaria, etc.)
   * @param modoRegistro Modo de registro (Entrada o Salida)
   * @returns Nombre del almacén correspondiente
   */
  private getStoreName(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro
  ): string {
    // Mapeo de tipos de personal a nombres de store
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
   * @param tipoPersonal Tipo de personal
   * @returns Nombre del campo de identificación
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
   * Maneja los errores según su tipo y realiza logout si es necesario
   * @param error Error capturado
   * @param operacion Descripción de la operación que falló
   * @param detalles Detalles adicionales del error
   */
  private handleError(
    error: unknown,
    operacion: string,
    detalles?: Record<string, any>
  ): void {
    console.error(`Error en AsistenciaDePersonalIDB (${operacion}):`, error);

    // Crear objeto con detalles del error
    const errorDetails: ErrorDetailsForLogout = {
      origen: `AsistenciaDePersonalIDB.${operacion}`,
      mensaje: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
      contexto: JSON.stringify(detalles || {}),
      siasisComponent: "CLN02",
    };

    // Determinar el tipo de error
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

    // Cerrar sesión con los detalles del error
    logout(logoutType, errorDetails);
  }

  /**
   * Obtiene el nombre del índice para la búsqueda por personal (solo DNI)
   * @param tipoPersonal Tipo de personal
   * @returns Nombre del índice
   */
  private getIndexNameForPersonal(tipoPersonal: TipoPersonal): string {
    // Mapeo de tipos de personal a nombres de índice
    const indexMapping = {
      [TipoPersonal.PROFESOR_PRIMARIA]: "por_profesor",
      [TipoPersonal.PROFESOR_SECUNDARIA]: "por_profesor",
      [TipoPersonal.AUXILIAR]: "por_auxiliar",
      [TipoPersonal.PERSONAL_ADMINISTRATIVO]: "por_administrativo",
    };

    return indexMapping[tipoPersonal];
  }

  /**
   * Obtiene el nombre del índice para la búsqueda por personal y mes
   * @param tipoPersonal Tipo de personal
   * @returns Nombre del índice
   */
  private getIndexNameForPersonalMes(tipoPersonal: TipoPersonal): string {
    // Mapeo de tipos de personal a nombres de índice
    const indexMapping = {
      [TipoPersonal.PROFESOR_PRIMARIA]: "por_profesor_mes",
      [TipoPersonal.PROFESOR_SECUNDARIA]: "por_profesor_mes",
      [TipoPersonal.AUXILIAR]: "por_auxiliar_mes",
      [TipoPersonal.PERSONAL_ADMINISTRATIVO]: "por_administrativo_mes",
    };

    return indexMapping[tipoPersonal] || "por_profesor_mes";
  }

  /**
   * Mapea un registro obtenido del store a la interfaz AsistenciaMensualPersonal
   * @param registroStore Registro obtenido del store
   * @param tipoPersonal Tipo de personal
   * @param modoRegistro Modo de registro (Entrada o Salida)
   * @returns Registro mensual en formato AsistenciaMensualPersonal
   */
  private mapearRegistroMensualDesdeStore(
    registroStore: any,
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro
  ): AsistenciaMensualPersonal {
    // Obtener el campo ID según el tipo de personal y modo
    const idField = this.getIdFieldForStore(tipoPersonal, modoRegistro);

    // Obtener el campo de ID personal
    const idPersonalField = this.getIdFieldName(tipoPersonal);

    // Mapear a nuestra interfaz
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
   * Obtiene el nombre del campo ID según el tipo de personal y modo de registro
   * @param tipoPersonal Tipo de personal
   * @param modoRegistro Modo de registro
   * @returns Nombre del campo ID
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
   * Obtiene el registro mensual de asistencia para un personal específico
   * @param tipoPersonal Tipo de personal
   * @param modoRegistro Modo de registro (Entrada o Salida)
   * @param Dni_Personal ID del personal (DNI)
   * @param mes Número de mes (1-12)
   * @param id_registro_mensual ID opcional del registro mensual proporcionado por la API
   * @returns Promesa que resuelve al registro mensual de asistencia o null si no existe
   */
  public async obtenerRegistroMensual(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    Dni_Personal: string,
    mes: number,
    id_registro_mensual?: number
  ): Promise<AsistenciaMensualPersonal | null> {
    try {
      // Inicializar la conexión
      await IndexedDBConnection.init();

      // Obtener el nombre del store correspondiente
      const storeName = this.getStoreName(tipoPersonal, modoRegistro);

      // Obtener el store
      const store = await IndexedDBConnection.getStore(storeName, "readonly");

      // Si tenemos el ID del registro mensual, podemos obtenerlo directamente
      if (id_registro_mensual) {
        return new Promise((resolve, reject) => {
          try {
            // Usar el ID como clave primaria
            const request = store.get(id_registro_mensual);

            request.onsuccess = () => {
              if (request.result) {
                // Transformar el resultado al formato de nuestra interfaz
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

      // Si no tenemos el ID, debemos buscar por índice compuesto (DNI + mes)
      const indexName = this.getIndexNameForPersonalMes(tipoPersonal);

      return new Promise((resolve, reject) => {
        try {
          // Usamos el índice para buscar por la clave compuesta
          const index = store.index(indexName);
          const keyValue = [Dni_Personal, mes];
          const request = index.get(keyValue);

          request.onsuccess = () => {
            if (request.result) {
              // Transformar el resultado al formato de nuestra interfaz
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
   * Guarda un registro mensual de asistencia
   * @param tipoPersonal Tipo de personal
   * @param modoRegistro Modo de registro (Entrada o Salida)
   * @param datos Datos del registro mensual a guardar
   * @returns Promesa que se resuelve cuando se completa la operación
   */
  public async guardarRegistroMensual(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    datos: AsistenciaMensualPersonal
  ): Promise<void> {
    try {
      // Inicializar la conexión
      await IndexedDBConnection.init();

      // Obtener el nombre del store correspondiente
      const storeName = this.getStoreName(tipoPersonal, modoRegistro);

      // Obtener el store
      const store = await IndexedDBConnection.getStore(storeName, "readwrite");

      // Obtener el campo de ID correspondiente
      const idFieldName = this.getIdFieldName(tipoPersonal);
      const idField = this.getIdFieldForStore(tipoPersonal, modoRegistro);

      return new Promise((resolve, reject) => {
        try {
          // Preparar datos en el formato esperado por el store
          const registroToSave: any = {
            [idField]: datos.Id_Registro_Mensual,
            Mes: datos.mes,
            [idFieldName]: datos.Dni_Personal,
          };

          // Agregar los registros de entrada o salida según corresponda
          if (modoRegistro === ModoRegistro.Entrada) {
            registroToSave.Entradas = datos.registros;
          } else {
            registroToSave.Salidas = datos.registros;
          }

          // Guardar el registro
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
   * Obtiene el último registro de asistencia guardado para un personal específico
   * consultando directamente la tabla correspondiente y buscando el registro más reciente
   * @param tipoPersonal Tipo de personal
   * @param modoRegistro Modo de registro (Entrada o Salida)
   * @param Dni_Personal ID del personal (DNI)
   * @returns Promesa que resuelve al último registro o null si no existe
   */
  public async obtenerUltimoRegistro(
    rol: RolesSistema,
    modoRegistro: ModoRegistro,
    Dni_Personal: string
  ): Promise<{
    tipoPersonal: TipoPersonal;
    modoRegistro: ModoRegistro;
    Dni_Personal: string;
    dia: number;
    mes: number;
    Id_Registro_Mensual: number;
    registro: RegistroEntradaSalida;
  } | null> {
    try {
      const tipoPersonal = this.obtenerTipoPersonalDesdeRolOActor(rol);

      // Inicializar la conexión
      await IndexedDBConnection.init();

      // Obtener el nombre del store correspondiente
      const storeName = this.getStoreName(tipoPersonal, modoRegistro);

      // Obtener el store
      const store = await IndexedDBConnection.getStore(storeName, "readonly");

      // Obtener el campo de ID personal
      const idField = this.getIdFieldForStore(tipoPersonal, modoRegistro);

      // Obtener el nombre del índice para buscar por DNI de personal
      const indexName = this.getIndexNameForPersonal(tipoPersonal);

      return new Promise((resolve, reject) => {
        try {
          // Usar el índice para obtener todos los registros del personal
          const index = store.index(indexName);
          const request = index.getAll(Dni_Personal);

          request.onsuccess = () => {
            if (request.result && request.result.length > 0) {
              // Ordenar por mes (de mayor a menor)
              const registrosOrdenados = request.result.sort(
                (a, b) => b.Mes - a.Mes
              );

              // Tomar el registro del mes más reciente
              const registroMasReciente = registrosOrdenados[0];

              // Obtener los datos de entrada o salida según corresponda
              const registrosDias =
                modoRegistro === ModoRegistro.Entrada
                  ? registroMasReciente.Entradas
                  : registroMasReciente.Salidas;

              // Si no hay registros de días, retornar null
              if (!registrosDias || Object.keys(registrosDias).length === 0) {
                resolve(null);
                return;
              }

              // Convertir las claves (días) a números y ordenar de mayor a menor
              const diasOrdenados = Object.keys(registrosDias)
                .map((dia) => parseInt(dia))
                .sort((a, b) => b - a);

              // Tomar el registro del día más reciente
              const diaUltimo = diasOrdenados[0];
              const registroUltimo = registrosDias[diaUltimo.toString()];

              // Construir y retornar el objeto con la información completa
              resolve({
                tipoPersonal,
                modoRegistro,
                Dni_Personal,
                dia: diaUltimo,
                mes: registroMasReciente.Mes,
                Id_Registro_Mensual: registroMasReciente[idField],
                registro: registroUltimo,
              });
            } else {
              // No se encontraron registros
              resolve(null);
            }
          };

          request.onerror = (event) => {
            reject(
              new Error(
                `Error al obtener registros por DNI: ${
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
      this.handleError(error, "obtenerUltimoRegistro", {
        rol,
        modoRegistro,
        Dni_Personal,
      });
      throw error;
    }
  }
  /**
   * Actualiza un registro de asistencia específico para un día
   * @param tipoPersonal Tipo de personal
   * @param modoRegistro Modo de registro (Entrada o Salida)
   * @param Dni_Personal ID del personal (DNI)
   * @param mes Número de mes (1-12)
   * @param dia Día del mes (1-31)
   * @param registro Datos del registro de asistencia
   * @param Id_Registro_Mensual ID del registro mensual proporcionado por la API
   * @param esNuevoRegistro Indica si es un nuevo registro mensual
   * @returns Promesa que se resuelve cuando se completa la operación
   */
  public async actualizarRegistroDiario(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    Dni_Personal: string,
    mes: number,
    dia: number,
    registro: RegistroEntradaSalida,
    Id_Registro_Mensual: number,
    esNuevoRegistro: boolean
  ): Promise<void> {
    try {
      // Obtener el registro mensual actual si no es nuevo registro
      let registroMensual: AsistenciaMensualPersonal | null = null;

      if (!esNuevoRegistro) {
        registroMensual = await this.obtenerRegistroMensual(
          tipoPersonal,
          modoRegistro,
          Dni_Personal,
          mes,
          Id_Registro_Mensual
        );
      }

      // Si no existe o es nuevo registro, crear uno nuevo
      if (!registroMensual || esNuevoRegistro) {
        const nuevoRegistroMensual: AsistenciaMensualPersonal = {
          Id_Registro_Mensual,
          mes,
          Dni_Personal,
          registros: {
            [dia.toString()]: registro,
          },
        };

        await this.guardarRegistroMensual(
          tipoPersonal,
          modoRegistro,
          nuevoRegistroMensual
        );
      } else {
        // Actualizar el registro específico del día
        registroMensual.registros[dia.toString()] = registro;

        // Guardar el registro mensual actualizado
        await this.guardarRegistroMensual(
          tipoPersonal,
          modoRegistro,
          registroMensual
        );
      }
    } catch (error) {
      this.handleError(error, "actualizarRegistroDiario", {
        tipoPersonal,
        modoRegistro,
        Dni_Personal,
        mes,
        dia,
        estado: registro.estado,
        Id_Registro_Mensual,
      });
      throw error;
    }
  }
  /**
   * Obtiene el registro de asistencia para un día específico
   * @param tipoPersonal Tipo de personal
   * @param ModoRegistro Tipo de registro (entrada o salida)
   * @param Dni_Personal ID del personal (DNI)
   * @param mes Número de mes (1-12)
   * @param dia Día del mes (1-31)
   * @returns Promesa que resuelve al registro diario o null si no existe
   */
  public async obtenerRegistroDiario(
    tipoPersonal: TipoPersonal,
    ModoRegistro: ModoRegistro,
    Dni_Personal: string,
    mes: number,
    dia: number
  ): Promise<RegistroEntradaSalida | null> {
    try {
      // Obtener el registro mensual
      const registroMensual = await this.obtenerRegistroMensual(
        tipoPersonal,
        ModoRegistro,
        Dni_Personal,
        mes
      );

      // Si no existe registro mensual o no hay registro para el día, devolver null
      if (!registroMensual || !registroMensual.registros[dia.toString()]) {
        return null;
      }

      // Devolver el registro para el día específico
      return registroMensual.registros[dia.toString()];
    } catch (error) {
      this.handleError(error, "obtenerRegistroDiario", {
        tipoPersonal,
        ModoRegistro,
        Dni_Personal,
        mes,
        dia,
      });
      throw error;
    }
  }

  /**
   * Obtiene todos los registros mensuales para un tipo de personal y un mes específico
   * @param tipoPersonal Tipo de personal
   * @param modoRegistro Tipo de registro (entrada o salida)
   * @param mes Número de mes (1-12)
   * @returns Promesa que resuelve a un arreglo de registros mensuales
   */
  public async obtenerTodosRegistrosMensuales(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    mes: Meses
  ): Promise<AsistenciaMensualPersonal[]> {
    try {
      // Inicializar la conexión
      await IndexedDBConnection.init();

      // Obtener el nombre del store correspondiente
      const storeName = this.getStoreName(tipoPersonal, modoRegistro);

      // Obtener el store
      const store = await IndexedDBConnection.getStore(storeName, "readonly");

      // Obtener el campo de ID correspondiente
      const idFieldName = this.getIdFieldName(tipoPersonal);

      return new Promise((resolve, reject) => {
        try {
          // Usamos el índice para buscar por mes
          const index = store.index("por_mes");
          const request = index.getAll(mes);

          request.onsuccess = () => {
            if (request.result && request.result.length > 0) {
              // Transformar los resultados a nuestro formato de interfaz
              const registrosMensuales: AsistenciaMensualPersonal[] =
                request.result.map(
                  (item) =>
                    ({
                      mes: item.Mes,
                      Dni_Personal: item[idFieldName],
                      registros:
                        modoRegistro === ModoRegistro.Entrada
                          ? item.Entradas
                          : item.Salidas,
                    } as AsistenciaMensualPersonal)
                );

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
        ModoRegistro,
        mes,
      });
      throw error;
    }
  }

  /**
   * Elimina un registro mensual completo
   * @param tipoPersonal Tipo de personal
   * @param ModoRegistro Tipo de registro (entrada o salida)
   * @param Dni_Personal ID del personal (DNI)
   * @param mes Número de mes (1-12)
   * @returns Promesa que se resuelve cuando se completa la operación
   */
  public async eliminarRegistroMensual(
    tipoPersonal: TipoPersonal,
    ModoRegistro: ModoRegistro,
    Dni_Personal: string,
    mes: number
  ): Promise<void> {
    try {
      // Inicializar la conexión
      await IndexedDBConnection.init();

      // Obtener el nombre del store correspondiente
      const storeName = this.getStoreName(tipoPersonal, ModoRegistro);

      // Obtener el store
      const store = await IndexedDBConnection.getStore(storeName, "readwrite");

      // Construir el índice y la clave compuesta
      const indexName =
        tipoPersonal === TipoPersonal.PROFESOR_PRIMARIA ||
        tipoPersonal === TipoPersonal.PROFESOR_SECUNDARIA
          ? "por_profesor_mes"
          : tipoPersonal === TipoPersonal.AUXILIAR
          ? "por_auxiliar_mes"
          : "por_administrativo_mes";

      return new Promise((resolve, reject) => {
        try {
          // Primero obtenemos el registro para conseguir su clave primaria
          const index = store.index(indexName);
          const keyValue = [Dni_Personal, mes];
          const getRequest = index.get(keyValue);

          getRequest.onsuccess = () => {
            if (getRequest.result) {
              // Obtenemos el ID único para eliminar el registro
              const id =
                getRequest.result.Id_C_E_M_P_Profesores_Primaria ||
                getRequest.result.Id_C_E_M_P_Profesores_Secundaria ||
                getRequest.result.Id_C_E_M_P_Auxiliar ||
                getRequest.result.Id_C_E_M_P_Administrativo;

              // Eliminamos el registro usando su clave primaria
              const deleteRequest = store.delete(id);

              deleteRequest.onsuccess = () => {
                resolve();
              };

              deleteRequest.onerror = (event) => {
                reject(
                  new Error(
                    `Error al eliminar registro mensual: ${
                      (event.target as IDBRequest).error
                    }`
                  )
                );
              };
            } else {
              // Si no existe, consideramos que ya está eliminado
              resolve();
            }
          };

          getRequest.onerror = (event) => {
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
      this.handleError(error, "eliminarRegistroMensual", {
        tipoPersonal,
        ModoRegistro,
        Dni_Personal,
        mes,
      });
      throw error;
    }
  }

  /**
   * Elimina un registro de asistencia para un día específico
   * @param tipoPersonal Tipo de personal
   * @param ModoRegistro Tipo de registro (entrada o salida)
   * @param Dni_Personal ID del personal (DNI)
   * @param mes Número de mes (1-12)
   * @param dia Día del mes (1-31)
   * @returns Promesa que se resuelve cuando se completa la operación
   */
  public async eliminarRegistroDiario(
    tipoPersonal: TipoPersonal,
    ModoRegistro: ModoRegistro,
    Dni_Personal: string,
    mes: number,
    dia: number
  ): Promise<void> {
    try {
      // Obtener el registro mensual actual
      const registroMensual = await this.obtenerRegistroMensual(
        tipoPersonal,
        ModoRegistro,
        Dni_Personal,
        mes
      );

      // Si no existe, no hay nada que eliminar
      if (!registroMensual || !registroMensual.registros[dia.toString()]) {
        return;
      }

      // Eliminar el registro específico del día
      delete registroMensual.registros[dia.toString()];

      // Guardar el registro mensual actualizado
      await this.guardarRegistroMensual(
        tipoPersonal,
        ModoRegistro,
        registroMensual
      );
    } catch (error) {
      this.handleError(error, "eliminarRegistroDiario", {
        tipoPersonal,
        ModoRegistro,
        Dni_Personal,
        mes,
        dia,
      });
      throw error;
    }
  }

  /**
   * Sincroniza los registros mensuales desde el servidor
   * @param tipoPersonal Tipo de personal
   * @param modoRegistro Tipo de registro (entrada o salida)
   * @param datos Array de registros mensuales para sincronizar
   * @returns Promesa que se resuelve cuando se completa la operación
   */
  public async sincronizarRegistrosMensuales(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    datos: AsistenciaMensualPersonal[]
  ): Promise<void> {
    try {
      // Inicializar la conexión
      await IndexedDBConnection.init();

      // Obtener el nombre del store correspondiente
      const storeName = this.getStoreName(tipoPersonal, modoRegistro);

      // Obtener el store
      const store = await IndexedDBConnection.getStore(storeName, "readwrite");

      // Obtener el campo de ID correspondiente
      const idFieldName = this.getIdFieldName(tipoPersonal);

      // Procesamos todos los registros en una única transacción
      const transaction = store.transaction;

      return new Promise((resolve, reject) => {
        try {
          if (datos.length === 0) {
            resolve();
            return;
          }

          // Usamos transaction.oncomplete para asegurarnos de que todas las operaciones se completen
          transaction.oncomplete = () => {
            resolve();
          };

          transaction.onerror = (event) => {
            reject(
              new Error(
                `Error en transacción de sincronización: ${
                  (event.target as IDBTransaction).error
                }`
              )
            );
          };

          // Procesamos cada registro
          datos.forEach((item) => {
            try {
              // Preparar datos en el formato esperado por el store
              const registroToSave: any = {
                Mes: item.mes,
                [idFieldName]: item.Dni_Personal,
              };

              // Agregar los registros de entrada o salida según corresponda
              if (modoRegistro === ModoRegistro.Entrada) {
                registroToSave.Entradas = item.registros;
              } else {
                registroToSave.Salidas = item.registros;
              }

              // Añadir o actualizar el registro
              store.put(registroToSave);
            } catch (innerError) {
              console.error(
                "Error al procesar registro para sincronización:",
                innerError
              );
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      this.handleError(error, "sincronizarRegistrosMensuales", {
        tipoPersonal,
        ModoRegistro,
        cantidadDatos: datos?.length || 0,
      });
      throw error;
    }
  }

  /**
   * Convierte un rol del sistema al tipo de personal correspondiente
   * @param rol Rol del sistema
   * @returns Tipo de personal correspondiente
   * @throws Error si el rol no es compatible con los tipos de personal soportados
   */
  private obtenerTipoPersonalDesdeRolOActor(
    rol: RolesSistema | ActoresSistema
  ): TipoPersonal {
    // Usar switch para mayor claridad y control
    switch (rol) {
      case RolesSistema.ProfesorPrimaria:
        return TipoPersonal.PROFESOR_PRIMARIA;

      case RolesSistema.ProfesorSecundaria:
      case RolesSistema.Tutor:
        return TipoPersonal.PROFESOR_SECUNDARIA; // El tutor es un profesor de secundaria

      case RolesSistema.Auxiliar:
        return TipoPersonal.AUXILIAR;

      case RolesSistema.PersonalAdministrativo:
        return TipoPersonal.PERSONAL_ADMINISTRATIVO;

      case RolesSistema.Directivo:
        throw new Error(
          `El rol de Directivo (D) no está soportado para el registro de asistencia de personal`
        );

      case RolesSistema.Responsable:
        throw new Error(
          `El rol de Responsable (R) no está soportado para el registro de asistencia de personal`
        );

      default:
        throw new Error(`Rol no válido o no soportado: ${rol}`);
    }
  }

  /**
   * Determina el estado de asistencia basado en el desfase de tiempo
   * @param desfaseSegundos Desfase en segundos (positivo = tardanza, negativo = anticipado)
   * @param modoRegistro Modo de registro (Entrada o Salida)
   * @returns Estado de asistencia ("Puntual", "Tardanza", "Temprano", etc.)
   */
  private determinarEstadoAsistencia(
    desfaseSegundos: number,
    modoRegistro: ModoRegistro
  ): EstadosAsistenciaDePersonal {
    // Constantes de tiempo en segundos
    const TOLERANCIA_TARDANZA = 5 * 60; // 5 minutos de tolerancia para tardanza
    const TOLERANCIA_TEMPRANO = 15 * 60; // 15 minutos de tolerancia para salida anticipada

    // Para registro de entrada
    if (modoRegistro === ModoRegistro.Entrada) {
      if (desfaseSegundos <= 0) {
        return "Puntual";
      } else if (desfaseSegundos <= TOLERANCIA_TARDANZA) {
        return "Tardanza Tolerada";
      } else {
        return "Tardanza";
      }
    }
    // Para registro de salida
    else {
      if (desfaseSegundos >= 0) {
        return "Cumplido";
      } else if (desfaseSegundos >= -TOLERANCIA_TEMPRANO) {
        return "Salida Anticipada Tolerada";
      } else {
        return "Salida Anticipada";
      }
    }
  }

  /**
   * Marca la asistencia de entrada o salida para un personal específico
   * usando el índice compuesto de rol, dni, mes y modo de registro
   * @param datos Datos del registro de asistencia
   * @returns Promesa que se resuelve cuando se completa la operación
   */
  public async marcarAsistencia({
    datos,
  }: {
    datos: RegistroAsistenciaUnitariaPersonal;
  }): Promise<void> {
    try {
      // Extraer los datos del objeto
      const {
        ModoRegistro: modoRegistro,
        DNI: dni,
        Rol: rol,
        Dia: dia,
        Detalles,
      } = datos;

      // Determinar el tipo de personal según el rol
      const tipoPersonal = this.obtenerTipoPersonalDesdeRolOActor(rol);

      // Obtener fecha actual para el mes
      const fecha = new Date(Detalles!.Timestamp);
      const mes = fecha.getMonth() + 1; // getMonth() devuelve 0-11

      // Determinar el estado basado en el desfase
      const estado = this.determinarEstadoAsistencia(
        Detalles!.DesfaseSegundos,
        modoRegistro
      );

      // Crear registro de asistencia
      const registro: RegistroEntradaSalida = {
        timestamp: Detalles!.Timestamp,
        estado: estado,
        desfaseSegundos: Detalles!.DesfaseSegundos,
      };


        // Si no tenemos ID, intentamos obtenerlo del almacén
        const idRegistroMensual = await this.obtenerIdRegistroMensual(
          tipoPersonal,
          modoRegistro,
          dni,
          mes
        );

        if (idRegistroMensual) {
          // Si encontramos un ID existente, lo usamos
          await this.actualizarRegistroDiario(
            tipoPersonal,
            modoRegistro,
            dni,
            mes,
            dia,
            registro,
            idRegistroMensual,
            false // No es nuevo registro
          );
        } else {
          // Si no hay ID existente, que podemos hacer?


        }
      

      // Registrar en la consola
      console.log(
        `Asistencia marcada: ${rol} ${dni} - ${modoRegistro} - ${estado}`
      );
    } catch (error) {
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
   * Obtiene los días hábiles del mes (lunes a viernes)
   * @param mes Número de mes (1-12)
   * @param anio Año (por defecto, el año actual)
   * @returns Array con los días hábiles del mes
   */
  private obtenerDiasHabilesMes(
    mes: number,
    anio: number = new Date().getFullYear()
  ): number[] {
    const diasHabiles: number[] = [];
    const totalDiasEnMes = new Date(anio, mes, 0).getDate();

    for (let dia = 1; dia <= totalDiasEnMes; dia++) {
      const fecha = new Date(anio, mes - 1, dia);
      const diaSemana = fecha.getDay(); // 0: domingo, 1: lunes, ..., 6: sábado

      // Consideramos días hábiles de lunes a viernes (1-5)
      if (diaSemana >= 1 && diaSemana <= 5) {
        diasHabiles.push(dia);
      }
    }

    return diasHabiles;
  }

  /**
   * Obtiene estadísticas de asistencia para un personal en un mes específico
   * @param tipoPersonal Tipo de personal
   * @param Dni_Personal ID del personal (DNI)
   * @param mes Número de mes (1-12)
   * @returns Promesa que resuelve a las estadísticas de asistencia
   */
  public async obtenerEstadisticasMensuales(
    tipoPersonal: TipoPersonal,
    Dni_Personal: string,
    mes: number
  ): Promise<{
    totalDias: number;
    asistenciasPuntuales: number;
    tardanzas: number;
    faltas: number;
    porcentajeAsistencia: number;
  }> {
    try {
      // Obtener registros de entrada y salida
      const registroEntrada = await this.obtenerRegistroMensual(
        tipoPersonal,
        ModoRegistro.Entrada,
        Dni_Personal,
        mes
      );

      const registroSalida = await this.obtenerRegistroMensual(
        tipoPersonal,
        ModoRegistro.Salida,
        Dni_Personal,
        mes
      );

      // Inicializar contadores
      let totalDias = 0;
      let asistenciasPuntuales = 0;
      let tardanzas = 0;
      let faltas = 0;

      // Obtener días hábiles del mes (simplificado, podría mejorarse con un calendario real)
      const diasHabilesMes = this.obtenerDiasHabilesMes(mes);
      totalDias = diasHabilesMes.length;

      // Si no hay registros, devolver estadísticas con ceros
      if (!registroEntrada && !registroSalida) {
        return {
          totalDias,
          asistenciasPuntuales: 0,
          tardanzas: 0,
          faltas: totalDias,
          porcentajeAsistencia: 0,
        };
      }

      // Procesar registros de entrada
      if (registroEntrada) {
        diasHabilesMes.forEach((dia) => {
          const registro = registroEntrada.registros[dia.toString()];
          if (registro) {
            if (registro.estado === "Puntual") {
              asistenciasPuntuales++;
            } else if (registro.estado === "Tardanza") {
              tardanzas++;
            } else if (registro.estado === "Falta") {
              faltas++;
            }
          } else {
            faltas++;
          }
        });
      } else {
        faltas = totalDias;
      }

      // Calcular porcentaje de asistencia
      const porcentajeAsistencia =
        totalDias > 0
          ? ((asistenciasPuntuales + tardanzas) / totalDias) * 100
          : 0;

      return {
        totalDias,
        asistenciasPuntuales,
        tardanzas,
        faltas,
        porcentajeAsistencia,
      };
    } catch (error) {
      this.handleError(error, "obtenerEstadisticasMensuales", {
        tipoPersonal,
        Dni_Personal,
        mes,
      });
      throw error;
    }
  }

  /**
   * Verifica si un personal ha marcado asistencia de entrada hoy
   * @param tipoPersonal Tipo de personal
   * @param Dni_Personal ID del personal (DNI)
   * @returns Promesa que resuelve a true si ha marcado entrada hoy
   */
  public async hasMarcadoEntradaHoy(
    rol: RolesSistema,
    Dni_Personal: string
  ): Promise<boolean> {
    try {
      // Obtener fecha actual
      const fecha = new Date();
      const mes = fecha.getMonth() + 1; // getMonth() devuelve 0-11
      const dia = fecha.getDate();

      const tipoPersonal = this.obtenerTipoPersonalDesdeRolOActor(rol);

      // Obtener registro de entrada de hoy
      const registro = await this.obtenerRegistroDiario(
        tipoPersonal,
        ModoRegistro.Entrada,
        Dni_Personal,
        mes,
        dia
      );

      return registro !== null;
    } catch (error) {
      this.handleError(error, "hasMarcadoEntradaHoy", {
        rol,
        Dni_Personal,
      });
      throw error;
    }
  }

  /**
   * Verifica si un personal ha marcado asistencia de salida hoy
   * @param tipoPersonal Tipo de personal
   * @param Dni_Personal ID del personal (DNI)
   * @returns Promesa que resuelve a true si ha marcado salida hoy
   */
  public async hasMarcadoSalidaHoy(
    tipoPersonal: TipoPersonal,
    Dni_Personal: string
  ): Promise<boolean> {
    try {
      // Obtener fecha actual
      const fecha = new Date();
      const mes = fecha.getMonth() + 1; // getMonth() devuelve 0-11
      const dia = fecha.getDate();

      // Obtener registro de salida de hoy
      const registro = await this.obtenerRegistroDiario(
        tipoPersonal,
        ModoRegistro.Salida,
        Dni_Personal,
        mes,
        dia
      );

      return registro !== null;
    } catch (error) {
      this.handleError(error, "hasMarcadoSalidaHoy", {
        tipoPersonal,
        Dni_Personal,
      });
      throw error;
    }
  }

  /**
   * Verifica si un personal ha marcado asistencia (entrada o salida) hoy
   * @param modoRegistro Tipo de registro (entrada o salida)
   * @param rol Rol del sistema del personal
   * @param dni ID del personal (DNI)
   * @returns Promesa que resuelve a un objeto con información del registro o null si no ha marcado
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
      // Intentar obtener primero desde el almacenamiento de registros actuales (más rápido)
      const ultimoRegistro = await this.obtenerUltimoRegistro(
        rol,
        modoRegistro,
        dni
      );

      // Obtener el tipo de personal según el rol
      const tipoPersonal = this.obtenerTipoPersonalDesdeRolOActor(rol);

      // Si existe un registro para hoy en el almacenamiento rápido
      if (ultimoRegistro) {
        const fechaRegistro = new Date(ultimoRegistro.registro.timestamp);
        const fechaHoy = new Date();

        // Verificar si el registro es de hoy
        if (
          fechaRegistro.getDate() === fechaHoy.getDate() &&
          fechaRegistro.getMonth() === fechaHoy.getMonth() &&
          fechaRegistro.getFullYear() === fechaHoy.getFullYear()
        ) {
          return {
            marcado: true,
            timestamp: ultimoRegistro.registro.timestamp,
            desfaseSegundos: ultimoRegistro.registro.desfaseSegundos,
            estado: ultimoRegistro.registro.estado,
          };
        }
      }

      // Si no hay registro en el almacenamiento rápido, buscar en el almacenamiento normal
      const fecha = new Date();
      const mes = fecha.getMonth() + 1; // getMonth() devuelve 0-11
      const dia = fecha.getDate();

      // Obtener registro del día actual
      const registro = await this.obtenerRegistroDiario(
        tipoPersonal,
        modoRegistro,
        dni,
        mes,
        dia
      );

      if (registro) {
        return {
          marcado: true,
          timestamp: registro.timestamp,
          desfaseSegundos: registro.desfaseSegundos,
          estado: registro.estado,
        };
      }

      // Si no se encontró registro, devolver que no ha marcado
      return { marcado: false };
    } catch (error) {
      console.error("Error al verificar si ha marcado hoy:", error);
      // No hacemos logout aquí para evitar interrumpir la experiencia del usuario
      // Simplemente devolvemos que no ha marcado
      return { marcado: false };
    }
  }

  /**
   * Obtiene todas las entradas registradas por un personal en un rango de fechas
   * @param tipoPersonal Tipo de personal
   * @param Dni_Personal ID del personal (DNI)
   * @param fechaInicio Fecha de inicio del rango (timestamp)
   * @param fechaFin Fecha fin del rango (timestamp)
   * @returns Promesa que resuelve a un objeto con las entradas agrupadas por mes
   */
  public async obtenerRegistrosEnRango(
    tipoPersonal: TipoPersonal,
    ModoRegistro: ModoRegistro,
    Dni_Personal: string,
    fechaInicio: number,
    fechaFin: number
  ): Promise<Record<string, Record<string, RegistroEntradaSalida>>> {
    try {
      // Convertir timestamps a objetos Date
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);

      // Obtener mes y año de inicio y fin
      const mesInicio = inicio.getMonth() + 1;
      const anioInicio = inicio.getFullYear();
      const mesFin = fin.getMonth() + 1;
      const anioFin = fin.getFullYear();

      // Resultado final: {mes_año: {dia: registro}}
      const resultado: Record<
        string,
        Record<string, RegistroEntradaSalida>
      > = {};

      // Iteramos por cada mes en el rango
      let currentAnio = anioInicio;
      let currentMes = mesInicio;

      while (
        currentAnio < anioFin ||
        (currentAnio === anioFin && currentMes <= mesFin)
      ) {
        // Obtener registros del mes actual
        const registroMensual = await this.obtenerRegistroMensual(
          tipoPersonal,
          ModoRegistro,
          Dni_Personal,
          currentMes
        );

        if (registroMensual) {
          // Clave para el mes actual (formato "MM-YYYY")
          const clavesMes = `${currentMes
            .toString()
            .padStart(2, "0")}-${currentAnio}`;
          resultado[clavesMes] = {};

          // Filtrar registros solo para los días dentro del rango
          Object.entries(registroMensual.registros).forEach(
            ([dia, registro]) => {
              const diaNum = parseInt(dia);
              const fechaRegistro = new Date(
                currentAnio,
                currentMes - 1,
                diaNum
              );

              // Verificar si la fecha está dentro del rango
              if (fechaRegistro >= inicio && fechaRegistro <= fin) {
                resultado[clavesMes][dia] = registro;
              }
            }
          );
        }

        // Avanzar al siguiente mes
        if (currentMes === 12) {
          currentMes = 1;
          currentAnio++;
        } else {
          currentMes++;
        }
      }

      return resultado;
    } catch (error) {
      this.handleError(error, "obtenerRegistrosEnRango", {
        tipoPersonal,
        ModoRegistro,
        Dni_Personal,
        fechaInicio,
        fechaFin,
      });
      throw error;
    }
  }

  /**
   * Verifica si ya existe un registro diario para un personal específico
   * @param tipoPersonal Tipo de personal
   * @param modoRegistro Modo de registro (Entrada o Salida)
   * @param dni ID del personal (DNI)
   * @param mes Número de mes (1-12)
   * @param dia Día del mes (1-31)
   * @returns Promesa que resuelve a true si existe, false si no existe
   */
  private async verificarSiExisteRegistroDiario(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    dni: string,
    mes: number,
    dia: number
  ): Promise<boolean> {
    try {
      // Inicializar la conexión
      await IndexedDBConnection.init();

      // Obtener el nombre del store correspondiente
      const storeName = this.getStoreName(tipoPersonal, modoRegistro);

      // Obtener el store
      const store = await IndexedDBConnection.getStore(storeName, "readonly");

      // Obtener el nombre del índice para buscar por DNI de personal
      const indexName = this.getIndexNameForPersonal(tipoPersonal);

      return new Promise((resolve, reject) => {
        try {
          // Usar el índice para obtener todos los registros del personal
          const index = store.index(indexName);
          const request = index.getAll(dni);

          request.onsuccess = () => {
            if (request.result && request.result.length > 0) {
              // Buscar en los registros si existe alguno para el mes y día específicos
              for (const registro of request.result) {
                // Verificar si el mes coincide
                if (registro.Mes === mes) {
                  // Obtener los registros de entrada o salida según corresponda
                  const registrosDias =
                    modoRegistro === ModoRegistro.Entrada
                      ? registro.Entradas
                      : registro.Salidas;

                  // Verificar si hay un registro para el día específico
                  if (registrosDias && registrosDias[dia.toString()]) {
                    resolve(true);
                    return;
                  }
                }
              }
            }

            // Si no se encontró ningún registro para el mes y día específicos
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
      // En caso de error, asumimos que no existe para volver a intentar guardar
      return false;
    }
  }

  /**
   * Obtiene el ID del registro mensual para un personal específico si existe
   * @param tipoPersonal Tipo de personal
   * @param modoRegistro Modo de registro (Entrada o Salida)
   * @param dni ID del personal (DNI)
   * @param mes Número de mes (1-12)
   * @returns Promesa que resuelve al ID del registro mensual o null si no existe
   */
  private async obtenerIdRegistroMensual(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    dni: string,
    mes: number
  ): Promise<number | null> {
    try {
      // Inicializar la conexión
      await IndexedDBConnection.init();

      // Obtener el nombre del store correspondiente
      const storeName = this.getStoreName(tipoPersonal, modoRegistro);

      // Obtener el store
      const store = await IndexedDBConnection.getStore(storeName, "readonly");

      // Obtener el nombre del índice para buscar por DNI y mes
      const indexName = this.getIndexNameForPersonalMes(tipoPersonal);

      // Obtener el ID field correspondiente
      const idField = this.getIdFieldForStore(tipoPersonal, modoRegistro);

      return new Promise((resolve, reject) => {
        try {
          // Usamos el índice para buscar por la clave compuesta (DNI, mes)
          const index = store.index(indexName);
          const keyValue = [dni, mes];
          const request = index.get(keyValue);

          request.onsuccess = () => {
            if (request.result) {
              // Obtener el ID del registro mensual
              resolve(request.result[idField]);
            } else {
              // No existe registro mensual
              resolve(null);
            }
          };

          request.onerror = (event) => {
            reject(
              new Error(
                `Error al obtener ID del registro mensual: ${
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
      console.error("Error al obtener ID del registro mensual:", error);
      return null;
    }
  }

  /**
   * Sincroniza las asistencias registradas en Redis con la base de datos local IndexedDB
   * @param datosRedis Datos de asistencia obtenidos desde Redis
   * @returns Promesa que resuelve a un objeto con estadísticas de sincronización
   */
  public async sincronizarAsistenciasDesdeRedis(
    datosRedis: ConsultarAsistenciasDiariasPorActorEnRedisResponseBody
  ): Promise<{
    totalRegistros: number;
    registrosNuevos: number;
    registrosExistentes: number;
    errores: number;
  }> {
    // Estadísticas de sincronización
    const stats = {
      totalRegistros: datosRedis.Resultados.length,
      registrosNuevos: 0,
      registrosExistentes: 0,
      errores: 0,
    };

    try {
      // Obtener el tipo de personal según el Actor
      const tipoPersonal = this.obtenerTipoPersonalDesdeRolOActor(
        datosRedis.Actor
      );

      // Usar el mes que viene directamente de Redis
      const mesActual = datosRedis.Mes;
      const diaActual = datosRedis.Dia;

      if (diaActual === 0) {
        console.error(
          "No se pudo determinar el día desde los resultados de Redis"
        );
        return {
          ...stats,
          errores: stats.totalRegistros, // Todos fallaron
        };
      }

      // Procesar cada resultado de Redis
      for (const resultado of datosRedis.Resultados) {
        try {
          // Verificar si el registro ya existe localmente
          const registroExistente = await this.verificarSiExisteRegistroDiario(
            tipoPersonal,
            datosRedis.ModoRegistro,
            resultado.DNI,
            mesActual,
            diaActual
          );

          if (registroExistente) {
            // El registro ya existe, no es necesario guardarlo nuevamente
            stats.registrosExistentes++;
            continue;
          }

          // Crear un registro compatible con nuestra interfaz local
          const registro: RegistroAsistenciaUnitariaPersonal = {
            ModoRegistro: datosRedis.ModoRegistro,
            DNI: resultado.DNI,
            Rol: datosRedis.Actor,
            Dia: diaActual,
            Detalles: resultado.Detalles && {
              Timestamp: resultado.Detalles.Timestamp,
              DesfaseSegundos: resultado.Detalles.DesfaseSegundos,
            },
            esNuevoRegistro: true,
          };

          // Guardar el registro en la base de datos local
          await this.marcarAsistencia({
            datos: registro,
          });

          // Incrementar contador de registros nuevos
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
        totalRegistros: datosRedis.Resultados.length,
      });

      // Devolver estadísticas con errores
      return {
        ...stats,
        errores: stats.totalRegistros, // Todos fallaron
      };
    }
  }

  /**
   * Obtiene los días con mayor índice de tardanzas en un mes
   * @param tipoPersonal Tipo de personal
   * @param mes Número de mes (1-12)
   * @returns Promesa que resuelve a un mapa de días con su cantidad de tardanzas
   */
  public async obtenerDiasConMasTardanzas(
    tipoPersonal: TipoPersonal,
    mes: number
  ): Promise<Map<number, number>> {
    try {
      // Obtener todos los registros de entrada del mes
      const registros = await this.obtenerTodosRegistrosMensuales(
        tipoPersonal,
        ModoRegistro.Entrada,
        mes
      );

      // Inicializar mapa de días con tardanzas
      const diasTardanzas = new Map<number, number>();

      // Procesar todos los registros
      registros.forEach((registro) => {
        Object.entries(registro.registros).forEach(([dia, datos]) => {
          const diaNum = parseInt(dia);

          if (datos.estado === "Tardanza") {
            const tardanzasActuales = diasTardanzas.get(diaNum) || 0;
            diasTardanzas.set(diaNum, tardanzasActuales + 1);
          }
        });
      });

      // Ordenar el mapa por cantidad de tardanzas (mayor a menor)
      return new Map([...diasTardanzas.entries()].sort((a, b) => b[1] - a[1]));
    } catch (error) {
      this.handleError(error, "obtenerDiasConMasTardanzas", {
        tipoPersonal,
        mes,
      });
      throw error;
    }
  }

  /**
   * Realiza una copia de seguridad de todos los registros de asistencia de un tipo de personal
   * @param tipoPersonal Tipo de personal
   * @returns Promesa que resuelve a un objeto con todos los registros
   */
  public async realizarBackup(tipoPersonal: TipoPersonal): Promise<{
    entradas: any[];
    salidas: any[];
  }> {
    try {
      // Inicializar la conexión
      await IndexedDBConnection.init();

      // Obtener los stores correspondientes
      const storeNameEntradas = this.getStoreName(
        tipoPersonal,
        ModoRegistro.Entrada
      );
      const storeNameSalidas = this.getStoreName(
        tipoPersonal,
        ModoRegistro.Salida
      );

      // Obtener todos los registros
      const storeEntradas = await IndexedDBConnection.getStore(
        storeNameEntradas,
        "readonly"
      );
      const storeSalidas = await IndexedDBConnection.getStore(
        storeNameSalidas,
        "readonly"
      );

      // Función para obtener todos los registros de un store
      const obtenerTodos = (store: IDBObjectStore): Promise<any[]> => {
        return new Promise((resolve, reject) => {
          const request = store.getAll();

          request.onsuccess = () => {
            resolve(request.result || []);
          };

          request.onerror = (event) => {
            reject(
              new Error(
                `Error al obtener registros para backup: ${
                  (event.target as IDBRequest).error
                }`
              )
            );
          };
        });
      };

      // Obtener todos los registros
      const [entradas, salidas] = await Promise.all([
        obtenerTodos(storeEntradas),
        obtenerTodos(storeSalidas),
      ]);

      return { entradas, salidas };
    } catch (error) {
      this.handleError(error, "realizarBackup", { tipoPersonal });
      throw error;
    }
  }

  /**
   * Restaura registros de asistencia desde una copia de seguridad
   * @param tipoPersonal Tipo de personal
   * @param backup Objeto con los registros de backup
   * @returns Promesa que se resuelve cuando se completa la operación
   */
  public async restaurarBackup(
    tipoPersonal: TipoPersonal,
    backup: {
      entradas: any[];
      salidas: any[];
    }
  ): Promise<void> {
    try {
      // Inicializar la conexión
      await IndexedDBConnection.init();

      // Obtener los stores correspondientes
      const storeNameEntradas = this.getStoreName(
        tipoPersonal,
        ModoRegistro.Entrada
      );
      const storeNameSalidas = this.getStoreName(
        tipoPersonal,
        ModoRegistro.Salida
      );

      // Obtener los stores en modo escritura
      const storeEntradas = await IndexedDBConnection.getStore(
        storeNameEntradas,
        "readwrite"
      );
      const storeSalidas = await IndexedDBConnection.getStore(
        storeNameSalidas,
        "readwrite"
      );

      // Función para limpiar un store y restaurar datos
      const limpiarYRestaurar = (
        store: IDBObjectStore,
        datos: any[]
      ): Promise<void> => {
        return new Promise((resolve, reject) => {
          // Primero limpiar el store
          const clearRequest = store.clear();

          clearRequest.onsuccess = () => {
            try {
              // Luego restaurar los datos
              const transaction = store.transaction;

              transaction.oncomplete = () => {
                resolve();
              };

              transaction.onerror = (event) => {
                reject(
                  new Error(
                    `Error en transacción de restauración: ${
                      (event.target as IDBTransaction).error
                    }`
                  )
                );
              };

              // Restaurar cada registro
              datos.forEach((item) => {
                store.add(item);
              });
            } catch (innerError) {
              reject(innerError);
            }
          };

          clearRequest.onerror = (event) => {
            reject(
              new Error(
                `Error al limpiar store para restauración: ${
                  (event.target as IDBRequest).error
                }`
              )
            );
          };
        });
      };

      // Restaurar entradas y salidas
      await Promise.all([
        limpiarYRestaurar(storeEntradas, backup.entradas),
        limpiarYRestaurar(storeSalidas, backup.salidas),
      ]);
    } catch (error) {
      this.handleError(error, "restaurarBackup", {
        tipoPersonal,
        cantidadEntradasBackup: backup?.entradas?.length || 0,
        cantidadSalidasBackup: backup?.salidas?.length || 0,
      });
      throw error;
    }
  }
}
