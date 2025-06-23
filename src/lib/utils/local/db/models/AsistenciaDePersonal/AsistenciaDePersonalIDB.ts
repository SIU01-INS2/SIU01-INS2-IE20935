/* eslint-disable @typescript-eslint/no-explicit-any */
import { SiasisAPIS } from "@/interfaces/shared/SiasisComponents";

import {
  AsistenciaMensualPersonalLocal,
  TipoPersonal,
  ModoRegistro,
  RolesSistema,
  OperationResult,
  ConsultaAsistenciaResult,
  SincronizacionStats,
  EliminacionResult,
  MarcadoHoyResult,
  ParametrosMarcadoAsistencia,
  ParametrosEliminacionAsistencia,
  ParametrosConsultaAsistencia,
  RegistroEntradaSalida,
} from "./AsistenciaDePersonalTypes";
import { Meses } from "@/interfaces/shared/Meses";

// Importar todos los servicios especializados
import { AsistenciaDePersonalErrorHandler } from "./services/AsistenciaDePersonalErrorHandler";
import {
  ErrorResponseAPIBase,
  MessageProperty,
} from "@/interfaces/shared/apis/types";
import {
  ConsultarAsistenciasTomadasPorActorEnRedisResponseBody,
  TipoAsistencia,
} from "@/interfaces/shared/AsistenciaRequests";
import { AsistenciaDePersonalMapper } from "./services/AsistenciaDePersonalMapper";
import { AsistenciaDePersonalDateHelper } from "./services/AsistenciaDePersonalDateHelper";
import { AsistenciaDePersonalValidator } from "./services/AsistenciaDePersonalValidator";
import { AsistenciaDePersonalRepository } from "./services/AsistenciaDePersonalRepository";
import { AsistenciaDePersonalCacheManager } from "./services/AsistenciaDePersonalCacheManager";
import { AsistenciaDePersonalAPIClient } from "./services/AsistenciaDePersonalAPIClient";
import { AsistenciaPersonalSyncService } from "./services/AsistenciaDePersonalSyncService";

/**
 * 🎯 RESPONSABILIDAD: Orquestación y coordinación de servicios
 * - Actúa como fachada principal para el manejo de asistencia de personal
 * - Coordina la interacción entre todos los servicios especializados
 * - Mantiene compatibilidad TOTAL con la interfaz original
 * - Proporciona métodos de alto nivel para operaciones complejas
 *
 * ✨ PRINCIPIOS SOLID APLICADOS:
 * - Single Responsibility: Cada servicio tiene una responsabilidad específica
 * - Open/Closed: Extensible sin modificar código existente
 * - Liskov Substitution: Servicios intercambiables
 * - Interface Segregation: Interfaces específicas por responsabilidad
 * - Dependency Inversion: Depende de abstracciones, no de implementaciones
 *
 * 🔄 COMPATIBILIDAD: Misma interfaz que AsistenciaDePersonalIDB original
 */
export class AsistenciaDePersonalIDB {
  // Servicios especializados
  private mapper: AsistenciaDePersonalMapper;
  private dateHelper: AsistenciaDePersonalDateHelper;
  private validator: AsistenciaDePersonalValidator;
  private repository: AsistenciaDePersonalRepository;
  private cacheManager: AsistenciaDePersonalCacheManager;
  private apiClient: AsistenciaDePersonalAPIClient;
  private syncService: AsistenciaPersonalSyncService;
  private errorHandler: AsistenciaDePersonalErrorHandler;

  constructor(
    siasisAPI: SiasisAPIS,
    setIsSomethingLoading?: (isLoading: boolean) => void,
    setError?: (error: ErrorResponseAPIBase | null) => void,
    setSuccessMessage?: (message: MessageProperty | null) => void
  ) {
    // Inicializar servicios base
    this.mapper = new AsistenciaDePersonalMapper();
    this.dateHelper = new AsistenciaDePersonalDateHelper();
    this.errorHandler = new AsistenciaDePersonalErrorHandler(
      setIsSomethingLoading,
      setError,
      setSuccessMessage
    );

    // Inicializar servicios que dependen de los base
    this.validator = new AsistenciaDePersonalValidator(this.dateHelper);
    this.repository = new AsistenciaDePersonalRepository(
      this.mapper,
      this.dateHelper
    );
    this.cacheManager = new AsistenciaDePersonalCacheManager(
      this.mapper,
      this.dateHelper
    );
    this.apiClient = new AsistenciaDePersonalAPIClient(
      siasisAPI,
      this.mapper,
      this.dateHelper,
      this.repository
    );

    // Inicializar servicio de sincronización que coordina todos los demás
    this.syncService = new AsistenciaPersonalSyncService(
      this.repository,
      this.validator,
      this.apiClient,
      this.mapper,
      this.cacheManager,
      this.dateHelper
    );
  }

  // ========================================================================================
  // MÉTODOS PÚBLICOS PRINCIPALES (Interfaz IDÉNTICA a la versión original)
  // ========================================================================================

  /**
   * 🚀 MÉTODO PRINCIPAL: Marca asistencia con nueva lógica optimizada
   * Si NO existe registro mensual, guarda en cache Redis en lugar de consultar API
   */
  public async marcarAsistencia(
    params: ParametrosMarcadoAsistencia,
    horaEsperadaISO: string
  ): Promise<void> {
    try {
      this.errorHandler.setLoading(true);
      this.errorHandler.clearErrors();

      const { datos } = params;
      const { ModoRegistro: modoRegistro, DNI: dni, Rol: rol } = datos;

      // 🎯 NUEVO: Obtener información de fecha ANTES de marcar en Redis
      const infoFecha = this.dateHelper.obtenerInfoFechaActual();
      if (!infoFecha) {
        throw new Error("No se pudo obtener información de fecha");
      }

      const { diaActual, mesActual } = infoFecha;

      // ✅ PASO 1: Marcar en Redis (como antes)
      console.log(`🚀 Marcando asistencia vía API: ${dni} - ${modoRegistro}`);
      const resultadoMarcado = await this.apiClient.marcarAsistenciaEnRedis(
        dni,
        rol,
        modoRegistro,
        horaEsperadaISO
      );

      if (resultadoMarcado.exitoso) {
        // ✅ PASO 2: NUEVO - Sincronizar con registro mensual
        await this.sincronizarMarcadoConRegistroMensual(
          dni,
          rol,
          modoRegistro,
          diaActual,
          mesActual,
          resultadoMarcado.datos
        );

        console.log(
          `✅ Asistencia marcada y sincronizada: ${resultadoMarcado.mensaje}`
        );
        this.errorHandler.handleSuccess("Asistencia registrada exitosamente");
      } else {
        throw new Error(resultadoMarcado.mensaje);
      }
    } catch (error) {
      console.error(`❌ Error al marcar asistencia:`, error);
      this.errorHandler.handleErrorWithRecovery(error, "marcar asistencia");
      throw error;
    } finally {
      this.errorHandler.setLoading(false);
    }
  }

  /**
   * 🆕 NUEVO: Sincroniza el marcado de Redis con el registro mensual
   */
  private async sincronizarMarcadoConRegistroMensual(
    dni: string,
    rol: RolesSistema,
    modoRegistro: ModoRegistro,
    dia: number,
    mes: number,
    datosRedis: any
  ): Promise<void> {
    try {
      const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(rol);

      // Extraer datos de la respuesta de Redis
      const timestamp =
        datosRedis.timestamp || this.dateHelper.obtenerTimestampPeruano();
      const desfaseSegundos = datosRedis.desfaseSegundos || 0;
      const estado = this.mapper.determinarEstadoAsistencia(
        desfaseSegundos,
        modoRegistro
      );

      // Crear el registro para el día
      const registroDia: RegistroEntradaSalida = {
        timestamp,
        desfaseSegundos,
        estado,
      };

      // Verificar si ya existe un registro mensual
      const registroExistente = await this.repository.obtenerRegistroMensual(
        tipoPersonal,
        modoRegistro,
        dni,
        mes
      );

      if (registroExistente) {
        // Actualizar registro existente
        console.log(
          `🔄 Actualizando registro mensual existente para día ${dia}`
        );
        await this.repository.actualizarRegistroExistente(
          tipoPersonal,
          modoRegistro,
          dni,
          mes,
          dia,
          registroDia,
          registroExistente.Id_Registro_Mensual
        );
      } else {
        // No existe registro mensual → Guardar como asistencia huérfana
        console.log(
          `📝 Guardando asistencia huérfana en cache temporal para día ${dia}`
        );

        const actor = this.mapper.obtenerActorDesdeRol(rol);
        const fechaString = this.dateHelper.generarFechaString(mes, dia);

        const asistenciaHuerfana = this.cacheManager.crearAsistenciaParaCache(
          dni,
          actor,
          modoRegistro,
          timestamp,
          desfaseSegundos,
          estado,
          fechaString
        );

        await this.cacheManager.guardarAsistenciaEnCache(asistenciaHuerfana);
      }

      console.log(
        `✅ Registro mensual sincronizado para ${dni} - día ${dia}/${mes}`
      );
    } catch (error) {
      console.error("❌ Error al sincronizar con registro mensual:", error);
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * 🔍 MÉTODO PRINCIPAL: Obtiene asistencias mensuales con integración completa
   */
  public async obtenerAsistenciaMensualConAPI(
    params: ParametrosConsultaAsistencia
  ): Promise<ConsultaAsistenciaResult> {
    try {
      this.errorHandler.clearErrors();
      this.errorHandler.setLoading(true);

      const { rol, id_o_dni, mes } = params;

      const resultado = await this.syncService.obtenerAsistenciaMensualConAPI(
        rol,
        id_o_dni,
        mes
      );

      console.log(
        `📊 Consulta completada para DNI o ID ${id_o_dni} - mes ${mes}: ${resultado.mensaje}`
      );

      return resultado;
    } catch (error) {
      console.error("❌ Error al obtener asistencias mensuales:", error);
      this.errorHandler.handleErrorWithRecovery(
        error,
        "obtener asistencias mensuales"
      );

      return {
        encontrado: false,
        mensaje: "Error al obtener los datos de asistencia",
      };
    } finally {
      this.errorHandler.setLoading(false);
    }
  }

  /**
   * 🗑️ MÉTODO PRINCIPAL: Elimina asistencia de manera completa
   */
  public async eliminarAsistencia(
    params: ParametrosEliminacionAsistencia
  ): Promise<EliminacionResult> {
    try {
      this.errorHandler.setLoading(true);
      this.errorHandler.clearErrors();

      const { id_o_dni, rol, modoRegistro, dia, mes } = params;

      // Usar fecha Redux si no se proporcionan día/mes
      const fechaActualRedux = this.dateHelper.obtenerFechaActualDesdeRedux();
      if (!fechaActualRedux && (!dia || !mes)) {
        throw new Error(
          "No se pudo obtener la fecha desde Redux y no se proporcionaron día/mes"
        );
      }

      const diaActual = dia || fechaActualRedux!.getDate();
      const mesActual = mes || fechaActualRedux!.getMonth() + 1;
      const fechaString =
        fechaActualRedux?.toISOString().split("T")[0] ||
        this.dateHelper.generarFechaString(mesActual, diaActual);

      console.log(
        `🗑️ Iniciando eliminación COMPLETA para DNI: ${id_o_dni}, Día: ${diaActual}, Mes: ${mesActual}`
      );

      let eliminadoLocal = false;
      let eliminadoRedis = false;
      let eliminadoCache = false;

      // PASO 1: Eliminar de Redis mediante API
      try {
        const resultadoRedis =
          await this.apiClient.eliminarAsistenciaConReintentos(
            id_o_dni,
            rol,
            modoRegistro
          );
        eliminadoRedis = resultadoRedis.exitoso;
        console.log(
          `☁️ Eliminación Redis: ${
            eliminadoRedis ? "exitosa" : "no encontrada"
          }`
        );
      } catch (error) {
        console.error("Error al eliminar de Redis:", error);
      }

      // PASO 2: Eliminar del cache de asistencias de hoy
      try {
        const resultadoCache =
          await this.cacheManager.eliminarAsistenciaDelCache(
            id_o_dni,
            rol,
            modoRegistro,
            fechaString
          );
        eliminadoCache = resultadoCache.exitoso;
        console.log(
          `🗄️ Eliminación cache: ${
            eliminadoCache ? "exitosa" : "no encontrada"
          }`
        );
      } catch (error) {
        console.error("Error al eliminar del cache:", error);
      }

      // PASO 3: Eliminar del registro mensual (solo el día específico)
      try {
        const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(rol);
        const resultadoLocal =
          await this.repository.eliminarDiaDeRegistroMensual(
            tipoPersonal,
            modoRegistro,
            id_o_dni,
            mesActual,
            diaActual
          );
        eliminadoLocal = resultadoLocal.exitoso;
        console.log(
          `📱 Eliminación local: ${
            eliminadoLocal ? "exitosa" : "no encontrada"
          }`
        );
      } catch (error) {
        console.error("Error al eliminar de registro mensual:", error);
      }

      // Determinar resultado general
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

      if (exitoso) {
        this.errorHandler.handleSuccess(mensaje);
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
      this.errorHandler.handleErrorWithRecovery(error, "eliminar asistencia");

      return {
        exitoso: false,
        mensaje: "Error al eliminar la asistencia",
        eliminadoLocal: false,
        eliminadoRedis: false,
        eliminadoCache: false,
      };
    } finally {
      this.errorHandler.setLoading(false);
    }
  }

  // ========================================================================================
  // MÉTODOS DE CONSULTA Y VERIFICACIÓN
  // ========================================================================================

  /**
   * ✅ NUEVO: Consulta y sincroniza asistencias desde Redis
   */
  public async consultarYSincronizarAsistenciasRedis(
    rol: RolesSistema,
    modoRegistro: ModoRegistro
  ): Promise<{
    exitoso: boolean;
    datos?: any;
    estadisticasSincronizacion?: SincronizacionStats;
    mensaje: string;
  }> {
    try {
      this.errorHandler.setLoading(true);
      this.errorHandler.clearErrors();

      const actor = this.mapper.obtenerActorDesdeRol(rol);

      console.log(
        `🔍 Consultando asistencias Redis para ${actor} - ${modoRegistro}`
      );

      // PASO 1: Consultar Redis via API
      const datosRedis =
        await this.apiClient.consultarAsistenciasTomadasEnRedis(
          TipoAsistencia.ParaPersonal,
          actor,
          modoRegistro
        );

      // PASO 2: Sincronizar con IndexedDB (cache temporal)
      const statsSync = await this.syncService.sincronizarAsistenciasDesdeRedis(
        datosRedis
      );

      // 🆕 PASO 3: NUEVO - Sincronizar con registros mensuales
      const statsMensuales =
        await this.sincronizarAsistenciasConRegistrosMensuales(
          datosRedis,
          rol,
          modoRegistro
        );

      console.log("📊 Estadísticas sincronización cache:", statsSync);
      console.log("📊 Estadísticas sincronización mensual:", statsMensuales);

      return {
        exitoso: true,
        datos: datosRedis,
        estadisticasSincronizacion: {
          ...statsSync,
          registrosNuevos:
            statsSync.registrosNuevos + statsMensuales.registrosActualizados,
        },
        mensaje: `Sincronización completa: ${statsSync.registrosNuevos} cache + ${statsMensuales.registrosActualizados} mensuales`,
      };
    } catch (error) {
      console.error("❌ Error al consultar y sincronizar desde Redis:", error);
      this.errorHandler.handleErrorWithRecovery(
        error,
        "consultar asistencias Redis"
      );

      return {
        exitoso: false,
        mensaje: "Error al consultar asistencias desde Redis",
      };
    } finally {
      this.errorHandler.setLoading(false);
    }
  }

  /**
   * 🆕 NUEVO: Sincroniza datos de Redis con registros mensuales en IndexedDB
   */
  private async sincronizarAsistenciasConRegistrosMensuales(
    datosRedis: any,
    rol: RolesSistema,
    modoRegistro: ModoRegistro
  ): Promise<{
    registrosActualizados: number;
    registrosCreados: number;
    errores: number;
  }> {
    const stats = {
      registrosActualizados: 0,
      registrosCreados: 0,
      errores: 0,
    };

    try {
      if (!datosRedis.Resultados || datosRedis.Resultados.length === 0) {
        console.log("📭 No hay resultados de Redis para sincronizar");
        return stats;
      }

      const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(rol);
      const mes = datosRedis.Mes;
      const dia = datosRedis.Dia;

      console.log(
        `🔄 Sincronizando ${datosRedis.Resultados.length} registros con tablas mensuales`
      );

      for (const resultado of datosRedis.Resultados) {
        try {
          const dni = resultado.ID_o_DNI;

          // Verificar si ya existe registro para este día
          const yaExiste =
            await this.repository.verificarSiExisteRegistroDiario(
              tipoPersonal,
              modoRegistro,
              dni,
              mes,
              dia
            );

          if (yaExiste) {
            console.log(`⏭️ Registro ya existe: ${dni} - día ${dia}/${mes}`);
            continue;
          }

          // Extraer datos del resultado de Redis
          const timestamp =
            resultado.Detalles?.Timestamp ||
            this.dateHelper.obtenerTimestampPeruano();
          const desfaseSegundos = resultado.Detalles?.DesfaseSegundos || 0;
          const estado = this.mapper.determinarEstadoAsistencia(
            desfaseSegundos,
            modoRegistro
          );

          const registroDia: RegistroEntradaSalida = {
            timestamp,
            desfaseSegundos,
            estado,
          };

          // Verificar si existe registro mensual
          const registroMensual = await this.repository.obtenerRegistroMensual(
            tipoPersonal,
            modoRegistro,
            dni,
            mes
          );

          if (registroMensual) {
            // Actualizar registro existente
            await this.repository.actualizarRegistroExistente(
              tipoPersonal,
              modoRegistro,
              dni,
              mes,
              dia,
              registroDia,
              registroMensual.Id_Registro_Mensual
            );
            stats.registrosActualizados++;
            console.log(
              `✅ Registro mensual actualizado: ${dni} - día ${dia}/${mes}`
            );
          } else {
            // No existe registro mensual → Guardar como asistencia huérfana
            console.log(
              `📝 Guardando como asistencia huérfana: ${dni} - día ${dia}/${mes}`
            );

            const actor = this.mapper.obtenerActorDesdeRol(rol);
            const fechaString = this.dateHelper.generarFechaString(mes, dia);

            const asistenciaHuerfana =
              this.cacheManager.crearAsistenciaParaCache(
                dni,
                actor,
                modoRegistro,
                timestamp,
                desfaseSegundos,
                estado,
                fechaString
              );

            await this.cacheManager.guardarAsistenciaEnCache(
              asistenciaHuerfana
            );
            stats.registrosCreados++; // Cuenta como "creado" en cache temporal
            console.log(
              `✅ Asistencia huérfana guardada en cache: ${dni} - ${modoRegistro}`
            );
          }
          console.log(
            `✅ Sincronizado: ${dni} - día ${dia}/${mes} (${estado})`
          );
        } catch (error) {
          console.error(`❌ Error sincronizando ${resultado.ID_o_DNI}:`, error);
          stats.errores++;
        }
      }

      console.log(`🎯 Sincronización mensual completada:`, stats);
      return stats;
    } catch (error) {
      console.error("❌ Error en sincronización mensual:", error);
      return {
        registrosActualizados: 0,
        registrosCreados: 0,
        errores: 1,
      };
    }
  }

  /**
   * Verifica si una asistencia existe para hoy
   */
  public async verificarAsistenciaHoy(
    dni: string,
    rol: RolesSistema,
    modoRegistro: ModoRegistro
  ): Promise<boolean> {
    try {
      const fechaActualRedux = this.dateHelper.obtenerFechaActualDesdeRedux();
      if (!fechaActualRedux) {
        console.error("No se pudo obtener la fecha desde Redux");
        return false;
      }

      const mes = fechaActualRedux.getMonth() + 1;
      const dia = fechaActualRedux.getDate();
      const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(rol);

      return await this.repository.verificarSiExisteRegistroDiario(
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
   * Verifica si un personal ha marcado asistencia (entrada o salida) hoy
   */
  public async hasMarcadoHoy(
    modoRegistro: ModoRegistro,
    rol: RolesSistema,
    dni: string
  ): Promise<MarcadoHoyResult> {
    try {
      const fechaActualRedux = this.dateHelper.obtenerFechaActualDesdeRedux();
      if (!fechaActualRedux) {
        console.error("No se pudo obtener la fecha desde Redux");
        return { marcado: false };
      }

      const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(rol);
      const mes = fechaActualRedux.getMonth() + 1;
      const dia = fechaActualRedux.getDate();

      const haRegistrado =
        await this.repository.verificarSiExisteRegistroDiario(
          tipoPersonal,
          modoRegistro,
          dni,
          mes,
          dia
        );

      if (haRegistrado) {
        // Obtener los detalles del registro
        const registroMensual = await this.repository.obtenerRegistroMensual(
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
  ): Promise<AsistenciaMensualPersonalLocal[]> {
    try {
      return await this.repository.obtenerTodosRegistrosMensuales(
        tipoPersonal,
        modoRegistro,
        mes
      );
    } catch (error) {
      this.errorHandler.handleError(error, "obtenerTodosRegistrosMensuales");
      return [];
    }
  }

  // ========================================================================================
  // MÉTODOS DE SINCRONIZACIÓN
  // ========================================================================================

  /**
   * Sincroniza las asistencias registradas en Redis con la base de datos local IndexedDB
   */
  public async sincronizarAsistenciasDesdeRedis(
    datosRedis: ConsultarAsistenciasTomadasPorActorEnRedisResponseBody
  ): Promise<SincronizacionStats> {
    try {
      this.errorHandler.setLoading(true);

      const stats = await this.syncService.sincronizarAsistenciasDesdeRedis(
        datosRedis
      );

      console.log(`🔄 Sincronización completada:`, stats);

      if (stats.registrosNuevos > 0) {
        this.errorHandler.handleSuccess(
          `Sincronización exitosa: ${stats.registrosNuevos} registros nuevos procesados`
        );
      }

      return stats;
    } catch (error) {
      this.errorHandler.handleErrorWithRecovery(
        error,
        "sincronizar desde Redis"
      );

      return {
        totalRegistros: 0,
        registrosNuevos: 0,
        registrosExistentes: 0,
        errores: 1,
      };
    } finally {
      this.errorHandler.setLoading(false);
    }
  }

  /**
   * Fuerza la actualización desde la API eliminando datos locales
   */
  public async forzarActualizacionDesdeAPI(
    rol: RolesSistema,
    dni: string,
    mes: number
  ): Promise<ConsultaAsistenciaResult> {
    try {
      this.errorHandler.setLoading(true);

      console.log(
        `🔄 Forzando actualización desde API para ${rol} ${dni} - mes ${mes}...`
      );

      const resultado = await this.syncService.forzarActualizacionDesdeAPI(
        rol,
        dni,
        mes
      );

      if (resultado.encontrado) {
        this.errorHandler.handleSuccess(
          "Datos actualizados desde la API exitosamente"
        );
      }

      return resultado;
    } catch (error) {
      this.errorHandler.handleErrorWithRecovery(
        error,
        "forzar actualización desde API"
      );

      return {
        encontrado: false,
        mensaje: "Error al forzar la actualización de datos",
      };
    } finally {
      this.errorHandler.setLoading(false);
    }
  }

  // ========================================================================================
  // MÉTODOS DE DIAGNÓSTICO Y MANTENIMIENTO
  // ========================================================================================

  /**
   * Verifica la integridad de los datos
   */
  public async verificarIntegridadDatos(
    rol: RolesSistema,
    dni: string,
    mes: number
  ): Promise<OperationResult> {
    try {
      const resultado = await this.syncService.verificarIntegridadDatos(
        rol,
        dni,
        mes
      );

      return {
        exitoso: resultado.integro,
        mensaje: resultado.integro
          ? "Los datos están íntegros"
          : `Problemas detectados: ${resultado.problemas.join(", ")}`,
        datos: resultado,
      };
    } catch (error) {
      this.errorHandler.logError(error, "verificarIntegridadDatos");

      return {
        exitoso: false,
        mensaje: "Error al verificar integridad de datos",
      };
    }
  }

  /**
   * Repara datos corruptos o desincronizados
   */
  public async repararDatos(
    rol: RolesSistema,
    dni: string,
    mes: number
  ): Promise<OperationResult> {
    try {
      this.errorHandler.setLoading(true);

      const resultado = await this.syncService.repararDatos(rol, dni, mes);

      if (resultado.exitoso) {
        this.errorHandler.handleSuccess(resultado.mensaje);
      }

      return resultado;
    } catch (error) {
      this.errorHandler.handleErrorWithRecovery(error, "reparar datos");

      return {
        exitoso: false,
        mensaje: "Error al reparar los datos",
      };
    } finally {
      this.errorHandler.setLoading(false);
    }
  }

  /**
   * Obtiene estadísticas del cache
   */
  public async obtenerEstadisticasCache(): Promise<OperationResult> {
    try {
      const stats = await this.cacheManager.obtenerEstadisticasCache();

      return {
        exitoso: true,
        mensaje: "Estadísticas del cache obtenidas exitosamente",
        datos: stats,
      };
    } catch (error) {
      this.errorHandler.logError(error, "obtenerEstadisticasCache");

      return {
        exitoso: false,
        mensaje: "Error al obtener estadísticas del cache",
      };
    }
  }

  /**
   * Limpia el cache de asistencias vencidas
   */
  public async limpiarCacheVencido(): Promise<OperationResult> {
    try {
      const resultado = await this.cacheManager.limpiarCacheVencido();

      if (resultado.exitoso) {
        this.errorHandler.handleSuccess(resultado.mensaje);
      }

      return resultado;
    } catch (error) {
      this.errorHandler.handleErrorWithRecovery(error, "limpiar cache vencido");

      return {
        exitoso: false,
        mensaje: "Error al limpiar el cache",
      };
    }
  }

  // ========================================================================================
  // MÉTODOS DE UTILIDAD Y ACCESO A SERVICIOS
  // ========================================================================================

  /**
   * Acceso a los servicios especializados (para casos avanzados)
   */
  public get services() {
    return {
      mapper: this.mapper,
      dateHelper: this.dateHelper,
      validator: this.validator,
      repository: this.repository,
      cacheManager: this.cacheManager,
      apiClient: this.apiClient,
      syncService: this.syncService,
      errorHandler: this.errorHandler,
    };
  }

  /**
   * Obtiene información del estado general del sistema
   */
  public async obtenerEstadoSistema(): Promise<{
    api: boolean;
    cache: any;
    fecha: string | null;
    servicios: string[];
  }> {
    try {
      const [estadoAPI, estadosCache] = await Promise.all([
        this.apiClient.obtenerEstadoServidor(),
        this.cacheManager.obtenerEstadisticasCache(),
      ]);

      return {
        api: estadoAPI.disponible,
        cache: estadosCache,
        fecha: this.dateHelper.obtenerFechaStringActual(),
        servicios: [
          "AsistenciaPersonalMapper",
          "AsistenciaPersonalDateHelper",
          "AsistenciaPersonalValidator",
          "AsistenciaPersonalRepository",
          "AsistenciaPersonalCacheManager",
          "AsistenciaPersonalAPIClient",
          "AsistenciaPersonalSyncService",
          "AsistenciaPersonalErrorHandler",
        ],
      };
    } catch (error) {
      this.errorHandler.logError(error, "obtenerEstadoSistema");

      return {
        api: false,
        cache: { error: "No disponible" },
        fecha: null,
        servicios: [],
      };
    }
  }
}
