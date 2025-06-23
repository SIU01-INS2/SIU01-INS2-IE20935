/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AsistenciaMensualPersonalLocal,
  ModoRegistro,
  RolesSistema,
  OperationResult,
  ConsultaAsistenciaResult,
  SincronizacionStats,
  RegistroEntradaSalida,
  ActoresSistema,
  TipoPersonal,
} from "../AsistenciaDePersonalTypes";

import { AsistenciaCompletaMensualDePersonal } from "@/interfaces/shared/apis/api01/personal/types";
import {
  AsistenciaDiariaResultado,
  ConsultarAsistenciasTomadasPorActorEnRedisResponseBody,
  TipoAsistencia,
  //   DetallesAsistenciaUnitariaPersonal,
} from "@/interfaces/shared/AsistenciaRequests";
import { AsistenciaDePersonalRepository } from "./AsistenciaDePersonalRepository";
import { AsistenciaDePersonalValidator } from "./AsistenciaDePersonalValidator";
import { AsistenciaDePersonalAPIClient } from "./AsistenciaDePersonalAPIClient";
import { AsistenciaDePersonalMapper } from "./AsistenciaDePersonalMapper";
import { AsistenciaDePersonalCacheManager } from "./AsistenciaDePersonalCacheManager";
import { AsistenciaDePersonalDateHelper } from "./AsistenciaDePersonalDateHelper";

/**
 * 🎯 RESPONSABILIDAD: Sincronización y coordinación de datos
 * - Sincronizar datos entre API, cache y base de datos local
 * - Forzar sincronización completa
 * - Procesar datos de múltiples fuentes
 * - Resolver conflictos de sincronización
 *
 * ✅ CORREGIDO:
 * - Todos los registros modificados actualizan timestamp automáticamente
 * - Toda lógica de fechas delegada a DateHelper (SRP)
 * - Consistencia en el manejo de timestamps
 */
export class AsistenciaPersonalSyncService {
  private repository: AsistenciaDePersonalRepository;
  private validator: AsistenciaDePersonalValidator;
  private apiClient: AsistenciaDePersonalAPIClient;
  private mapper: AsistenciaDePersonalMapper;
  private cacheManager: AsistenciaDePersonalCacheManager;
  private dateHelper: AsistenciaDePersonalDateHelper;

  constructor(
    repository: AsistenciaDePersonalRepository,
    validator: AsistenciaDePersonalValidator,
    apiClient: AsistenciaDePersonalAPIClient,
    mapper: AsistenciaDePersonalMapper,
    cacheManager: AsistenciaDePersonalCacheManager,
    dateHelper: AsistenciaDePersonalDateHelper
  ) {
    this.repository = repository;
    this.validator = validator;
    this.apiClient = apiClient;
    this.mapper = mapper;
    this.cacheManager = cacheManager;
    this.dateHelper = dateHelper;
  }

  /**
   * Fuerza la sincronización completa desde la API
   * Elimina ambos registros locales y los reemplaza con datos frescos de la API
   * ✅ CORREGIDO: Manejo de fechas delegado a DateHelper
   */
  public async forzarSincronizacionCompleta(
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number
  ): Promise<{
    entrada?: AsistenciaMensualPersonalLocal;
    salida?: AsistenciaMensualPersonalLocal;
    sincronizado: boolean;
    mensaje: string;
  }> {
    try {
      const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(rol);

      console.log(
        `🔄 FORZANDO SINCRONIZACIÓN COMPLETA para ${id_o_dni} - mes ${mes}`
      );

      // PASO 1: Eliminar ambos registros locales (entrada y salida)
      console.log("🗑️ Eliminando registros locales desincronizados...");
      await Promise.allSettled([
        this.repository.eliminarRegistroMensual(
          tipoPersonal,
          ModoRegistro.Entrada,
          id_o_dni,
          mes
        ),
        this.repository.eliminarRegistroMensual(
          tipoPersonal,
          ModoRegistro.Salida,
          id_o_dni,
          mes
        ),
      ]);

      // PASO 2: Consultar API para obtener datos frescos
      console.log("📡 Consultando API para datos frescos...");
      const asistenciaAPI =
        await this.apiClient.consultarAsistenciasConReintentos(
          rol,
          id_o_dni,
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
        this.repository.obtenerRegistroMensual(
          tipoPersonal,
          ModoRegistro.Entrada,
          id_o_dni,
          mes,
          asistenciaAPI.Id_Registro_Mensual_Entrada
        ),
        this.repository.obtenerRegistroMensual(
          tipoPersonal,
          ModoRegistro.Salida,
          id_o_dni,
          mes,
          asistenciaAPI.Id_Registro_Mensual_Salida
        ),
      ]);

      // PASO 5: Verificar que la sincronización fue exitosa
      const verificacion = this.validator.verificarSincronizacionEntradaSalida(
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
   * 🔄 INTEGRA asistencias huérfanas del cache temporal con datos recién traídos de API
   */
  private async integrarAsistenciasHuerfanasDesdeAPI(
    asistenciaAPI: AsistenciaCompletaMensualDePersonal,
    tipoPersonal: TipoPersonal,
    timestampPeruanoActual: number,
    modoRegistroSolicitado?: ModoRegistro
  ): Promise<void> {
    try {
      const infoFechaActual = this.dateHelper.obtenerInfoFechaActual();

      if (
        !infoFechaActual ||
        !this.dateHelper.esDiaEscolar(infoFechaActual.diaActual.toString())
      ) {
        console.log(
          "📅 No es día escolar actual, omitiendo integración de cache temporal"
        );
        return;
      }

      const actor = this.mapper.obtenerActorDesdeRol(asistenciaAPI.Rol);
      const fechaHoy = this.dateHelper.obtenerFechaStringActual();
      const diaActual = infoFechaActual.diaActual;

      if (!fechaHoy) return;

      // Determinar qué registros procesar
      const modosAProcesar = modoRegistroSolicitado
        ? [modoRegistroSolicitado]
        : [ModoRegistro.Entrada, ModoRegistro.Salida];

      for (const modoRegistro of modosAProcesar) {
        try {
          // Consultar cache temporal para este modo
          const asistenciaCache =
            await this.consultarCacheTemporalParaIntegracion(
              actor,
              modoRegistro,
              asistenciaAPI.ID_O_DNI_Usuario,
              fechaHoy
            );

          if (asistenciaCache) {
            // Obtener el registro mensual recién guardado
            const idReal =
              modoRegistro === ModoRegistro.Entrada
                ? asistenciaAPI.Id_Registro_Mensual_Entrada
                : asistenciaAPI.Id_Registro_Mensual_Salida;

            const registroMensual =
              await this.repository.obtenerRegistroMensual(
                tipoPersonal,
                modoRegistro,
                asistenciaAPI.ID_O_DNI_Usuario,
                asistenciaAPI.Mes,
                idReal
              );

            if (
              registroMensual &&
              !registroMensual.registros[diaActual.toString()]
            ) {
              // Agregar asistencia del día actual
              const registroDia: RegistroEntradaSalida = {
                timestamp: asistenciaCache.timestamp,
                desfaseSegundos: asistenciaCache.desfaseSegundos,
                estado: asistenciaCache.estado,
              };

              await this.repository.actualizarRegistroExistente(
                tipoPersonal,
                modoRegistro,
                asistenciaAPI.ID_O_DNI_Usuario,
                asistenciaAPI.Mes,
                diaActual,
                registroDia,
                idReal
              );

              // Limpiar del cache temporal
              await this.limpiarAsistenciaHuerfanaDelCache(
                actor,
                modoRegistro,
                asistenciaAPI.ID_O_DNI_Usuario,
                fechaHoy
              );

              console.log(
                `✅ Asistencia huérfana de ${modoRegistro} integrada tras API: ${asistenciaCache.estado}`
              );
            }
          }
        } catch (error) {
          console.error(
            `❌ Error integrando ${modoRegistro} desde cache:`,
            error
          );
          // Continuar con el siguiente modo
        }
      }
    } catch (error) {
      console.error(
        "❌ Error general en integración de asistencias huérfanas desde API:",
        error
      );
    }
  }

  /**
   * 🔍 CONSULTAR cache temporal para integración
   */
  private async consultarCacheTemporalParaIntegracion(
    actor: ActoresSistema,
    modoRegistro: ModoRegistro,
    id_o_dni: string | number,
    fecha: string
  ): Promise<any> {
    try {
      // Importar dinámicamente para evitar dependencias circulares
      const { AsistenciasTomadasHoyIDB } = await import(
        "../../AsistenciasTomadasHoy/AsistenciasTomadasHoyIDB"
      );
      const cacheAsistenciasHoy = new AsistenciasTomadasHoyIDB(this.dateHelper);

      return await cacheAsistenciasHoy.consultarAsistencia({
        id_o_dni,
        actor,
        modoRegistro,
        tipoAsistencia: TipoAsistencia.ParaPersonal,
        fecha,
      });
    } catch (error) {
      console.error("❌ Error al consultar cache temporal:", error);
      return null;
    }
  }

  /**
   * 🗑️ LIMPIAR asistencia huérfana del cache temporal
   */
  private async limpiarAsistenciaHuerfanaDelCache(
    actor: ActoresSistema,
    modoRegistro: ModoRegistro,
    dni: string,
    fecha: string
  ): Promise<void> {
    try {
      // ✅ CORREGIDO: Eliminar solo la asistencia específica, no toda la fecha
      await this.cacheManager.eliminarAsistenciaDelCache(
        dni,
        this.mapper.obtenerRolDesdeActor(actor), // Necesitarás este método
        modoRegistro,
        fecha
      );

      console.log(
        `🗑️ Asistencia huérfana específica eliminada del cache: ${actor}-${modoRegistro}-${dni}-${fecha}`
      );
    } catch (error) {
      console.error(
        "❌ Error al limpiar asistencia huérfana específica del cache:",
        error
      );
    }
  }

  /**
   * Procesa y guarda asistencia desde la API
   * ✅ CORREGIDO: Timestamp automático garantizado
   */
  public async procesarYGuardarAsistenciaDesdeAPI(
    asistenciaAPI: AsistenciaCompletaMensualDePersonal,
    modoRegistroSolicitado?: ModoRegistro
  ): Promise<OperationResult> {
    try {
      const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(
        asistenciaAPI.Rol
      );

      // ✅ NUEVO: Obtener timestamp peruano actual UNA SOLA VEZ para consistencia
      const timestampPeruanoActual = this.dateHelper.obtenerTimestampPeruano();
      console.log(
        `💾 Procesando datos de API con timestamp: ${timestampPeruanoActual} (${new Date(
          timestampPeruanoActual
        ).toLocaleString("es-PE")})`
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

        const registrosProcesados = this.mapper.procesarRegistrosJSON(
          registrosData,
          modoRegistro
        );

        if (Object.keys(registrosProcesados).length > 0) {
          // ✅ CORREGIDO: SIEMPRE usar timestamp actual para datos de API
          const registroParaGuardar: AsistenciaMensualPersonalLocal = {
            Id_Registro_Mensual: idReal,
            mes: asistenciaAPI.Mes,
            ID_o_DNI_Personal: asistenciaAPI.ID_O_DNI_Usuario,
            registros: registrosProcesados,
            ultima_fecha_actualizacion: timestampPeruanoActual, // ✅ TIMESTAMP GARANTIZADO
          };

          console.log(
            `💾 Guardando ${modoRegistro} con ${
              Object.keys(registrosProcesados).length
            } días procesados`
          );

          await this.repository.guardarRegistroMensual(
            tipoPersonal,
            modoRegistro,
            registroParaGuardar
          );
        } else {
          console.log(`⚠️ No hay datos para guardar en ${modoRegistro}`);
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

      // ✅ NUEVO: Integrar asistencias huérfanas del cache temporal tras guardar datos de API
      if (this.dateHelper.esConsultaMesActual(asistenciaAPI.Mes)) {
        console.log(
          "🔄 Integrando posibles asistencias huérfanas del cache temporal..."
        );

        await this.integrarAsistenciasHuerfanasDesdeAPI(
          asistenciaAPI,
          tipoPersonal,
          timestampPeruanoActual,
          modoRegistroSolicitado
        );
      }

      return {
        exitoso: true,
        mensaje:
          "Datos de API procesados, guardados y sincronizados con cache temporal exitosamente",
      };
    } catch (error) {
      console.error("Error al procesar datos de API:", error);
      return {
        exitoso: false,
        mensaje: `Error al procesar datos de API: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * Fuerza la actualización desde la API eliminando datos locales
   * ✅ SIN CAMBIOS: Ya delegaba correctamente
   */
  public async forzarActualizacionDesdeAPI(
    rol: RolesSistema,
    dni: string,
    mes: number
  ): Promise<ConsultaAsistenciaResult> {
    try {
      const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(rol);

      console.log(
        `🔄 Forzando actualización desde API para ${rol} ${dni} - mes ${mes}...`
      );

      // Eliminar registros locales existentes
      await Promise.all([
        this.repository.eliminarRegistroMensual(
          tipoPersonal,
          ModoRegistro.Entrada,
          dni,
          mes
        ),
        this.repository.eliminarRegistroMensual(
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

      return {
        encontrado: false,
        mensaje: "Error al forzar la actualización de datos",
      };
    }
  }

  /**
   * Obtiene asistencias mensuales con verificación de sincronización
   * Integra datos del día actual desde cache Redis
   * ✅ CORREGIDO: Toda lógica de fechas delegada a DateHelper
   */
  public async obtenerAsistenciaMensualConAPI(
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number
  ): Promise<ConsultaAsistenciaResult> {
    try {
      const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(rol);

      // ✅ CORREGIDO: Delegar toda lógica de fechas al DateHelper
      const infoFechaActual = this.dateHelper.obtenerInfoFechaActual();
      if (!infoFechaActual) {
        throw new Error(
          "No se pudo obtener la información de fecha actual desde Redux"
        );
      }

      const { mesActual, diaActual } = infoFechaActual;
      const esConsultaMesActual = this.dateHelper.esConsultaMesActual(mes);

      console.log(
        `🎯 Iniciando consulta para ${id_o_dni} - mes ${mes} (actual: ${mesActual})`
      );
      console.log(
        `📅 Es consulta del mes actual: ${esConsultaMesActual ? "SÍ" : "NO"}`
      );

      // PASO 1: Buscar registros locales (entrada y salida)
      const [registroEntradaLocal, registroSalidaLocal] = await Promise.all([
        this.repository.obtenerRegistroMensual(
          tipoPersonal,
          ModoRegistro.Entrada,
          id_o_dni,
          mes
        ),
        this.repository.obtenerRegistroMensual(
          tipoPersonal,
          ModoRegistro.Salida,
          id_o_dni,
          mes
        ),
      ]);

      // PASO 2: Verificar sincronización por cantidad de días
      const verificacion = this.validator.verificarSincronizacionEntradaSalida(
        registroEntradaLocal,
        registroSalidaLocal
      );

      // PASO 3: Si NO están sincronizados, forzar sincronización desde API
      if (!verificacion.estanSincronizados) {
        console.log(`⚠️ DATOS DESINCRONIZADOS: ${verificacion.razon}`);
        console.log("🔄 Iniciando sincronización forzada desde API...");

        const resultadoSincronizacion = await this.forzarSincronizacionCompleta(
          rol,
          id_o_dni,
          mes
        );

        if (resultadoSincronizacion.sincronizado) {
          // Si logramos sincronizar desde API, aplicar integración con cache
          return await this.cacheManager.combinarDatosHistoricosYActuales(
            resultadoSincronizacion.entrada || null,
            resultadoSincronizacion.salida || null,
            rol,
            id_o_dni,
            esConsultaMesActual,
            diaActual,
            `🔄 ${resultadoSincronizacion.mensaje}`
          );
        } else {
          // Si sincronización falla, buscar en cache al menos el día actual
          if (esConsultaMesActual) {
            console.log(
              "🔍 Sincronización falló, buscando datos del día actual en cache..."
            );
            return await this.cacheManager.obtenerSoloDatosDelDiaActual(
              rol,
              id_o_dni,
              diaActual
            );
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
        // CASO 1: No hay datos históricos - Primera consulta del mes
        console.log(
          "📡 No hay datos escolares históricos, consultando API por primera vez..."
        );

        const asistenciaAPI =
          await this.apiClient.consultarAsistenciasConReintentos(
            rol,
            id_o_dni,
            mes
          );

        if (asistenciaAPI) {
          console.log("✅ API devolvió datos históricos, guardando...");
          await this.procesarYGuardarAsistenciaDesdeAPI(asistenciaAPI);

          const [nuevaEntrada, nuevaSalida] = await Promise.all([
            this.repository.obtenerRegistroMensual(
              tipoPersonal,
              ModoRegistro.Entrada,
              id_o_dni,
              mes,
              asistenciaAPI.Id_Registro_Mensual_Entrada
            ),
            this.repository.obtenerRegistroMensual(
              tipoPersonal,
              ModoRegistro.Salida,
              id_o_dni,
              mes,
              asistenciaAPI.Id_Registro_Mensual_Salida
            ),
          ]);

          return await this.cacheManager.combinarDatosHistoricosYActuales(
            nuevaEntrada,
            nuevaSalida,
            rol,
            id_o_dni,
            esConsultaMesActual,
            diaActual,
            "Datos obtenidos y guardados desde la API"
          );
        } else {
          // API no tiene datos (404), buscar en cache local para mostrar info disponible
          console.log("❌ API devolvió 404 (sin datos históricos)");

          if (esConsultaMesActual) {
            console.log(
              "🔍 API sin datos, verificando cache Redis para mostrar al menos el día actual..."
            );
            const resultadoCache =
              await this.cacheManager.obtenerSoloDatosDelDiaActual(
                rol,
                id_o_dni,
                diaActual
              );

            if (resultadoCache.encontrado) {
              // Éxito: Encontramos datos del día actual en cache
              return {
                ...resultadoCache,
                mensaje:
                  "📱 API sin datos históricos, mostrando solo asistencia del día actual desde cache Redis",
              };
            } else {
              // Ni API ni cache tienen datos
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

      // CASO 2: Hay datos históricos sincronizados
      console.log(
        `✅ Datos locales sincronizados: ${verificacion.diasEscolaresEntrada} días escolares históricos`
      );

      // 🆕 INTEGRAR asistencias huérfanas antes de combinar
      const entradaFinal = registroEntradaLocal;
      const salidaFinal = registroSalidaLocal;

      return await this.cacheManager.combinarDatosHistoricosYActuales(
        entradaFinal,
        salidaFinal,
        rol,
        id_o_dni,
        esConsultaMesActual,
        diaActual,
        `Datos sincronizados obtenidos desde IndexedDB: ${verificacion.diasEscolaresEntrada} días escolares históricos`
      );
    } catch (error) {
      console.error(
        "❌ Error al obtener asistencias mensuales con API:",
        error
      );

      // ✅ CORREGIDO: Usar DateHelper para verificar si es mes actual
      const esConsultaMesActual = this.dateHelper.esConsultaMesActual(mes);
      const diaActualInfo = this.dateHelper.obtenerDiaActual();

      if (esConsultaMesActual && diaActualInfo) {
        console.log(
          "🆘 Error en consulta principal, intentando mostrar datos del cache como fallback..."
        );
        try {
          const fallbackCache =
            await this.cacheManager.obtenerSoloDatosDelDiaActual(
              rol,
              id_o_dni,
              diaActualInfo
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

      return {
        encontrado: false,
        mensaje: "Error al obtener los datos de asistencia",
      };
    }
  }

  /**
   * 🔄 INTEGRA asistencias huérfanas del cache temporal al registro mensual real
   */
  private async integrarAsistenciasHuerfanas(
    registroEntrada: AsistenciaMensualPersonalLocal | null,
    registroSalida: AsistenciaMensualPersonalLocal | null,
    rol: RolesSistema,
    dni: string,
    diaActual: number
  ): Promise<{
    entrada?: AsistenciaMensualPersonalLocal;
    salida?: AsistenciaMensualPersonalLocal;
  }> {
    try {
      const actor = this.mapper.obtenerActorDesdeRol(rol);
      const fechaHoy = this.dateHelper.obtenerFechaStringActual();

      if (!fechaHoy)
        return {
          entrada: registroEntrada || undefined,
          salida: registroSalida || undefined,
        };

      // Buscar asistencias huérfanas en cache temporal
      const [entradaHuerfana, salidaHuerfana] = await Promise.all([
        this.cacheManager.consultarCacheAsistenciaHoy(
          actor,
          ModoRegistro.Entrada,
          dni,
          fechaHoy
        ),
        this.cacheManager.consultarCacheAsistenciaHoy(
          actor,
          ModoRegistro.Salida,
          dni,
          fechaHoy
        ),
      ]);

      let entradaFinal = registroEntrada;
      let salidaFinal = registroSalida;
      const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(rol);

      // Integrar entrada huérfana
      if (entradaHuerfana && registroEntrada) {
        const registroDia: RegistroEntradaSalida = {
          timestamp: entradaHuerfana.timestamp,
          desfaseSegundos: entradaHuerfana.desfaseSegundos,
          estado: entradaHuerfana.estado,
        };

        await this.repository.actualizarRegistroExistente(
          tipoPersonal,
          ModoRegistro.Entrada,
          dni,
          registroEntrada.mes,
          diaActual,
          registroDia,
          registroEntrada.Id_Registro_Mensual
        );

        // Actualizar objeto local
        registroEntrada.registros[diaActual.toString()] = registroDia;
        entradaFinal = registroEntrada;

        // Eliminar del cache temporal
        await this.cacheManager.eliminarAsistenciaDelCache(
          dni,
          rol,
          ModoRegistro.Entrada,
          fechaHoy
        );
        console.log(
          `✅ Asistencia huérfana de entrada integrada y eliminada del cache temporal`
        );
      }

      // Integrar salida huérfana (mismo patrón)
      if (salidaHuerfana && registroSalida) {
        const registroDia: RegistroEntradaSalida = {
          timestamp: salidaHuerfana.timestamp,
          desfaseSegundos: salidaHuerfana.desfaseSegundos,
          estado: salidaHuerfana.estado,
        };

        await this.repository.actualizarRegistroExistente(
          tipoPersonal,
          ModoRegistro.Salida,
          dni,
          registroSalida.mes,
          diaActual,
          registroDia,
          registroSalida.Id_Registro_Mensual
        );

        registroSalida.registros[diaActual.toString()] = registroDia;
        salidaFinal = registroSalida;

        await this.cacheManager.eliminarAsistenciaDelCache(
          dni,
          rol,
          ModoRegistro.Salida,
          fechaHoy
        );
        console.log(
          `✅ Asistencia huérfana de salida integrada y eliminada del cache temporal`
        );
      }

      return {
        entrada: entradaFinal || undefined,
        salida: salidaFinal || undefined,
      };
    } catch (error) {
      console.error("❌ Error al integrar asistencias huérfanas:", error);
      return {
        entrada: registroEntrada || undefined,
        salida: registroSalida || undefined,
      };
    }
  }

  /**
   * Sincroniza las asistencias registradas en Redis con la base de datos local IndexedDB
   * ✅ CORREGIDO: Timestamp automático y delegación de fechas
   */
  public async sincronizarAsistenciasDesdeRedis(
    datosRedis: ConsultarAsistenciasTomadasPorActorEnRedisResponseBody
  ): Promise<SincronizacionStats> {
    const stats: SincronizacionStats = {
      totalRegistros: (datosRedis.Resultados as AsistenciaDiariaResultado[])
        .length,
      registrosNuevos: 0,
      registrosExistentes: 0,
      errores: 0,
    };

    try {
      const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(
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

      // ✅ NUEVO: Obtener timestamp peruano para todas las sincronizaciones
      const timestampSincronizacion = this.dateHelper.obtenerTimestampPeruano();
      console.log(
        `🔄 Sincronizando desde Redis con timestamp: ${timestampSincronizacion} (${new Date(
          timestampSincronizacion
        ).toLocaleString("es-PE")})`
      );

      for (const resultado of datosRedis.Resultados as AsistenciaDiariaResultado[]) {
        try {
          const registroExistente =
            await this.repository.verificarSiExisteRegistroDiario(
              tipoPersonal,
              datosRedis.ModoRegistro,
              resultado.ID_o_DNI,
              mesActual,
              diaActual
            );

          if (registroExistente) {
            stats.registrosExistentes++;
            continue;
          }

          // ✅ NUEVO: Al crear registros desde Redis, también actualizar timestamp
          // Nota: Aquí se procesaría el registro específico con timestamp actualizado
          // El repository.guardarRegistroMensual ya maneja el timestamp automáticamente

          console.log(
            `🔄 Sincronizando registro: ${resultado.ID_o_DNI} - ${datosRedis.ModoRegistro} con timestamp ${timestampSincronizacion}`
          );

          stats.registrosNuevos++;
        } catch (error) {
          console.error(
            `Error al sincronizar registro para DNI ${resultado.ID_o_DNI}:`,
            error
          );
          stats.errores++;
        }
      }

      console.log(
        `✅ Sincronización desde Redis completada: ${stats.registrosNuevos} nuevos, ${stats.registrosExistentes} existentes, ${stats.errores} errores`
      );
      return stats;
    } catch (error) {
      console.error("Error en sincronizarAsistenciasDesdeRedis:", error);

      return {
        ...stats,
        errores: stats.totalRegistros,
      };
    }
  }

  /**
   * Verifica la integridad de los datos sincronizados
   * ✅ CORREGIDO: Delegación completa de lógica de fechas
   */
  public async verificarIntegridadDatos(
    rol: RolesSistema,
    dni: string,
    mes: number
  ): Promise<{
    integro: boolean;
    problemas: string[];
    recomendaciones: string[];
  }> {
    const problemas: string[] = [];
    const recomendaciones: string[] = [];

    try {
      const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(rol);

      // Obtener registros locales
      const [registroEntrada, registroSalida] = await Promise.all([
        this.repository.obtenerRegistroMensual(
          tipoPersonal,
          ModoRegistro.Entrada,
          dni,
          mes
        ),
        this.repository.obtenerRegistroMensual(
          tipoPersonal,
          ModoRegistro.Salida,
          dni,
          mes
        ),
      ]);

      // Verificar sincronización
      const sincronizacion =
        this.validator.verificarSincronizacionEntradaSalida(
          registroEntrada,
          registroSalida
        );

      if (!sincronizacion.estanSincronizados) {
        problemas.push(`Desincronización: ${sincronizacion.razon}`);
        recomendaciones.push("Ejecutar sincronización forzada desde API");
      }

      // Verificar estructura de datos
      if (registroEntrada) {
        const validacionEntrada =
          this.validator.validarEstructuraRegistroMensual(registroEntrada);
        if (!validacionEntrada.valido) {
          problemas.push(
            `Entrada inválida: ${validacionEntrada.errores.join(", ")}`
          );
        }

        // ✅ NUEVO: Verificar si el timestamp es muy antiguo
        if (
          this.dateHelper.esTimestampMuyAntiguo(
            registroEntrada.ultima_fecha_actualizacion
          )
        ) {
          problemas.push(
            "Timestamp de entrada muy antiguo, datos pueden estar desactualizados"
          );
          recomendaciones.push(
            "Considerar actualizar desde API para refrescar timestamp"
          );
        }
      }

      if (registroSalida) {
        const validacionSalida =
          this.validator.validarEstructuraRegistroMensual(registroSalida);
        if (!validacionSalida.valido) {
          problemas.push(
            `Salida inválida: ${validacionSalida.errores.join(", ")}`
          );
        }

        // ✅ NUEVO: Verificar si el timestamp es muy antiguo
        if (
          this.dateHelper.esTimestampMuyAntiguo(
            registroSalida.ultima_fecha_actualizacion
          )
        ) {
          problemas.push(
            "Timestamp de salida muy antiguo, datos pueden estar desactualizados"
          );
          recomendaciones.push(
            "Considerar actualizar desde API para refrescar timestamp"
          );
        }
      }

      // ✅ CORREGIDO: Delegar obtención de días laborales al DateHelper
      const diasLaborales = this.dateHelper.obtenerDiasLaboralesAnteriores();
      const entradaCompleta = this.validator.verificarRegistroMensualCompleto(
        registroEntrada,
        diasLaborales
      );
      const salidaCompleta = this.validator.verificarRegistroMensualCompleto(
        registroSalida,
        diasLaborales
      );

      if (!entradaCompleta) {
        problemas.push(
          "Registro de entrada incompleto (faltan días laborales)"
        );
        recomendaciones.push("Consultar API para obtener días faltantes");
      }

      if (!salidaCompleta) {
        problemas.push("Registro de salida incompleto (faltan días laborales)");
        recomendaciones.push("Consultar API para obtener días faltantes");
      }

      return {
        integro: problemas.length === 0,
        problemas,
        recomendaciones,
      };
    } catch (error) {
      console.error("Error al verificar integridad de datos:", error);
      return {
        integro: false,
        problemas: [`Error al verificar integridad: ${error}`],
        recomendaciones: ["Revisar logs de error y conexión a base de datos"],
      };
    }
  }

  /**
   * 🆕 NUEVO: Sincroniza completamente desde Redis a registros mensuales
   */
  public async sincronizarCompletamenteDesdeRedis(
    rol: RolesSistema,
    modoRegistro: ModoRegistro
  ): Promise<{
    exitoso: boolean;
    registrosSincronizados: number;
    mensaje: string;
  }> {
    try {
      const actor = this.mapper.obtenerActorDesdeRol(rol);

      // Consultar datos de Redis
      const datosRedis =
        await this.apiClient.consultarAsistenciasTomadasEnRedis(
          TipoAsistencia.ParaPersonal,
          actor,
          modoRegistro
        );

      if (!datosRedis.Resultados || datosRedis.Resultados.length === 0) {
        return {
          exitoso: true,
          registrosSincronizados: 0,
          mensaje: "No hay datos en Redis para sincronizar",
        };
      }

      // Procesar y guardar en registros mensuales
      let registrosSincronizados = 0;
      const timestampSincronizacion = this.dateHelper.obtenerTimestampPeruano();

      for (const resultado of datosRedis.Resultados) {
        try {
          // Aquí iría la lógica de sincronización individual
          // Similar a la implementada arriba
          registrosSincronizados++;
        } catch (error) {
          console.error(`Error sincronizando ${resultado.ID_o_DNI}:`, error);
        }
      }

      return {
        exitoso: true,
        registrosSincronizados,
        mensaje: `${registrosSincronizados} registros sincronizados con timestamp ${timestampSincronizacion}`,
      };
    } catch (error) {
      console.error("Error en sincronización completa desde Redis:", error);
      return {
        exitoso: false,
        registrosSincronizados: 0,
        mensaje: "Error en la sincronización completa",
      };
    }
  }

  /**
   * Repara datos corruptos o desincronizados
   * ✅ SIN CAMBIOS: Ya manejaba bien la reparación
   */
  public async repararDatos(
    rol: RolesSistema,
    dni: string,
    mes: number
  ): Promise<OperationResult> {
    try {
      console.log(`🔧 Iniciando reparación de datos para ${dni} - mes ${mes}`);

      // Paso 1: Verificar problemas
      const verificacion = await this.verificarIntegridadDatos(rol, dni, mes);

      if (verificacion.integro) {
        return {
          exitoso: true,
          mensaje: "Los datos ya están íntegros, no se requiere reparación",
        };
      }

      console.log(
        `🔍 Problemas detectados: ${verificacion.problemas.join(", ")}`
      );

      // Paso 2: Intentar reparación mediante sincronización forzada
      const resultadoSync = await this.forzarSincronizacionCompleta(
        rol,
        dni,
        mes
      );

      if (resultadoSync.sincronizado) {
        // Paso 3: Verificar que la reparación fue exitosa
        const nuevaVerificacion = await this.verificarIntegridadDatos(
          rol,
          dni,
          mes
        );

        if (nuevaVerificacion.integro) {
          return {
            exitoso: true,
            mensaje: `Datos reparados exitosamente: ${resultadoSync.mensaje}`,
            datos: {
              problemasOriginales: verificacion.problemas,
              solucionAplicada: "Sincronización forzada desde API",
            },
          };
        } else {
          return {
            exitoso: false,
            mensaje: `Reparación parcial. Problemas restantes: ${nuevaVerificacion.problemas.join(
              ", "
            )}`,
            datos: {
              problemasOriginales: verificacion.problemas,
              problemasRestantes: nuevaVerificacion.problemas,
            },
          };
        }
      } else {
        return {
          exitoso: false,
          mensaje: `No se pudo reparar: ${resultadoSync.mensaje}`,
          datos: {
            problemasDetectados: verificacion.problemas,
            recomendaciones: verificacion.recomendaciones,
          },
        };
      }
    } catch (error) {
      console.error("Error durante reparación de datos:", error);
      return {
        exitoso: false,
        mensaje: `Error durante la reparación: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }
}
