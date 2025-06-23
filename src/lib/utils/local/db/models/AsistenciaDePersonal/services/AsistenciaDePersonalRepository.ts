/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  AsistenciaMensualPersonalLocal,
  TipoPersonal,
  ModoRegistro,
  RegistroEntradaSalida,
  OperationResult,
  ValidacionResult,
} from "../AsistenciaDePersonalTypes";
import { Meses } from "@/interfaces/shared/Meses";
import IndexedDBConnection from "../../../IndexedDBConnection";
import { AsistenciaDePersonalMapper } from "./AsistenciaDePersonalMapper";
import { AsistenciaDePersonalDateHelper } from "./AsistenciaDePersonalDateHelper";

/**
 * 🎯 RESPONSABILIDAD: Operaciones CRUD con IndexedDB
 * - Guardar registros mensuales
 * - Obtener registros mensuales
 * - Eliminar registros
 * - Verificar existencia
 * - Operaciones de consulta y filtrado
 *
 * ✅ ACTUALIZADO: Soporta tanto IDs (directivos) como DNIs (otros roles)
 * ✅ NUEVO: Timestamp automático en todos los registros guardados/actualizados
 */
export class AsistenciaDePersonalRepository {
  private mapper: AsistenciaDePersonalMapper;
  private dateHelper: AsistenciaDePersonalDateHelper;

  constructor(
    mapper: AsistenciaDePersonalMapper,
    dateHelper: AsistenciaDePersonalDateHelper
  ) {
    this.mapper = mapper;
    this.dateHelper = dateHelper;
  }

  /**
   * Guarda un registro mensual de asistencia usando el ID real de la API
   * ✅ ACTUALIZADO: Soporta ID_o_DNI_Personal
   * ✅ NUEVO: Siempre incluye timestamp peruano actual
   */
  public async guardarRegistroMensual(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    datos: AsistenciaMensualPersonalLocal
  ): Promise<OperationResult> {
    try {
      await IndexedDBConnection.init();
      const storeName = this.mapper.getStoreName(tipoPersonal, modoRegistro);
      const store = await IndexedDBConnection.getStore(storeName, "readwrite");
      const idFieldName = this.mapper.getIdFieldName(tipoPersonal);
      const idField = this.mapper.getIdFieldForStore(
        tipoPersonal,
        modoRegistro
      );

      // ✅ NUEVO: Obtener timestamp peruano actual SIEMPRE
      const timestampPeruanoActual = this.dateHelper.obtenerTimestampPeruano();

      console.log(
        `💾 Guardando registro con timestamp peruano: ${timestampPeruanoActual} (${new Date(
          timestampPeruanoActual
        ).toLocaleString("es-PE")})`
      );

      return new Promise((resolve, reject) => {
        try {
          const registroToSave: any = {
            [idField]: datos.Id_Registro_Mensual,
            Mes: datos.mes,
            [idFieldName]: this.convertirIdentificadorParaDB(
              tipoPersonal,
              datos.ID_o_DNI_Personal
            ),
            // ✅ NUEVO: SIEMPRE incluir timestamp peruano actual
            ultima_fecha_actualizacion: timestampPeruanoActual,
          };

          if (modoRegistro === ModoRegistro.Entrada) {
            registroToSave.Entradas = datos.registros;
          } else {
            registroToSave.Salidas = datos.registros;
          }

          console.log(`💾 Objeto a guardar en ${storeName}:`, {
            ...registroToSave,
            // Solo mostrar resumen de registros para no saturar el log
            [modoRegistro === ModoRegistro.Entrada
              ? "Entradas"
              : "Salidas"]: `${
              Object.keys(datos.registros).length
            } días registrados`,
          });

          const putRequest = store.put(registroToSave);

          putRequest.onsuccess = () => {
            console.log(
              `✅ Registro mensual guardado exitosamente en ${storeName} con timestamp ${timestampPeruanoActual}`
            );
            resolve({
              exitoso: true,
              mensaje: "Registro mensual guardado exitosamente",
              datos: datos.Id_Registro_Mensual,
            });
          };

          putRequest.onerror = (event) => {
            console.error(
              `❌ Error al guardar en ${storeName}:`,
              (event.target as IDBRequest).error
            );
            reject(
              new Error(
                `Error al guardar registro mensual: ${
                  (event.target as IDBRequest).error
                }`
              )
            );
          };
        } catch (error) {
          console.error(`❌ Error en preparación de guardado:`, error);
          reject(error);
        }
      });
    } catch (error) {
      console.error("Error en guardarRegistroMensual:", error);
      return {
        exitoso: false,
        mensaje: `Error al guardar registro mensual: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * Obtiene el registro mensual de asistencia para un personal específico
   * ✅ ACTUALIZADO: Usa ID_o_DNI_Personal
   * ✅ MEJORADO: Mejor logging para debugging
   */
  public async obtenerRegistroMensual(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    ID_o_DNI_Personal: string | number,
    mes: number,
    id_registro_mensual?: number
  ): Promise<AsistenciaMensualPersonalLocal | null> {
    try {
      await IndexedDBConnection.init();
      const storeName = this.mapper.getStoreName(tipoPersonal, modoRegistro);
      const store = await IndexedDBConnection.getStore(storeName, "readonly");

      // Si se proporciona ID del registro, buscar directamente
      if (id_registro_mensual) {
        const request = store.get(id_registro_mensual);

        return new Promise((resolve, reject) => {
          try {
            request.onsuccess = async () => {
              if (request.result) {
                const registroMensual: AsistenciaMensualPersonalLocal =
                  this.mapearRegistroMensualDesdeStore(
                    request.result,
                    tipoPersonal,
                    modoRegistro
                  );
                console.log(
                  `📖 Registro encontrado por ID: ${id_registro_mensual}, última actualización: ${new Date(
                    registroMensual.ultima_fecha_actualizacion
                  ).toLocaleString("es-PE")}`
                );

                resolve(registroMensual);
              } else {
                console.log(
                  `📖 No se encontró registro con ID: ${id_registro_mensual}`
                );
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

      // ✅ VALIDAR valores antes de usar en índice
      this.validarValoresParaIndice(ID_o_DNI_Personal, mes, tipoPersonal);

      const indexName = this.mapper.getIndexNameForPersonalMes(tipoPersonal);

      return new Promise((resolve, reject) => {
        try {
          const index = store.index(indexName);

          // ✅ CONVERTIR identificador al tipo correcto
          const identificadorConvertido = this.convertirIdentificadorParaDB(
            tipoPersonal,
            ID_o_DNI_Personal
          );
          const keyValue = [identificadorConvertido, mes];

          console.log(`🔍 Buscando en índice: ${indexName}`, {
            tipoPersonal,
            identificadorOriginal: ID_o_DNI_Personal,
            identificadorConvertido,
            mes,
            keyValue,
          });

          const request = index.get(keyValue);

          request.onsuccess = () => {
            if (request.result) {
              const registroMensual: AsistenciaMensualPersonalLocal =
                this.mapearRegistroMensualDesdeStore(
                  request.result,
                  tipoPersonal,
                  modoRegistro
                );

              console.log(
                `📖 Registro encontrado para ${tipoPersonal} - ${ID_o_DNI_Personal} - mes ${mes}, última actualización: ${new Date(
                  registroMensual.ultima_fecha_actualizacion
                ).toLocaleString("es-PE")}`
              );
              resolve(registroMensual);
            } else {
              console.log(
                `📊 No se encontró registro para: ${tipoPersonal} - ${ID_o_DNI_Personal} - mes ${mes}`
              );
              resolve(null);
            }
          };

          request.onerror = (event) => {
            const error = (event.target as IDBRequest).error;
            console.error(`❌ Error en índice ${indexName}:`, error);
            reject(
              new Error(
                `Error al obtener registro mensual por índice: ${error}`
              )
            );
          };
        } catch (error) {
          console.error(`❌ Error al preparar consulta:`, error);
          reject(error);
        }
      });
    } catch (error) {
      console.error("Error en obtenerRegistroMensual:", error);
      return null;
    }
  }

  /**
   * ✅ NUEVO: Convierte el identificador al tipo correcto según el personal
   */
  private convertirIdentificadorParaDB(
    tipoPersonal: TipoPersonal,
    id_o_dni: string | number
  ): string | number {
    if (
      tipoPersonal === TipoPersonal.DIRECTIVO &&
      typeof id_o_dni === "string"
    ) {
      // Para directivos: convertir a número (Id_Directivo es INT en la BD)
      const id = parseInt(id_o_dni, 10);
      if (isNaN(id)) {
        throw new Error(`ID de directivo inválido: ${id_o_dni}`);
      }
      return id;
    } else {
      // Para otros roles: mantener como string (DNI)
      return id_o_dni;
    }
  }

  /**
   * ✅ CORREGIDO: Validar valores antes de usar en índices
   */
  private validarValoresParaIndice(
    id_o_dni: string | number,
    mes: number,
    tipoPersonal: TipoPersonal
  ): void {
    if (!id_o_dni || String(id_o_dni).trim() === "") {
      throw new Error(`ID/DNI no puede estar vacío para ${tipoPersonal}`);
    }

    if (!mes || mes < 1 || mes > 12) {
      throw new Error(`Mes inválido: ${mes}. Debe estar entre 1 y 12`);
    }

    // Validar formato específico
    if (
      !this.mapper.validarFormatoIdentificador(tipoPersonal, String(id_o_dni))
    ) {
      const tipoEsperado =
        this.mapper.getTipoIdentificadorLegible(tipoPersonal);
      throw new Error(
        `Formato de ${tipoEsperado} inválido para ${tipoPersonal}: ${id_o_dni}`
      );
    }
  }

  /**
   * Elimina registros mensuales locales
   * ✅ ACTUALIZADO: Usa idODni
   */
  public async eliminarRegistroMensual(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    id_o_dni: string | number,
    mes: number
  ): Promise<OperationResult> {
    try {
      await IndexedDBConnection.init();
      const storeName = this.mapper.getStoreName(tipoPersonal, modoRegistro);
      const store = await IndexedDBConnection.getStore(storeName, "readwrite");
      const indexName = this.mapper.getIndexNameForPersonalMes(tipoPersonal);

      return new Promise((resolve, reject) => {
        try {
          const index = store.index(indexName);
          const keyValue = [id_o_dni, mes];
          const request = index.get(keyValue);

          request.onsuccess = () => {
            if (request.result) {
              const idField = this.mapper.getIdFieldForStore(
                tipoPersonal,
                modoRegistro
              );
              const id = request.result[idField];

              const deleteRequest = store.delete(id);
              deleteRequest.onsuccess = () => {
                console.log(
                  `🗑️ Registro eliminado: ${storeName} - ${id_o_dni} - mes ${mes}`
                );
                resolve({
                  exitoso: true,
                  mensaje: "Registro mensual eliminado exitosamente",
                });
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
              resolve({
                exitoso: true,
                mensaje: "No había registro que eliminar",
              });
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
      return {
        exitoso: false,
        mensaje: `Error al eliminar registro: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * Verifica si existe un registro mensual para un personal específico
   * ✅ ACTUALIZADO: Usa idODni
   */
  public async verificarExistenciaRegistroMensual(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    idODni: string,
    mes: number
  ): Promise<number | null> {
    try {
      await IndexedDBConnection.init();
      const storeName = this.mapper.getStoreName(tipoPersonal, modoRegistro);
      const store = await IndexedDBConnection.getStore(storeName, "readonly");
      const indexName = this.mapper.getIndexNameForPersonalMes(tipoPersonal);
      const idField = this.mapper.getIdFieldForStore(
        tipoPersonal,
        modoRegistro
      );

      return new Promise((resolve, reject) => {
        try {
          const index = store.index(indexName);
          const keyValue = [idODni, mes];
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
   * Verifica si ya existe un registro diario para un personal específico
   * ✅ CORREGIDO: Aplica validaciones y conversiones
   */
  public async verificarSiExisteRegistroDiario(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    idODni: string,
    mes: number,
    dia: number
  ): Promise<boolean> {
    try {
      await IndexedDBConnection.init();
      const storeName = this.mapper.getStoreName(tipoPersonal, modoRegistro);
      const store = await IndexedDBConnection.getStore(storeName, "readonly");

      // ✅ AGREGAR: Validar valores antes de usar en índice
      this.validarValoresParaIndice(idODni, mes, tipoPersonal);

      const indexName = this.mapper.getIndexNameForPersonalMes(tipoPersonal);

      return new Promise((resolve, reject) => {
        try {
          const index = store.index(indexName);

          // ✅ AGREGAR: Convertir identificador al tipo correcto
          const identificadorConvertido = this.convertirIdentificadorParaDB(
            tipoPersonal,
            idODni
          );
          const keyValue = [identificadorConvertido, mes];

          console.log(
            `🔍 verificarSiExisteRegistroDiario - Índice: ${indexName}`,
            {
              tipoPersonal,
              identificadorOriginal: idODni,
              identificadorConvertido,
              mes,
              dia,
              keyValue,
            }
          );

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
            const error = (event.target as IDBRequest).error;
            console.error(
              `❌ Error en verificarSiExisteRegistroDiario:`,
              error
            );
            reject(
              new Error(
                `Error al verificar existencia de registro diario: ${error}`
              )
            );
          };
        } catch (error) {
          console.error(
            `❌ Error al preparar consulta en verificarSiExisteRegistroDiario:`,
            error
          );
          reject(error);
        }
      });
    } catch (error) {
      console.error("Error al verificar existencia de registro diario:", error);
      return false;
    }
  }

  /**
   * Obtiene todos los registros mensuales para un tipo de personal y un mes específico
   * ✅ MEJORADO: Mejor logging y manejo de timestamp
   */
  public async obtenerTodosRegistrosMensuales(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    mes: Meses
  ): Promise<AsistenciaMensualPersonalLocal[]> {
    try {
      await IndexedDBConnection.init();
      const storeName = this.mapper.getStoreName(tipoPersonal, modoRegistro);
      const store = await IndexedDBConnection.getStore(storeName, "readonly");
      const idFieldName = this.mapper.getIdFieldName(tipoPersonal);
      const idField = this.mapper.getIdFieldForStore(
        tipoPersonal,
        modoRegistro
      );

      return new Promise((resolve, reject) => {
        try {
          const index = store.index("por_mes");
          const request = index.getAll(mes);

          request.onsuccess = () => {
            if (request.result && request.result.length > 0) {
              const registrosMensuales: AsistenciaMensualPersonalLocal[] =
                request.result.map((item) => {
                  // ✅ NUEVO: Preservar timestamp original o usar timestamp actual si no existe
                  const timestampOriginal = item.ultima_fecha_actualizacion;
                  const timestampFinal =
                    timestampOriginal ||
                    this.dateHelper.obtenerTimestampPeruano();

                  if (!timestampOriginal) {
                    console.warn(
                      `⚠️ Registro sin timestamp encontrado, usando timestamp actual: ${timestampFinal}`
                    );
                  }

                  return {
                    Id_Registro_Mensual: item[idField],
                    mes: item.Mes,
                    ID_o_DNI_Personal: item[idFieldName],
                    registros:
                      modoRegistro === ModoRegistro.Entrada
                        ? item.Entradas
                        : item.Salidas,
                    ultima_fecha_actualizacion: timestampFinal,
                  };
                });

              console.log(
                `📊 Se obtuvieron ${registrosMensuales.length} registros mensuales para ${tipoPersonal} - mes ${mes}`
              );
              resolve(registrosMensuales);
            } else {
              console.log(
                `📊 No se encontraron registros mensuales para ${tipoPersonal} - mes ${mes}`
              );
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
      console.error("Error en obtenerTodosRegistrosMensuales:", error);
      return [];
    }
  }

  /**
   * Actualiza un registro existente agregando un nuevo día
   * ✅ ACTUALIZADO: Usa idODni y garantiza timestamp actualizado
   */
  public async actualizarRegistroExistente(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    idODni: string,
    mes: number,
    dia: number,
    registro: RegistroEntradaSalida,
    idRegistroExistente: number
  ): Promise<OperationResult> {
    try {
      console.log(
        `🔄 Actualizando registro existente para ${tipoPersonal} - ${idODni} - mes ${mes} - día ${dia}`
      );

      const registroActual = await this.obtenerRegistroMensual(
        tipoPersonal,
        modoRegistro,
        idODni,
        mes,
        idRegistroExistente
      );

      if (registroActual) {
        // Actualizar el registro del día específico
        registroActual.registros[dia.toString()] = registro;

        // ✅ NUEVO: SIEMPRE actualizar el timestamp cuando se modifica el registro
        registroActual.ultima_fecha_actualizacion =
          this.dateHelper.obtenerTimestampPeruano();

        console.log(
          `🔄 Actualizando timestamp a: ${
            registroActual.ultima_fecha_actualizacion
          } (${new Date(
            registroActual.ultima_fecha_actualizacion
          ).toLocaleString("es-PE")})`
        );

        return await this.guardarRegistroMensual(
          tipoPersonal,
          modoRegistro,
          registroActual
        );
      }

      return {
        exitoso: false,
        mensaje: "No se encontró el registro a actualizar",
      };
    } catch (error) {
      console.error("Error en actualizarRegistroExistente:", error);
      return {
        exitoso: false,
        mensaje: `Error al actualizar registro: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * Mapea un registro obtenido del store a la interfaz AsistenciaMensualPersonalLocal
   * ✅ ACTUALIZADO: Usa ID_o_DNI_Personal y maneja timestamp correctamente
   */
  private mapearRegistroMensualDesdeStore(
    registroStore: any,
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro
  ): AsistenciaMensualPersonalLocal {
    const idField = this.mapper.getIdFieldForStore(tipoPersonal, modoRegistro);
    const idPersonalField = this.mapper.getIdFieldName(tipoPersonal);

    // ✅ NUEVO: Manejo robusto del timestamp
    const timestampOriginal = registroStore.ultima_fecha_actualizacion;
    const timestampFinal =
      timestampOriginal || this.dateHelper.obtenerTimestampPeruano();

    if (!timestampOriginal) {
      console.warn(
        `⚠️ Registro sin timestamp encontrado al mapear, usando timestamp actual: ${timestampFinal}`
      );
    }

    return {
      Id_Registro_Mensual: registroStore[idField],
      mes: registroStore.Mes,
      ID_o_DNI_Personal: registroStore[idPersonalField],
      registros:
        modoRegistro === ModoRegistro.Entrada
          ? registroStore.Entradas
          : registroStore.Salidas,
      ultima_fecha_actualizacion: timestampFinal,
    };
  }

  /**
   * Elimina un día específico de un registro mensual
   * ✅ ACTUALIZADO: Usa idODni y actualiza timestamp al modificar
   */
  public async eliminarDiaDeRegistroMensual(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    id_o_dni: string | number,
    mes: number,
    dia: number
  ): Promise<OperationResult> {
    try {
      console.log(
        `🗑️ Eliminando día ${dia} del registro mensual para ${tipoPersonal} - ${id_o_dni} - mes ${mes}`
      );

      // Obtener el registro mensual actual
      const registroMensual = await this.obtenerRegistroMensual(
        tipoPersonal,
        modoRegistro,
        id_o_dni,
        mes
      );

      if (!registroMensual) {
        return {
          exitoso: false,
          mensaje: `No se encontró registro mensual para ID/DNI: ${id_o_dni}, mes: ${mes}`,
        };
      }

      // Verificar si existe el día específico
      const claveDay = dia.toString();
      if (!registroMensual.registros[claveDay]) {
        return {
          exitoso: false,
          mensaje: `No se encontró registro para el día ${dia} en el mes ${mes}`,
        };
      }

      // Eliminar el día específico
      delete registroMensual.registros[claveDay];
      console.log(`🗑️ Día ${dia} eliminado del registro mensual`);

      // Decidir si mantener o eliminar todo el registro mensual
      if (Object.keys(registroMensual.registros).length === 0) {
        // Si no quedan más días, eliminar todo el registro mensual
        console.log(`📱 Eliminando registro mensual completo (sin más días)`);
        return await this.eliminarRegistroMensual(
          tipoPersonal,
          modoRegistro,
          id_o_dni,
          mes
        );
      } else {
        // Si quedan más días, actualizar el registro
        console.log(
          `📱 Actualizando registro mensual (quedan ${
            Object.keys(registroMensual.registros).length
          } días)`
        );

        // ✅ NUEVO: Actualizar timestamp al modificar el registro
        registroMensual.ultima_fecha_actualizacion =
          this.dateHelper.obtenerTimestampPeruano();
        console.log(
          `🔄 Actualizando timestamp tras eliminación de día: ${registroMensual.ultima_fecha_actualizacion}`
        );

        return await this.guardarRegistroMensual(
          tipoPersonal,
          modoRegistro,
          registroMensual
        );
      }
    } catch (error) {
      console.error("Error al eliminar día del registro mensual:", error);
      return {
        exitoso: false,
        mensaje: `Error al eliminar día: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * Valida la estructura de un registro antes de guardarlo
   * ✅ ACTUALIZADO: Validación mejorada para ID_o_DNI_Personal y timestamp
   */
  public validarEstructuraAntesSalvar(
    datos: AsistenciaMensualPersonalLocal,
    tipoPersonal?: TipoPersonal
  ): ValidacionResult {
    const errores: string[] = [];

    if (typeof datos.Id_Registro_Mensual !== "number") {
      errores.push("Id_Registro_Mensual debe ser un número");
    }

    if (typeof datos.mes !== "number" || datos.mes < 1 || datos.mes > 12) {
      errores.push("El mes debe ser un número entre 1 y 12");
    }

    // ✅ VALIDACIÓN MEJORADA: Soporte para ID (directivos) y DNI (otros)
    if (
      typeof datos.ID_o_DNI_Personal !== "string" ||
      datos.ID_o_DNI_Personal.trim().length === 0
    ) {
      errores.push("ID_o_DNI_Personal debe ser un string no vacío");
    } else {
      // Validación específica según el tipo de personal
      if (tipoPersonal === TipoPersonal.DIRECTIVO) {
        // Para directivos: puede ser cualquier string válido (usualmente números)
        if (!/^[a-zA-Z0-9]+$/.test(datos.ID_o_DNI_Personal)) {
          errores.push(
            "ID_o_DNI_Personal para directivos debe contener solo caracteres alfanuméricos"
          );
        }
      } else {
        // Para otros roles: debe ser DNI de 8 dígitos
        if (!/^\d{8}$/.test(datos.ID_o_DNI_Personal)) {
          errores.push(
            "ID_o_DNI_Personal para personal no-directivo debe ser un DNI de 8 dígitos"
          );
        }
      }
    }

    // ✅ NUEVA VALIDACIÓN: Verificar timestamp
    if (typeof datos.ultima_fecha_actualizacion !== "number") {
      errores.push("ultima_fecha_actualizacion debe ser un número (timestamp)");
    } else if (datos.ultima_fecha_actualizacion <= 0) {
      errores.push(
        "ultima_fecha_actualizacion debe ser un timestamp válido mayor a 0"
      );
    }

    if (!datos.registros || typeof datos.registros !== "object") {
      errores.push("registros debe ser un objeto");
    } else {
      // Validar cada registro individual
      for (const [dia, registro] of Object.entries(datos.registros)) {
        if (isNaN(parseInt(dia))) {
          errores.push(`El día '${dia}' debe ser un número`);
        }

        if (!registro || typeof registro !== "object") {
          errores.push(`El registro del día ${dia} debe ser un objeto`);
          continue;
        }

        if (typeof registro.timestamp !== "number") {
          errores.push(`El timestamp del día ${dia} debe ser un número`);
        }

        if (typeof registro.desfaseSegundos !== "number") {
          errores.push(`El desfaseSegundos del día ${dia} debe ser un número`);
        }

        if (typeof registro.estado !== "string") {
          errores.push(`El estado del día ${dia} debe ser un string`);
        }
      }
    }

    return {
      valido: errores.length === 0,
      errores,
    };
  }

  /**
   * ✅ NUEVO: Método para actualizar masivamente timestamps de registros antiguos
   * Útil para migrar registros que no tenían el campo ultima_fecha_actualizacion
   */
  public async actualizarTimestampsRegistrosAntiguos(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro,
    mes?: number
  ): Promise<OperationResult> {
    try {
      console.log(
        `🔄 Iniciando actualización masiva de timestamps para ${tipoPersonal} - ${modoRegistro}${
          mes ? ` - mes ${mes}` : ""
        }`
      );

      await IndexedDBConnection.init();
      const storeName = this.mapper.getStoreName(tipoPersonal, modoRegistro);
      const store = await IndexedDBConnection.getStore(storeName, "readwrite");

      let registrosActualizados = 0;
      const timestampActual = this.dateHelper.obtenerTimestampPeruano();

      return new Promise((resolve, reject) => {
        try {
          const request = mes
            ? store.index("por_mes").getAll(mes)
            : store.getAll();

          request.onsuccess = () => {
            const registros = request.result;

            if (!registros || registros.length === 0) {
              resolve({
                exitoso: true,
                mensaje: `No se encontraron registros para actualizar en ${storeName}`,
                datos: 0,
              });
              return;
            }

            const actualizaciones: Promise<void>[] = [];

            registros.forEach((registro) => {
              // Solo actualizar si no tiene timestamp o es inválido
              if (
                !registro.ultima_fecha_actualizacion ||
                registro.ultima_fecha_actualizacion <= 0
              ) {
                registro.ultima_fecha_actualizacion = timestampActual;

                const actualizacion = new Promise<void>(
                  (resolveUpdate, rejectUpdate) => {
                    const updateRequest = store.put(registro);
                    updateRequest.onsuccess = () => {
                      registrosActualizados++;
                      resolveUpdate();
                    };
                    updateRequest.onerror = () =>
                      rejectUpdate(updateRequest.error);
                  }
                );

                actualizaciones.push(actualizacion);
              }
            });

            if (actualizaciones.length === 0) {
              resolve({
                exitoso: true,
                mensaje: `Todos los registros en ${storeName} ya tienen timestamps válidos`,
                datos: 0,
              });
              return;
            }

            Promise.all(actualizaciones)
              .then(() => {
                console.log(
                  `✅ Actualización masiva completada: ${registrosActualizados} registros actualizados en ${storeName}`
                );
                resolve({
                  exitoso: true,
                  mensaje: `Se actualizaron ${registrosActualizados} registros con timestamps`,
                  datos: registrosActualizados,
                });
              })
              .catch((error) => {
                console.error(`❌ Error en actualización masiva:`, error);
                reject(new Error(`Error al actualizar timestamps: ${error}`));
              });
          };

          request.onerror = (event) => {
            reject(
              new Error(
                `Error al obtener registros para actualización: ${
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
      console.error("Error en actualizarTimestampsRegistrosAntiguos:", error);
      return {
        exitoso: false,
        mensaje: `Error al actualizar timestamps: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }
}
