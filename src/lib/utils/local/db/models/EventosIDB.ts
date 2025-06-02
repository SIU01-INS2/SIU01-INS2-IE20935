import IndexedDBConnection from "../IndexedDBConnection";
import {
  TablasSistema,
  ITablaInfo,
  TablasLocal,
} from "../../../../../interfaces/shared/TablasSistema";
import {
  ApiResponseBase,
  ErrorResponseAPIBase,
  MessageProperty,
} from "@/interfaces/shared/apis/types";
import AllErrorTypes, {
  DataConflictErrorTypes,
  SystemErrorTypes,
  UserErrorTypes,
} from "../../../../../interfaces/shared/apis/errors";
import { SiasisAPIS } from "@/interfaces/shared/SiasisComponents";
import comprobarSincronizacionDeTabla from "@/lib/helpers/validations/comprobarSincronizacionDeTabla";
import fetchSiasisApiGenerator from "@/lib/helpers/generators/fetchSiasisApisGenerator";
import ultimaActualizacionTablasLocalesIDB from "./UltimaActualizacionTablasLocalesIDB";
import { DatabaseModificationOperations } from "@/interfaces/shared/DatabaseModificationOperations";
import { T_Eventos } from "@prisma/client";
import { GetEventosSuccessResponse } from "@/interfaces/shared/apis/eventos/types";

// Tipo para la entidad (reutilizamos la interfaz existente)
export type IEventoLocal = Pick<T_Eventos, "Id_Evento" | "Nombre"> & {
  Fecha_Inicio: string; // Formato YYYY-MM-DD
  Fecha_Conclusion: string; // Formato YYYY-MM-DD
};

export interface IEventoFilter {
  Id_Evento?: number;
  Nombre?: string;
  mes?: number; // Filtro por mes
  año?: number; // Filtro por año
}

export class EventosIDB {
  private tablaInfo: ITablaInfo = TablasSistema.EVENTOS;
  private nombreTablaLocal: string = this.tablaInfo.nombreLocal || "eventos";

  constructor(
    private siasisAPI: SiasisAPIS,
    private setIsSomethingLoading?: (isLoading: boolean) => void,
    private setError?: (error: ErrorResponseAPIBase | null) => void,
    private setSuccessMessage?: (message: MessageProperty | null) => void
  ) {}

  /**
   * Normaliza una fecha ISO a formato YYYY-MM-DD
   * @param fechaISO Fecha en formato ISO (2025-05-01T00:00:00.000Z)
   * @returns Fecha en formato YYYY-MM-DD
   */
  private normalizarFecha(fechaISO: string): string {
    // Extraer solo la parte de fecha (YYYY-MM-DD) antes de la 'T'
    return fechaISO.split("T")[0];
  }

  /**
   * Método de sincronización que se ejecutará al inicio de cada operación
   * Sincroniza los eventos del mes actual desde la API
   */
  private async sync(mes?: number, año?: number): Promise<void> {
    try {
      // Si no se proporciona mes, usar el mes actual
      const fechaActual = new Date();
      const mesASincronizar = mes || fechaActual.getMonth() + 1;
      const añoASincronizar = año || fechaActual.getFullYear();

      console.log(
        `🔄 Verificando sincronización para ${mesASincronizar}/${añoASincronizar}`
      );

      const debeSincronizar = await comprobarSincronizacionDeTabla(
        this.tablaInfo,
        "API01"
      );

      if (!debeSincronizar) {
        console.log("✅ Sincronización no necesaria");
        return;
      }

      console.log("🚀 Iniciando sincronización de eventos...");
      // Si llegamos aquí, debemos sincronizar
      await this.fetchYActualizarEventos(mesASincronizar, añoASincronizar);
    } catch (error) {
      console.error("Error durante la sincronización de eventos:", error);
      this.handleIndexedDBError(error, "sincronizar eventos");
    }
  }

  /**
   * Obtiene los eventos desde la API y los actualiza localmente
   * @param mes Mes para obtener eventos (1-12)
   * @param año Año para obtener eventos (opcional)
   * @returns Promise que se resuelve cuando los eventos han sido actualizados
   */
  private async fetchYActualizarEventos(
    mes: number,
    año?: number
  ): Promise<void> {
    try {
      console.log(
        `📡 Obteniendo eventos de la API para ${mes}/${año || "actual"}`
      );

      // Usar el generador para API01
      const { fetchSiasisAPI } = fetchSiasisApiGenerator(this.siasisAPI);

      // Construir la URL del endpoint con parámetros obligatorios
      let endpoint = `/api/eventos?Mes=${mes}`;
      if (año) {
        endpoint += `&Año=${año}`;
      }

      console.log(`🌐 Endpoint: ${endpoint}`);

      // Realizar la petición al endpoint
      const fetchCancelable = await fetchSiasisAPI({
        endpoint,
        method: "GET",
      });

      if (!fetchCancelable) {
        throw new Error("No se pudo crear la petición de eventos");
      }

      // Ejecutar la petición
      const response = await fetchCancelable.fetch();

      if (!response.ok) {
        throw new Error(`Error al obtener eventos: ${response.statusText}`);
      }

      const objectResponse = (await response.json()) as ApiResponseBase;

      if (!objectResponse.success) {
        throw new Error(
          `Error en respuesta de eventos: ${objectResponse.message}`
        );
      }

      // Extraer los eventos del cuerpo de la respuesta
      const { data: eventos } = objectResponse as GetEventosSuccessResponse;

      console.log(`📦 Eventos recibidos de la API:`, eventos.length);

      // ✅ TRANSFORMAR fechas antes de guardar en IndexedDB
      const eventosNormalizados = eventos.map((evento) => ({
        ...evento,
        Fecha_Inicio: this.normalizarFecha(String(evento.Fecha_Inicio)),
        Fecha_Conclusion: this.normalizarFecha(String(evento.Fecha_Conclusion)),
      }));

      console.log(`🔄 Eventos normalizados:`, eventosNormalizados);

      // Actualizar eventos en la base de datos local
      const result = await this.upsertFromServer(eventosNormalizados, mes, año);

      // Registrar la actualización en UltimaActualizacionTablasLocalesIDB
      await ultimaActualizacionTablasLocalesIDB.registrarActualizacion(
        this.tablaInfo.nombreLocal as TablasLocal,
        DatabaseModificationOperations.UPDATE
      );

      console.log(
        `✅ Sincronización de eventos completada para ${mes}/${
          año || "actual"
        }: ${eventos.length} eventos procesados (${result.created} creados, ${
          result.updated
        } actualizados, ${result.deleted} eliminados, ${result.errors} errores)`
      );
    } catch (error) {
      console.error("❌ Error al obtener y actualizar eventos:", error);

      // Determinar el tipo de error
      let errorType: AllErrorTypes = SystemErrorTypes.UNKNOWN_ERROR;
      let message = "Error al sincronizar eventos";

      if (error instanceof Error) {
        // Si es un error de red o problemas de conexión
        if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          errorType = SystemErrorTypes.EXTERNAL_SERVICE_ERROR;
          message = "Error de red al sincronizar eventos";
        }
        // Si es un error relacionado con la respuesta del servidor
        else if (error.message.includes("obtener eventos")) {
          errorType = SystemErrorTypes.EXTERNAL_SERVICE_ERROR;
          message = error.message;
        }
        // Si es un error de IndexedDB
        else if (
          error.name === "TransactionInactiveError" ||
          error.name === "QuotaExceededError"
        ) {
          errorType = SystemErrorTypes.DATABASE_ERROR;
          message = "Error de base de datos al sincronizar eventos";
        } else {
          message = error.message;
        }
      }

      // Establecer el error en el estado global
      this.setError?.({
        success: false,
        message: message,
        errorType: errorType,
        details: {
          origen: "EventosIDB.fetchYActualizarEventos",
          timestamp: Date.now(),
        },
      });

      throw error;
    }
  }

  /**
   * Obtiene todos los eventos o filtrados por mes/año
   * @param filtros Filtros opcionales (mes, año)
   * @returns Promesa con el array de eventos
   */
  public async getAll(filtros?: IEventoFilter): Promise<IEventoLocal[]> {
    this.setIsSomethingLoading?.(true);
    this.setError?.(null); // Limpiar errores anteriores
    this.setSuccessMessage?.(null); // Limpiar mensajes anteriores

    try {
      console.log(`🔍 getAll() llamado con filtros:`, filtros);

      // Ejecutar sincronización antes de la operación
      await this.sync(filtros?.mes, filtros?.año);

      // Obtener el store
      const store = await IndexedDBConnection.getStore(this.nombreTablaLocal);

      // Convertir la API de callbacks de IndexedDB a promesas
      const result = await new Promise<IEventoLocal[]>((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = () => {
          console.log(
            `📊 Registros obtenidos de IndexedDB:`,
            request.result?.length || 0
          );
          console.log(`📝 Datos crudos:`, request.result);
          resolve(request.result as IEventoLocal[]);
        };
        request.onerror = () => reject(request.error);
      });

      // Aplicar filtros si se proporcionan
      let eventosFiltrados = result;

      if (filtros) {
        console.log(`🔽 Aplicando filtros a ${result.length} eventos...`);

        eventosFiltrados = result.filter((evento) => {
          console.log(`🧐 Evaluando evento ${evento.Id_Evento}:`, {
            nombre: evento.Nombre,
            fechaInicio: evento.Fecha_Inicio,
            fechaConclusion: evento.Fecha_Conclusion,
          });

          // Filtro por ID
          if (filtros.Id_Evento && evento.Id_Evento !== filtros.Id_Evento) {
            console.log(
              `❌ Rechazado por ID: ${evento.Id_Evento} !== ${filtros.Id_Evento}`
            );
            return false;
          }

          // Filtro por nombre (búsqueda parcial, insensible a mayúsculas)
          if (
            filtros.Nombre &&
            !evento.Nombre.toLowerCase().includes(filtros.Nombre.toLowerCase())
          ) {
            console.log(
              `❌ Rechazado por nombre: "${evento.Nombre}" no contiene "${filtros.Nombre}"`
            );
            return false;
          }

          // 🐛 AQUÍ ESTABA EL PROBLEMA PRINCIPAL: Filtro por mes
          if (filtros.mes) {
            // ✅ CORRECCIÓN: Crear fechas usando el constructor de Date con strings YYYY-MM-DD
            const fechaInicio = new Date(evento.Fecha_Inicio + "T00:00:00");
            const fechaConclusión = new Date(
              evento.Fecha_Conclusion + "T00:00:00"
            );

            console.log(`📅 Fechas del evento:`, {
              fechaInicio: fechaInicio.toISOString(),
              fechaConclusion: fechaConclusión.toISOString(),
              mesInicio: fechaInicio.getMonth() + 1,
              mesConclusión: fechaConclusión.getMonth() + 1,
            });

            const mesInicio = fechaInicio.getMonth() + 1;
            const mesConclusión = fechaConclusión.getMonth() + 1;

            console.log(
              `🔍 Verificando si mes ${filtros.mes} está entre ${mesInicio} y ${mesConclusión}`
            );

            // ✅ CORRECCIÓN: El evento debe incluir o TOCAR el mes solicitado
            // Un evento puede empezar en un mes y terminar en otro
            const incluyeMes =
              filtros.mes >= mesInicio && filtros.mes <= mesConclusión;

            if (!incluyeMes) {
              console.log(
                `❌ Rechazado por mes: ${filtros.mes} no está en rango ${mesInicio}-${mesConclusión}`
              );
              return false;
            } else {
              console.log(
                `✅ Aceptado por mes: ${filtros.mes} está en rango ${mesInicio}-${mesConclusión}`
              );
            }
          }

          // Filtro por año
          if (filtros.año) {
            // ✅ CORRECCIÓN: Crear fechas correctamente
            const fechaInicio = new Date(evento.Fecha_Inicio + "T00:00:00");
            const fechaConclusión = new Date(
              evento.Fecha_Conclusion + "T00:00:00"
            );

            const añoInicio = fechaInicio.getFullYear();
            const añoConclusión = fechaConclusión.getFullYear();

            console.log(
              `🗓️ Verificando si año ${filtros.año} está entre ${añoInicio} y ${añoConclusión}`
            );

            // El evento debe incluir el año solicitado
            if (filtros.año < añoInicio || filtros.año > añoConclusión) {
              console.log(
                `❌ Rechazado por año: ${filtros.año} no está en rango ${añoInicio}-${añoConclusión}`
              );
              return false;
            } else {
              console.log(
                `✅ Aceptado por año: ${filtros.año} está en rango ${añoInicio}-${añoConclusión}`
              );
            }
          }

          console.log(`✅ Evento ${evento.Id_Evento} ACEPTADO`);
          return true;
        });
      }

      console.log(`🏁 Eventos filtrados finales: ${eventosFiltrados.length}`);

      // Ordenar por fecha de inicio
      eventosFiltrados.sort(
        (a, b) =>
          new Date(a.Fecha_Inicio + "T00:00:00").getTime() -
          new Date(b.Fecha_Inicio + "T00:00:00").getTime()
      );

      // Mostrar mensaje de éxito con información relevante
      if (eventosFiltrados.length > 0) {
        this.handleSuccess(
          `Se encontraron ${eventosFiltrados.length} evento(s)`
        );
      } else {
        this.handleSuccess(
          "No se encontraron eventos para los filtros aplicados"
        );
      }

      this.setIsSomethingLoading?.(false);
      return eventosFiltrados;
    } catch (error) {
      console.error("❌ Error en getAll():", error);
      this.handleIndexedDBError(error, "obtener lista de eventos");
      this.setIsSomethingLoading?.(false);
      return []; // Devolvemos array vacío en caso de error
    }
  }

  /**
   * Obtiene eventos específicos para un mes y año
   * @param mes Mes (1-12)
   * @param año Año (opcional, por defecto el actual)
   * @returns Promesa con el array de eventos del mes
   */
  public async getEventosPorMes(
    mes: number,
    año?: number
  ): Promise<IEventoLocal[]> {
    console.log(`🎯 getEventosPorMes() llamado con mes=${mes}, año=${año}`);

    // Validar mes
    if (mes < 1 || mes > 12) {
      console.error(`❌ Mes inválido: ${mes}`);
      this.setError?.({
        success: false,
        message: "El mes debe estar entre 1 y 12",
        errorType: SystemErrorTypes.UNKNOWN_ERROR,
      });
      return [];
    }

    return this.getAll({ mes, año });
  }

  /**
   * Obtiene todos los IDs de eventos almacenados localmente
   * @returns Promise con array de IDs
   */
  private async getAllEventoIDs(): Promise<number[]> {
    try {
      const store = await IndexedDBConnection.getStore(this.nombreTablaLocal);

      return new Promise<number[]>((resolve, reject) => {
        const ids: number[] = [];
        const request = store.openCursor();

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest)
            .result as IDBCursorWithValue;
          if (cursor) {
            // Añadir el ID del evento actual
            ids.push(cursor.value.Id_Evento);
            cursor.continue();
          } else {
            // No hay más registros, resolvemos con el array de IDs
            resolve(ids);
          }
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("Error al obtener todos los IDs de eventos:", error);
      throw error;
    }
  }

  /**
   * Elimina un evento por su ID
   * @param id ID del evento a eliminar
   * @returns Promise<void>
   */
  private async deleteByID(id: number): Promise<void> {
    try {
      const store = await IndexedDBConnection.getStore(
        this.nombreTablaLocal,
        "readwrite"
      );

      return new Promise<void>((resolve, reject) => {
        const request = store.delete(id);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(`Error al eliminar evento con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Actualiza o crea eventos en lote desde el servidor
   * Solo procesa eventos del mes y año específicos
   * @param eventosServidor Eventos provenientes del servidor
   * @param mes Mes de los eventos
   * @param año Año de los eventos
   * @returns Conteo de operaciones: creados, actualizados, eliminados, errores
   */
  private async upsertFromServer(
    eventosServidor: IEventoLocal[],
    mes: number,
    año?: number
  ): Promise<{
    created: number;
    updated: number;
    deleted: number;
    errors: number;
  }> {
    const result = { created: 0, updated: 0, deleted: 0, errors: 0 };

    try {
      console.log(
        `💾 upsertFromServer(): Procesando ${eventosServidor.length} eventos del servidor`
      );

      // 1. Obtener los eventos locales del mes específico
      const eventosLocalesDelMes = await this.getEventosLocalesDelMes(mes, año);
      console.log(
        `📂 Eventos locales existentes del mes: ${eventosLocalesDelMes.length}`
      );

      // 2. Crear conjunto de IDs del servidor para búsqueda rápida
      const idsServidor = new Set(
        eventosServidor.map((evento) => evento.Id_Evento)
      );

      // 3. Identificar eventos del mes que ya no existen en el servidor
      const idsAEliminar = eventosLocalesDelMes
        .map((evento) => evento.Id_Evento)
        .filter((id) => !idsServidor.has(id));

      console.log(`🗑️ IDs a eliminar: ${idsAEliminar.length}`);

      // 4. Eliminar registros que ya no existen en el servidor
      for (const id of idsAEliminar) {
        try {
          await this.deleteByID(id);
          result.deleted++;
        } catch (error) {
          console.error(`Error al eliminar evento ${id}:`, error);
          result.errors++;
        }
      }

      // 5. Procesar en lotes para evitar transacciones demasiado largas
      const BATCH_SIZE = 20;

      for (let i = 0; i < eventosServidor.length; i += BATCH_SIZE) {
        const lote = eventosServidor.slice(i, i + BATCH_SIZE);

        // Para cada evento en el lote
        for (const eventoServidor of lote) {
          try {
            // Verificar si el evento ya existe
            const existeEvento = await this.getByID(eventoServidor.Id_Evento);

            // Obtener un store fresco para cada operación
            const store = await IndexedDBConnection.getStore(
              this.nombreTablaLocal,
              "readwrite"
            );

            // ✅ NORMALIZAR fechas antes de guardar
            const eventoNormalizado = {
              ...eventoServidor,
              Fecha_Inicio: this.normalizarFecha(
                String(eventoServidor.Fecha_Inicio)
              ),
              Fecha_Conclusion: this.normalizarFecha(
                String(eventoServidor.Fecha_Conclusion)
              ),
            };

            console.log(
              `💾 Guardando evento ${eventoServidor.Id_Evento}:`,
              eventoNormalizado
            );

            // Ejecutar la operación put
            await new Promise<void>((resolve, reject) => {
              const request = store.put(eventoNormalizado);

              request.onsuccess = () => {
                if (existeEvento) {
                  result.updated++;
                  console.log(
                    `✅ Evento ${eventoServidor.Id_Evento} actualizado`
                  );
                } else {
                  result.created++;
                  console.log(`✅ Evento ${eventoServidor.Id_Evento} creado`);
                }
                resolve();
              };

              request.onerror = () => {
                result.errors++;
                console.error(
                  `❌ Error al guardar evento ${eventoServidor.Id_Evento}:`,
                  request.error
                );
                reject(request.error);
              };
            });
          } catch (error) {
            result.errors++;
            console.error(
              `❌ Error al procesar evento ${eventoServidor.Id_Evento}:`,
              error
            );
          }
        }

        // Dar un pequeño respiro al bucle de eventos entre lotes
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      return result;
    } catch (error) {
      console.error("❌ Error en la operación upsertFromServer:", error);
      result.errors++;
      return result;
    }
  }

  /**
   * Obtiene eventos locales de un mes específico
   * @param mes Mes (1-12)
   * @param año Año (opcional)
   * @returns Promise con eventos del mes
   */
  private async getEventosLocalesDelMes(
    mes: number,
    año?: number
  ): Promise<IEventoLocal[]> {
    try {
      console.log(
        `🔍 getEventosLocalesDelMes(): Buscando eventos del mes ${mes}/${
          año || "actual"
        }`
      );

      const store = await IndexedDBConnection.getStore(this.nombreTablaLocal);

      return new Promise<IEventoLocal[]>((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = () => {
          const todosLosEventos = request.result as IEventoLocal[];
          console.log(
            `📊 Total eventos en IndexedDB: ${todosLosEventos.length}`
          );

          // Filtrar eventos del mes específico
          const eventosDelMes = todosLosEventos.filter((evento) => {
            // ✅ CORRECCIÓN: Crear fechas correctamente
            const fechaInicio = new Date(evento.Fecha_Inicio + "T00:00:00");
            const fechaConclusión = new Date(
              evento.Fecha_Conclusion + "T00:00:00"
            );

            const mesInicio = fechaInicio.getMonth() + 1;
            const mesConclusión = fechaConclusión.getMonth() + 1;
            const añoInicio = fechaInicio.getFullYear();
            const añoConclusión = fechaConclusión.getFullYear();

            // Verificar si el evento incluye el mes solicitado
            const incluyeMes = mes >= mesInicio && mes <= mesConclusión;

            // Verificar año si se proporciona
            if (año) {
              const incluyeAño = año >= añoInicio && año <= añoConclusión;
              return incluyeMes && incluyeAño;
            }

            return incluyeMes;
          });

          console.log(
            `🎯 Eventos filtrados del mes ${mes}: ${eventosDelMes.length}`
          );
          resolve(eventosDelMes);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(
        `❌ Error al obtener eventos locales del mes ${mes}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Obtiene un evento por su ID
   * @param id ID del evento
   * @returns Evento encontrado o null
   */
  public async getByID(id: number): Promise<IEventoLocal | null> {
    try {
      const store = await IndexedDBConnection.getStore(this.nombreTablaLocal);

      return new Promise<IEventoLocal | null>((resolve, reject) => {
        const request = store.get(id);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(`Error al obtener evento con ID ${id}:`, error);
      this.handleIndexedDBError(error, `obtener evento con ID ${id}`);
      return null;
    }
  }

  /**
   * Verifica si hay eventos en una fecha específica
   * @param fecha Fecha en formato YYYY-MM-DD
   * @returns Promise<boolean>
   */
  public async hayEventoEnFecha(fecha: string): Promise<boolean> {
    try {
      const todosLosEventos = await this.getAll();
      const fechaBuscada = new Date(fecha + "T00:00:00"); // ✅ CORRECCIÓN

      return todosLosEventos.some((evento) => {
        const fechaInicio = new Date(evento.Fecha_Inicio + "T00:00:00"); // ✅ CORRECCIÓN
        const fechaConclusión = new Date(evento.Fecha_Conclusion + "T00:00:00"); // ✅ CORRECCIÓN

        return fechaBuscada >= fechaInicio && fechaBuscada <= fechaConclusión;
      });
    } catch (error) {
      console.error("Error al verificar eventos en fecha:", error);
      return false;
    }
  }

  /**
   * Establece un mensaje de éxito
   * @param message Mensaje de éxito
   */
  private handleSuccess(message: string): void {
    const successResponse: MessageProperty = { message };
    this.setSuccessMessage?.(successResponse);
  }

  /**
   * Maneja los errores de operaciones con IndexedDB
   * @param error El error capturado
   * @param operacion Nombre de la operación que falló
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
}
