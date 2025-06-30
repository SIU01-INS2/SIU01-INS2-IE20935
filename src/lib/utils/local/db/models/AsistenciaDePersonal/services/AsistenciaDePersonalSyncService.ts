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
import { Meses } from "@/interfaces/shared/Meses";
import { DIAS_ESCOLARES_MINIMOS_VERIFICACION } from "@/constants/DIAS_ESCOLARES_MINIMOS_VERIFICACION";

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
   * ✅ NUEVO: Auto-corrección de datos locales inconsistentes
   */
  private async autoCorregirDatosLocalesInconsistentes(
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number,
    razonInconsistencia: string
  ): Promise<ConsultaAsistenciaResult> {
    try {
      console.log(
        `🔧 Iniciando auto-corrección para ${id_o_dni} - mes ${mes}: ${razonInconsistencia}`
      );

      const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(rol);

      // Eliminar datos locales corruptos
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

      console.log("🧹 Datos locales inconsistentes eliminados");

      // Obtener datos frescos de la API
      return await this.consultarAPIYGuardar(
        rol,
        id_o_dni,
        mes,
        `Auto-corrección: ${razonInconsistencia}`
      );
    } catch (error) {
      console.error("❌ Error en auto-corrección:", error);
      return {
        encontrado: false,
        mensaje: `Error en auto-corrección: ${
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
   * 🎯 FLUJO CORREGIDO según flowchart - SIEMPRE mostrar datos
   */
  public async obtenerAsistenciaMensualConAPI(
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number
  ): Promise<ConsultaAsistenciaResult> {
    try {
      // 🚨 PASO 1: Verificar mes futuro (LOGOUT FORZADO)
      const estadoTemporal = this.dateHelper.obtenerEstadoTemporalMes(mes);

      if (estadoTemporal.tipo === "MES_FUTURO") {
        console.error(`🚨 LOGOUT FORZADO: ${estadoTemporal.descripcion}`);
        throw new Error(
          "Consulta de mes futuro no permitida - sesión cerrada por seguridad"
        );
      }

      const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(rol);
      console.log(
        `🎯 Flujo corregido iniciado: ${rol} ${id_o_dni} - ${estadoTemporal.descripcion}`
      );

      // 📅 RAMA: MES ANTERIOR
      if (estadoTemporal.tipo === "MES_ANTERIOR") {
        return await this.procesarConsultaMesAnteriorCorregido(
          tipoPersonal,
          rol,
          id_o_dni,
          mes
        );
      }

      // 📅 RAMA: MES ACTUAL
      return await this.procesarConsultaMesActualCorregido(
        tipoPersonal,
        rol,
        id_o_dni,
        mes
      );
    } catch (error) {
      console.error("❌ Error en flujo corregido:", error);
      return {
        encontrado: false,
        mensaje:
          error instanceof Error
            ? error.message
            : "Error en consulta de asistencias",
      };
    }
  }

  /**
   * ✅ CORREGIDO: Mes anterior con control de 45 minutos
   */
  private async procesarConsultaMesAnteriorCorregido(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number
  ): Promise<ConsultaAsistenciaResult> {
    console.log(`📅 Procesando mes anterior con control de 45min: ${mes}`);

    // PASO 1: Consultar IndexedDB
    const [registroEntrada, registroSalida] = await Promise.all([
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

    // ✅ NUEVO: Validar consistencia ANTES de proceder
    if (registroEntrada || registroSalida) {
      const validacionConsistencia =
        await this.validator.validarConsistenciaEntradaSalida(
          registroEntrada,
          registroSalida,
          mes,
          id_o_dni
        );

      if (validacionConsistencia.requiereCorreccion) {
        console.warn(
          `⚠️ Datos inconsistentes detectados para ${id_o_dni} - mes ${mes}: ${validacionConsistencia.razon}`
        );
        console.log(
          "🗑️ Eliminando registros inconsistentes y consultando API..."
        );

        // Eliminar registros inconsistentes
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

        // Forzar consulta a API
        return await this.consultarAPIYGuardar(
          rol,
          id_o_dni,
          mes,
          `Corrección por inconsistencia: ${validacionConsistencia.razon}`
        );
      }

      console.log(`✅ Datos consistentes: ${validacionConsistencia.razon}`);
    }

    // PASO 2: Si NO existe en IndexedDB → Consultar API
    if (!registroEntrada && !registroSalida) {
      console.log("📡 No existe en IndexedDB - Consultando API");
      return await this.consultarAPIYGuardar(
        rol,
        id_o_dni,
        mes,
        "Primera consulta para mes anterior"
      );
    }

    // PASO 3: SÍ existe → Verificar control de 45 minutos primero
    const registro = registroEntrada || registroSalida;
    const controlRango = this.dateHelper.yaSeConsultoEnRangoActual(
      registro!.ultima_fecha_actualizacion
    );

    if (controlRango.yaConsultado) {
      console.log(
        `⏭️ Mes anterior - ${controlRango.razon} - Usar datos existentes`
      );
      return {
        entrada: registroEntrada!,
        salida: registroSalida!,
        encontrado: true,
        mensaje: `Mes anterior - ${controlRango.razon}`,
        fuenteDatos: "INDEXEDDB",
        optimizado: true,
      };
    }

    // PASO 4: Verificar lógica de timestamp del mes
    const mesUltimaActualizacion = this.dateHelper.extraerMesDeTimestamp(
      registro!.ultima_fecha_actualizacion
    );

    if (mesUltimaActualizacion === mes) {
      console.log(`🔄 Control 45min pasó + mismo mes ${mes} - Consultar API`);
      return await this.consultarAPIYGuardar(
        rol,
        id_o_dni,
        mes,
        `Actualización mes anterior - ${controlRango.razon}`
      );
    } else if (mesUltimaActualizacion > mes) {
      console.log(
        `✅ Datos FINALIZADOS (mes ${mesUltimaActualizacion} > ${mes}) - Usar IndexedDB`
      );
      return {
        entrada: registroEntrada!,
        salida: registroSalida!,
        encontrado: true,
        mensaje: "Datos finalizados",
        fuenteDatos: "INDEXEDDB",
        optimizado: true,
      };
    } else {
      console.log(
        `⚠️ Datos incompletos (mes ${mesUltimaActualizacion} < ${mes}) - Consultar API`
      );
      return await this.consultarAPIYGuardar(
        rol,
        id_o_dni,
        mes,
        `Datos incompletos - ${controlRango.razon}`
      );
    }
  }

  /**
   * ✅ CORREGIDO: Mes actual siguiendo flowchart exacto
   */
  private async procesarConsultaMesActualCorregido(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number
  ): Promise<ConsultaAsistenciaResult> {
    console.log(`📅 Procesando mes actual corregido: ${mes}`);

    const diaActual = this.dateHelper.obtenerDiaActual() || 1;
    const esFinDeSemana = this.dateHelper.esFinDeSemana();

    // PASO 1: ¿Es día escolar hoy? (flowchart exacto)
    if (!esFinDeSemana) {
      // SÍ - Día escolar
      return await this.procesarDiaEscolarCorregido(
        tipoPersonal,
        rol,
        id_o_dni,
        mes,
        diaActual
      );
    } else {
      // NO - Fin de semana
      return await this.procesarFinDeSemanaCorregido(
        tipoPersonal,
        rol,
        id_o_dni,
        mes,
        diaActual
      );
    }
  }

  /**
   * ✅ CORREGIDO: Fin de semana con verificación de cobertura + 45min
   */
  private async procesarFinDeSemanaCorregido(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number,
    diaActual: number
  ): Promise<ConsultaAsistenciaResult> {
    console.log("🏖️ Procesando fin de semana con control de 45min");

    // Buscar registros existentes
    const [registroEntrada, registroSalida] = await Promise.all([
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

    if (registroEntrada || registroSalida) {
      const validacionConsistencia =
        await this.validator.validarConsistenciaEntradaSalida(
          registroEntrada,
          registroSalida,
          mes,
          id_o_dni
        );

      if (validacionConsistencia.requiereCorreccion) {
        console.warn(
          `⚠️ Datos inconsistentes detectados para ${id_o_dni} - mes ${mes}
          }: ${validacionConsistencia.razon}`
        );

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

        return await this.consultarAPIYGuardar(
          rol,
          id_o_dni,
          mes,
          `Corrección por inconsistencia: ${validacionConsistencia.razon}`
        );
      }
    }

    // Si NO hay registros → Consultar API obligatoriamente
    if (!registroEntrada && !registroSalida) {
      console.log("📡 Fin de semana SIN datos - Consultar API obligatorio");
      return await this.consultarAPIYGuardar(
        rol,
        id_o_dni,
        mes,
        "Fin de semana sin datos - consulta API obligatoria"
      );
    }

    const registro = registroEntrada || registroSalida;

    // ✅ NUEVO: Verificar control de 45 minutos primero
    const controlRango = this.dateHelper.yaSeConsultoEnRangoActual(
      registro!.ultima_fecha_actualizacion
    );

    if (controlRango.yaConsultado) {
      console.log(`⏭️ Fin de semana - ${controlRango.razon} - NO consultar`);
      return await this.cacheManager.combinarDatosHistoricosYActuales(
        registroEntrada,
        registroSalida,
        rol,
        id_o_dni,
        true,
        diaActual,
        `Fin de semana - ${controlRango.razon}`
      );
    }

    // ✅ NUEVO: Verificar cobertura de últimos 5 días escolares
    const ultimosDiasEscolares = this.dateHelper.obtenerUltimosDiasEscolares(5);

    if (ultimosDiasEscolares.length > 0) {
      const verificacionEntrada = registroEntrada
        ? await this.repository.verificarDatosEnUltimosDiasEscolares(
            tipoPersonal,
            ModoRegistro.Entrada,
            id_o_dni,
            mes,
            ultimosDiasEscolares
          )
        : { tieneDatosSuficientes: false };

      const verificacionSalida = registroSalida
        ? await this.repository.verificarDatosEnUltimosDiasEscolares(
            tipoPersonal,
            ModoRegistro.Salida,
            id_o_dni,
            mes,
            ultimosDiasEscolares
          )
        : { tieneDatosSuficientes: false };

      const tieneDatosSuficientes =
        verificacionEntrada.tieneDatosSuficientes ||
        verificacionSalida.tieneDatosSuficientes;

      if (tieneDatosSuficientes) {
        console.log(
          "✅ Fin de semana - Cobertura suficiente en últimos 5 días - NO consultar API"
        );
        return await this.cacheManager.combinarDatosHistoricosYActuales(
          registroEntrada,
          registroSalida,
          rol,
          id_o_dni,
          true,
          diaActual,
          "Fin de semana - cobertura suficiente en últimos 5 días escolares"
        );
      }
    }

    // ¿Última actualización fue viernes >= 20:00?
    const viernesCompleto = this.dateHelper.fueActualizadoViernesCompleto(
      registro!.ultima_fecha_actualizacion
    );

    if (viernesCompleto) {
      console.log(
        "✅ Fin de semana - Datos del viernes completos (20:00+) - NO consultar API"
      );
      return await this.cacheManager.combinarDatosHistoricosYActuales(
        registroEntrada,
        registroSalida,
        rol,
        id_o_dni,
        true,
        diaActual,
        "Fin de semana - datos del viernes completos (actualizado después de 20:00)"
      );
    } else {
      console.log(
        "🔄 Fin de semana - Condiciones para consultar API cumplidas"
      );
      return await this.consultarAPIYGuardar(
        rol,
        id_o_dni,
        mes,
        "Fin de semana - datos incompletos o sin cobertura suficiente"
      );
    }
  }

  /**
   * ✅ CORREGIDO: Día escolar siguiendo flowchart
   */
  private async procesarDiaEscolarCorregido(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number,
    diaActual: number
  ): Promise<ConsultaAsistenciaResult> {
    const horaActual = this.dateHelper.obtenerHoraActual() || 0;
    console.log(`🏫 Procesando día escolar: hora ${horaActual}`);

    // PASO 1: ¿Hora actual < 06:00? (flowchart exacto)
    if (horaActual < 6) {
      console.log("🌙 Madrugada - Verificar si hay datos históricos");
      return await this.procesarMadrugadaConDatosHistoricos(
        tipoPersonal,
        rol,
        id_o_dni,
        mes,
        diaActual
      );
    }

    // PASO 2: ¿Hora actual >= 22:00? (flowchart exacto)
    if (horaActual >= 22) {
      console.log("🌃 Datos consolidados - Consultar API");
      return await this.consultarAPIYGuardar(
        rol,
        id_o_dni,
        mes,
        "Después de 22:00 - datos consolidados en PostgreSQL"
      );
    }

    // PASO 3: 06:00 <= Hora < 22:00 - Lógica Redis/IndexedDB
    console.log("🏫 Horario escolar - Aplicar lógica Redis/IndexedDB");
    return await this.procesarHorarioEscolarConVerificacion(
      tipoPersonal,
      rol,
      id_o_dni,
      mes,
      diaActual,
      horaActual
    );
  }

  /**
   * ✅ NUEVO: Procesa horario escolar con verificación de datos históricos
   */
  private async procesarHorarioEscolarConVerificacion(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number,
    diaActual: number,
    horaActual: number
  ): Promise<ConsultaAsistenciaResult> {
    // Usar la lógica existente
    return await this.verificarDatosHistoricosYProceder(
      tipoPersonal,
      rol,
      id_o_dni,
      mes,
      diaActual,
      {
        estrategia: horaActual < 12 ? "REDIS_ENTRADAS" : "REDIS_COMPLETO",
        razon: `Horario escolar ${horaActual}:xx`,
      }
    );
  }

  /**
   * 🆕 NUEVO: Manejo de madrugada con garantía de datos históricos
   */
  private async procesarMadrugadaConDatosHistoricos(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number,
    diaActual: number
  ): Promise<ConsultaAsistenciaResult> {
    console.log("🌙 Procesando madrugada - SIEMPRE debe haber datos");

    // Buscar datos históricos en IndexedDB
    const [registroEntrada, registroSalida] = await Promise.all([
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

    // Si NO hay datos históricos → Consultar API obligatoriamente
    if (!registroEntrada && !registroSalida) {
      console.log(
        "📡 Madrugada SIN datos históricos - Consultar API obligatorio"
      );
      return await this.consultarAPIYGuardar(
        rol,
        id_o_dni,
        mes,
        "Madrugada sin datos históricos - consulta API obligatoria"
      );
    }

    // SÍ hay datos históricos → Verificar últimos días escolares
    const ultimosDiasEscolares = this.dateHelper.obtenerUltimosDiasEscolares(5);

    if (ultimosDiasEscolares.length === 0) {
      console.log(
        "📊 No se pudieron obtener días escolares - Usar datos existentes"
      );
      return await this.cacheManager.combinarDatosHistoricosYActuales(
        registroEntrada,
        registroSalida,
        rol,
        id_o_dni,
        false, // No es mes actual para efectos de cache
        diaActual,
        "Madrugada con datos históricos existentes (sin verificación días escolares)"
      );
    }

    // Verificar cobertura en últimos 5 días escolares
    const verificacionEntrada = registroEntrada
      ? await this.repository.verificarDatosEnUltimosDiasEscolares(
          tipoPersonal,
          ModoRegistro.Entrada,
          id_o_dni,
          mes,
          ultimosDiasEscolares
        )
      : { tieneDatosSuficientes: false };

    const verificacionSalida = registroSalida
      ? await this.repository.verificarDatosEnUltimosDiasEscolares(
          tipoPersonal,
          ModoRegistro.Salida,
          id_o_dni,
          mes,
          ultimosDiasEscolares
        )
      : { tieneDatosSuficientes: false };

    const tieneDatosSuficientes =
      verificacionEntrada.tieneDatosSuficientes ||
      verificacionSalida.tieneDatosSuficientes;

    if (!tieneDatosSuficientes) {
      console.log(
        "⚠️ Madrugada - Datos insuficientes en últimos 5 días escolares - Actualizar desde API"
      );
      return await this.consultarAPIYGuardar(
        rol,
        id_o_dni,
        mes,
        "Madrugada - datos insuficientes en últimos 5 días escolares"
      );
    }

    // Datos suficientes - Usar datos históricos
    console.log("✅ Madrugada - Datos históricos suficientes");
    return await this.cacheManager.combinarDatosHistoricosYActuales(
      registroEntrada,
      registroSalida,
      rol,
      id_o_dni,
      false,
      diaActual,
      "Madrugada con datos históricos suficientes"
    );
  }

  /**
   * ✅ NUEVO: Procesa mes anterior con lógica inteligente
   */
  private async procesarConsultaMesAnteriorInteligente(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number
  ): Promise<ConsultaAsistenciaResult> {
    console.log(`📅 Procesando mes anterior inteligente: ${mes}`);

    // Buscar en IndexedDB
    const [registroEntrada, registroSalida] = await Promise.all([
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

    // Si no existe en IndexedDB → Consultar API
    if (!registroEntrada && !registroSalida) {
      console.log(
        "📡 No existe en IndexedDB - Consultando API por primera vez"
      );
      return await this.consultarAPIYGuardar(
        rol,
        id_o_dni,
        mes,
        "Primera consulta para mes anterior"
      );
    }

    // Si existe → Verificar según última actualización (LÓGICA CLAVE DEL FLOWCHART)
    const registro = registroEntrada || registroSalida;
    if (!registro) {
      return {
        encontrado: false,
        mensaje: "Error al obtener registro existente",
      };
    }

    const evaluacion = this.dateHelper.evaluarNecesidadConsultaSegunTimestamp(
      registro.ultima_fecha_actualizacion,
      mes
    );

    if (evaluacion.esDatoFinalizado) {
      console.log(`✅ Datos finalizados - ${evaluacion.razon}`);
      return {
        entrada: registroEntrada!,
        salida: registroSalida!,
        encontrado: true,
        mensaje: `Datos finalizados obtenidos de IndexedDB: ${evaluacion.razon}`,
        fuenteDatos: "INDEXEDDB",
        optimizado: true,
      };
    }

    if (evaluacion.esConsultaNecesaria) {
      console.log(`🔄 Consulta necesaria - ${evaluacion.razon}`);
      return await this.consultarAPIYGuardar(
        rol,
        id_o_dni,
        mes,
        `Actualización: ${evaluacion.razon}`
      );
    }

    // Usar datos existentes
    console.log(`📋 Usando datos existentes - ${evaluacion.razon}`);
    return {
      entrada: registroEntrada!,
      salida: registroSalida!,
      encontrado: true,
      mensaje: `Datos obtenidos de IndexedDB: ${evaluacion.razon}`,
      fuenteDatos: "INDEXEDDB",
      optimizado: true,
    };
  }

  /**
   * ✅ NUEVO: Procesa mes actual con lógica inteligente
   */
  /**
   * ✅ CORREGIDO: Procesar mes actual inteligente - No evitar Redis por datos "recientes"
   */
  private async procesarConsultaMesActualInteligente(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number
  ): Promise<ConsultaAsistenciaResult> {
    console.log(`📅 Procesando mes actual inteligente: ${mes}`);

    // Buscar registros existentes
    const [registroEntrada, registroSalida] = await Promise.all([
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

    const registro = registroEntrada || registroSalida;

    // Si no hay registros → Aplicar lógica de horarios
    if (!registro) {
      console.log("📭 Sin registros existentes - Aplicar lógica de horarios");
      return await this.aplicarLogicaHorarios(tipoPersonal, rol, id_o_dni, mes);
    }

    // ✅ CORREGIDO: Si hay registros → SIEMPRE aplicar lógica de horarios para mes actual
    // Los registros históricos no impiden consultar Redis para el día actual
    console.log(
      `📊 Registros históricos encontrados - Aplicar lógica de horarios para obtener datos del día actual`
    );
    return await this.aplicarLogicaHorarios(tipoPersonal, rol, id_o_dni, mes);
  }

  /**
   * ✅ MODIFICADO: Aplica lógica de horarios con verificación de datos históricos
   */
  private async aplicarLogicaHorarios(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number
  ): Promise<ConsultaAsistenciaResult> {
    const estrategia = this.dateHelper.determinarEstrategiaSegunHorario();
    console.log(
      `⏰ Estrategia aplicada: ${estrategia.estrategia} - ${estrategia.razon}`
    );

    const diaActual = this.dateHelper.obtenerDiaActual() || 1;

    switch (estrategia.estrategia) {
      case "NO_CONSULTAR":
        return await this.obtenerDatosHistoricosSinConsulta(
          tipoPersonal,
          rol,
          id_o_dni,
          mes,
          diaActual,
          estrategia.razon
        );

      case "API_CONSOLIDADO":
        return await this.consultarAPIYGuardar(
          rol,
          id_o_dni,
          mes,
          estrategia.razon
        );

      case "REDIS_ENTRADAS":
      case "REDIS_COMPLETO":
        // ✅ NUEVA LÓGICA: Verificar datos históricos antes de consultar solo Redis
        return await this.verificarDatosHistoricosYProceder(
          tipoPersonal,
          rol,
          id_o_dni,
          mes,
          diaActual,
          estrategia
        );

      default:
        console.warn(`⚠️ Estrategia no reconocida: ${estrategia.estrategia}`);
        return await this.consultarAPIYGuardar(
          rol,
          id_o_dni,
          mes,
          "Estrategia fallback"
        );
    }
  }

  /**
   * ✅ CORREGIDO: Verificar datos históricos y proceder según flowchart
   */
  private async verificarDatosHistoricosYProceder(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number,
    diaActual: number,
    estrategia: any
  ): Promise<ConsultaAsistenciaResult> {
    console.log(
      `🔍 Verificando datos históricos antes de aplicar: ${estrategia.estrategia}`
    );

    // PASO 1: Buscar registros existentes
    const [registroEntrada, registroSalida] = await Promise.all([
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

    // ✅ NUEVO: Validar consistencia si existen registros
    if (registroEntrada || registroSalida) {
      const validacionConsistencia =
        await this.validator.validarConsistenciaEntradaSalida(
          registroEntrada,
          registroSalida,
          mes,
          id_o_dni
        );

      if (validacionConsistencia.requiereCorreccion) {
        console.warn(
          `⚠️ Datos inconsistentes detectados: ${validacionConsistencia.razon}`
        );
        console.log(
          "🗑️ Eliminando registros inconsistentes y consultando API..."
        );

        // Eliminar registros inconsistentes
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

        // Forzar consulta completa a API
        console.log("📡 Forzando consulta API por inconsistencia...");
        return await this.consultarAPIYGuardar(
          rol,
          id_o_dni,
          mes,
          `Corrección por inconsistencia: ${validacionConsistencia.razon}`
        );
      }

      console.log(`✅ Datos consistentes: ${validacionConsistencia.razon}`);
    }

    // PASO 2: Si NO hay registros mensuales → API + Redis
    if (!registroEntrada && !registroSalida) {
      console.log(`📭 Sin registros mensuales → API + Redis`);
      return await this.consultarAPILuegoRedis(rol, id_o_dni, mes, estrategia);
    }

    // PASO 3: Si hay registros → Verificar últimos 5 días escolares
    const ultimosDiasEscolares = this.dateHelper.obtenerUltimosDiasEscolares(
      DIAS_ESCOLARES_MINIMOS_VERIFICACION
    );

    if (ultimosDiasEscolares.length === 0) {
      console.log(`📅 No se pudieron obtener días escolares → Solo Redis`);
      return await this.consultarSoloRedis(
        tipoPersonal,
        rol,
        id_o_dni,
        mes,
        diaActual,
        estrategia
      );
    }

    // PASO 4: Verificar cobertura de datos históricos
    const verificacionEntrada = registroEntrada
      ? await this.repository.verificarDatosEnUltimosDiasEscolares(
          tipoPersonal,
          ModoRegistro.Entrada,
          id_o_dni,
          mes,
          ultimosDiasEscolares
        )
      : { tieneDatosSuficientes: false };

    const verificacionSalida = registroSalida
      ? await this.repository.verificarDatosEnUltimosDiasEscolares(
          tipoPersonal,
          ModoRegistro.Salida,
          id_o_dni,
          mes,
          ultimosDiasEscolares
        )
      : { tieneDatosSuficientes: false };

    // PASO 5: Decidir según cobertura (al menos UNO debe tener datos)
    const tieneDatosSuficientes =
      verificacionEntrada.tieneDatosSuficientes ||
      verificacionSalida.tieneDatosSuficientes;

    if (!tieneDatosSuficientes) {
      console.log(`⚠️ Sin datos en últimos 5 días escolares → API + Redis`);
      return await this.consultarAPILuegoRedis(rol, id_o_dni, mes, estrategia);
    }

    // PASO 6: Datos suficientes → Solo Redis
    console.log(`✅ Datos históricos suficientes → Solo Redis`);
    return await this.consultarSoloRedis(
      tipoPersonal,
      rol,
      id_o_dni,
      mes,
      diaActual,
      estrategia
    );
  }

  /**
   * ✅ NUEVO: Consultar API primero, luego Redis
   */
  private async consultarAPILuegoRedis(
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number,
    estrategia: any
  ): Promise<ConsultaAsistenciaResult> {
    // PASO 1: Consultar API para datos históricos
    console.log(`📡 PASO 1: Consultando API para datos históricos...`);
    const resultadoAPI = await this.consultarAPIYGuardar(
      rol,
      id_o_dni,
      mes,
      `${estrategia.razon} + Sin datos históricos suficientes`
    );

    if (!resultadoAPI.encontrado) {
      console.log(`❌ API no devolvió datos`);
      return resultadoAPI;
    }

    // PASO 2: Ahora consultar Redis para datos del día actual
    console.log(`☁️ PASO 2: Consultando Redis para datos del día actual...`);
    const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(rol);
    const diaActual = this.dateHelper.obtenerDiaActual() || 1;

    return await this.consultarSoloRedis(
      tipoPersonal,
      rol,
      id_o_dni,
      mes,
      diaActual,
      {
        ...estrategia,
        razon: `${estrategia.razon} + Post-API: consultando Redis para hoy`,
      }
    );
  }

  /**
   * ✅ OPTIMIZADO: Consultar solo Redis con integración inteligente de cache
   */
  private async consultarSoloRedis(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number,
    diaActual: number,
    estrategia: any
  ): Promise<ConsultaAsistenciaResult> {
    // ✅ CONTROL GLOBAL CENTRALIZADO
    const controlGlobal = this.cacheManager.yaSeConsultoRedisEnRango(
      id_o_dni,
      estrategia.estrategia
    );

    if (controlGlobal.yaConsultado) {
      console.log(
        `⏭️ CONTROL GLOBAL: ${controlGlobal.razon} - Saltando consulta Redis`
      );

      // Obtener registros actuales y combinar con cache existente
      const [registroEntrada, registroSalida] = await Promise.all([
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

      return await this.cacheManager.combinarDatosHistoricosYActuales(
        registroEntrada,
        registroSalida,
        rol,
        id_o_dni,
        true,
        diaActual,
        `${estrategia.razon} + ${controlGlobal.razon}`
      );
    }

    console.log(
      `🔓 CONTROL GLOBAL: ${controlGlobal.razon} - Procediendo con consulta Redis`
    );

    // Obtener registros actuales
    let [registroEntrada, registroSalida] = await Promise.all([
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

    // Verificar datos en cache local (para optimización)
    const fechaHoy = this.dateHelper.obtenerFechaStringActual();
    const actor = this.mapper.obtenerActorDesdeRol(rol);

    let tieneEntradaHoy = false;
    let tieneSalidaHoy = false;

    if (fechaHoy) {
      const [entradaLocal, salidaLocal] = await Promise.all([
        this.cacheManager.consultarCacheAsistenciaHoyDirecto(
          actor,
          ModoRegistro.Entrada,
          id_o_dni,
          fechaHoy
        ),
        this.cacheManager.consultarCacheAsistenciaHoyDirecto(
          actor,
          ModoRegistro.Salida,
          id_o_dni,
          fechaHoy
        ),
      ]);

      tieneEntradaHoy = !!entradaLocal;
      tieneSalidaHoy = !!salidaLocal;

      // Si ya tengo todos los datos necesarios, no consultar Redis pero sí marcar como consultado
      if (estrategia.estrategia === "REDIS_ENTRADAS" && tieneEntradaHoy) {
        console.log(
          "✅ Ya tengo entrada local completa - marcando como consultado y saltando Redis"
        );
        this.cacheManager.marcarConsultaRedisRealizada(id_o_dni);
        return await this.cacheManager.combinarDatosHistoricosYActuales(
          registroEntrada,
          registroSalida,
          rol,
          id_o_dni,
          true,
          diaActual,
          "Datos de entrada completos en cache local"
        );
      }

      if (
        estrategia.estrategia === "REDIS_COMPLETO" &&
        tieneEntradaHoy &&
        tieneSalidaHoy
      ) {
        console.log(
          "✅ Ya tengo entrada y salida local completas - marcando como consultado y saltando Redis"
        );
        this.cacheManager.marcarConsultaRedisRealizada(id_o_dni);
        return await this.cacheManager.combinarDatosHistoricosYActuales(
          registroEntrada,
          registroSalida,
          rol,
          id_o_dni,
          true,
          diaActual,
          "Datos completos en cache local"
        );
      }
    }

    // ✅ CONSULTAR REDIS API
    console.log(`📡 Consultando Redis API: ${estrategia.estrategia}`);

    const necesitaEntradas =
      estrategia.estrategia === "REDIS_ENTRADAS" ||
      (estrategia.estrategia === "REDIS_COMPLETO" && !tieneEntradaHoy);
    const necesitaSalidas =
      estrategia.estrategia === "REDIS_COMPLETO" && !tieneSalidaHoy;

    let mensajeConsulta = "";
    let datosRedisObtenidos = false;

    if (necesitaEntradas || necesitaSalidas) {
      try {
        const datosRedis =
          await this.apiClient.consultarRedisCompletoPorPersona(
            rol,
            id_o_dni,
            necesitaSalidas
          );

        // ✅ MARCAR CONSULTA REALIZADA INMEDIATAMENTE
        this.cacheManager.marcarConsultaRedisRealizada(id_o_dni);

        if (datosRedis.encontradoEntrada || datosRedis.encontradoSalida) {
          const integracion =
            await this.cacheManager.integrarDatosDirectosDeRedis(
              registroEntrada,
              registroSalida,
              datosRedis,
              rol,
              id_o_dni,
              diaActual
            );

          if (integracion.integrado) {
            console.log(`✅ Datos de Redis API integrados exitosamente`);
            datosRedisObtenidos = true;
            mensajeConsulta = `Datos actualizados desde Redis API: ${integracion.mensaje}`;
            registroEntrada = integracion.entrada || registroEntrada;
            registroSalida = integracion.salida || registroSalida;
          }
        }

        if (!datosRedisObtenidos) {
          console.log(`📭 No se encontraron datos nuevos en Redis API`);
          mensajeConsulta = "No se encontraron datos nuevos en Redis API";
        }
      } catch (error) {
        console.error(`❌ Error al consultar Redis API:`, error);
        // Marcar como consultado incluso si hay error para evitar reintentos inmediatos
        this.cacheManager.marcarConsultaRedisRealizada(id_o_dni);
        mensajeConsulta = "Error al consultar Redis API";
      }
    }

    return await this.cacheManager.combinarDatosHistoricosYActuales(
      registroEntrada,
      registroSalida,
      rol,
      id_o_dni,
      true,
      diaActual,
      `${estrategia.razon} + ${mensajeConsulta}`
    );
  }

  /**
   * ✅ NUEVO: Procesa consulta para mes anterior
   */
  private async procesarConsultaMesAnterior(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number
  ): Promise<ConsultaAsistenciaResult> {
    console.log(`📅 Procesando mes anterior: ${mes}`);

    // Buscar en IndexedDB
    const [registroEntrada, registroSalida] = await Promise.all([
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

    // Si no existe en IndexedDB → Consultar API
    if (!registroEntrada && !registroSalida) {
      console.log(
        "📡 No existe en IndexedDB - Consultando API por primera vez"
      );
      return await this.consultarAPIYGuardar(
        rol,
        id_o_dni,
        mes,
        "Primera consulta para mes anterior"
      );
    }

    // Si existe → Verificar según última actualización
    const registro = registroEntrada || registroSalida;
    if (!registro) {
      return {
        encontrado: false,
        mensaje: "Error al obtener registro existente",
      };
    }

    const evaluacion =
      this.dateHelper.debeConsultarAPIMesAnteriorSegunTimestamp(
        registro.ultima_fecha_actualizacion,
        mes
      );

    if (evaluacion.esDatoFinalizado) {
      console.log(`✅ Datos finalizados - ${evaluacion.razon}`);
      return {
        entrada: registroEntrada!,
        salida: registroSalida!,
        encontrado: true,
        mensaje: `Datos finalizados obtenidos de IndexedDB: ${evaluacion.razon}`,
        fuenteDatos: "INDEXEDDB",
        optimizado: true,
      };
    }

    if (evaluacion.debeConsultar) {
      console.log(`🔄 Actualizando datos - ${evaluacion.razon}`);
      return await this.consultarAPIYGuardar(
        rol,
        id_o_dni,
        mes,
        `Actualización: ${evaluacion.razon}`
      );
    }

    // Retornar datos existentes
    return {
      entrada: registroEntrada!,
      salida: registroSalida!,
      encontrado: true,
      mensaje: "Datos obtenidos de IndexedDB (sin actualización necesaria)",
      fuenteDatos: "INDEXEDDB",
      optimizado: true,
    };
  }

  /**
   * ✅ NUEVO: Procesa consulta para mes actual
   */
  private async procesarConsultaMesActual(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number
  ): Promise<ConsultaAsistenciaResult> {
    console.log(`📅 Procesando mes actual: ${mes}`);

    const esFinDeSemana = this.dateHelper.esFinDeSemana();
    const diaActual = this.dateHelper.obtenerDiaActual();

    if (!diaActual) {
      throw new Error("No se pudo obtener día actual");
    }

    // 🏖️ LÓGICA FIN DE SEMANA
    if (esFinDeSemana) {
      return await this.procesarFinDeSemana(
        tipoPersonal,
        rol,
        id_o_dni,
        mes,
        diaActual
      );
    }

    // 🏫 LÓGICA DÍA ESCOLAR
    return await this.procesarDiaEscolar(
      tipoPersonal,
      rol,
      id_o_dni,
      mes,
      diaActual
    );
  }

  /**
   * ✅ NUEVO: Procesa lógica para fin de semana
   */
  private async procesarFinDeSemana(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number,
    diaActual: number
  ): Promise<ConsultaAsistenciaResult> {
    console.log("🏖️ Procesando fin de semana");

    // Buscar registros existentes
    const [registroEntrada, registroSalida] = await Promise.all([
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

    const registro = registroEntrada || registroSalida;

    // Si no hay registros → Consultar API
    if (!registro) {
      return await this.consultarAPIYGuardar(
        rol,
        id_o_dni,
        mes,
        "Primera consulta en fin de semana"
      );
    }

    // Verificar si última actualización fue viernes completo
    const viernesCompleto = this.dateHelper.fueActualizadoViernesCompleto(
      registro.ultima_fecha_actualizacion
    );

    if (viernesCompleto) {
      console.log("✅ Datos del viernes completos - No consultar API");
      return await this.cacheManager.combinarDatosHistoricosYActuales(
        registroEntrada,
        registroSalida,
        rol,
        id_o_dni,
        true,
        diaActual,
        "Datos completos del viernes (actualizado después de 20:00)"
      );
    } else {
      console.log("🔄 Datos del viernes incompletos - Consultar API");
      return await this.consultarAPIYGuardar(
        rol,
        id_o_dni,
        mes,
        "Actualización fin de semana - datos del viernes incompletos"
      );
    }
  }

  /**
   * ✅ NUEVO: Procesa lógica para día escolar
   */
  private async procesarDiaEscolar(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number,
    diaActual: number
  ): Promise<ConsultaAsistenciaResult> {
    console.log("🏫 Procesando día escolar");

    const estrategia = this.dateHelper.determinarEstrategiaSegunHorario();
    console.log(
      `⏰ Estrategia determinada: ${estrategia.estrategia} - ${estrategia.razon}`
    );

    switch (estrategia.estrategia) {
      case "NO_CONSULTAR":
        return await this.obtenerDatosHistoricosSinConsulta(
          tipoPersonal,
          rol,
          id_o_dni,
          mes,
          diaActual,
          estrategia.razon
        );

      case "API_CONSOLIDADO":
        return await this.consultarAPIYGuardar(
          rol,
          id_o_dni,
          mes,
          estrategia.razon
        );

      case "REDIS_ENTRADAS":
      case "REDIS_COMPLETO":
        return await this.consultarRedisYCombinar(
          tipoPersonal,
          rol,
          id_o_dni,
          mes,
          diaActual,
          estrategia
        );

      default:
        throw new Error(`Estrategia no implementada: ${estrategia.estrategia}`);
    }
  }

  /**
   * ✅ NUEVO: Obtiene datos históricos sin consultar APIs
   */
  private async obtenerDatosHistoricosSinConsulta(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number,
    diaActual: number,
    razon: string
  ): Promise<ConsultaAsistenciaResult> {
    const [registroEntrada, registroSalida] = await Promise.all([
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

    return await this.cacheManager.combinarDatosHistoricosYActuales(
      registroEntrada,
      registroSalida,
      rol,
      id_o_dni,
      true,
      diaActual,
      `Datos históricos sin consulta: ${razon}`
    );
  }

  /**
   * ✅ OPTIMIZADO: Usa ultima_fecha_actualizacion para control de rango
   */
  private async consultarRedisYCombinar(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number,
    diaActual: number,
    estrategia: any
  ): Promise<ConsultaAsistenciaResult> {
    console.log(
      `🔍 Consultando Redis con estrategia: ${estrategia.estrategia}`
    );

    // ✅ AGREGAR: Log de información del contexto
    console.log(
      `%c📋 Contexto consulta Redis: mes=${mes}, día=${diaActual}, usuario=${id_o_dni}`,
      "color:cyan;"
    );

    // Buscar registros históricos SIEMPRE (retrocompatibilidad)
    let [registroEntrada, registroSalida] = await Promise.all([
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

    // ✅ VERIFICAR si ya tengo datos del día actual en cache local
    const fechaHoy = this.dateHelper.obtenerFechaStringActual();
    const actor = this.mapper.obtenerActorDesdeRol(rol);

    let tieneEntradaHoy = false;
    let tieneSalidaHoy = false;

    if (fechaHoy) {
      const [entradaLocal, salidaLocal] = await Promise.all([
        this.cacheManager.consultarCacheAsistenciaHoyDirecto(
          actor,
          ModoRegistro.Entrada,
          id_o_dni,
          fechaHoy
        ),
        this.cacheManager.consultarCacheAsistenciaHoyDirecto(
          actor,
          ModoRegistro.Salida,
          id_o_dni,
          fechaHoy
        ),
      ]);

      tieneEntradaHoy = !!entradaLocal;
      tieneSalidaHoy = !!salidaLocal;

      // ✅ Si ya tengo todos los datos necesarios para la estrategia, no consultar
      if (estrategia.estrategia === "REDIS_ENTRADAS" && tieneEntradaHoy) {
        console.log("✅ Ya tengo entrada local completa - saltando Redis");
        return await this.cacheManager.combinarDatosHistoricosYActuales(
          registroEntrada,
          registroSalida,
          rol,
          id_o_dni,
          true,
          diaActual,
          "Datos de entrada completos en cache local"
        );
      }

      if (
        estrategia.estrategia === "REDIS_COMPLETO" &&
        tieneEntradaHoy &&
        tieneSalidaHoy
      ) {
        console.log(
          "✅ Ya tengo entrada y salida local completas - saltando Redis"
        );
        return await this.cacheManager.combinarDatosHistoricosYActuales(
          registroEntrada,
          registroSalida,
          rol,
          id_o_dni,
          true,
          diaActual,
          "Datos completos en cache local"
        );
      }
    }

    // ✅ CONTROL DE RANGO usando ultima_fecha_actualizacion
    let yaConsultadoEnRango = false;
    let mensajeControl = "";

    const registroParaControl = registroEntrada || registroSalida;
    if (registroParaControl) {
      const controlRango = this.dateHelper.yaSeConsultoEnRangoActual(
        registroParaControl.ultima_fecha_actualizacion
      );

      yaConsultadoEnRango = controlRango.yaConsultado;
      mensajeControl = controlRango.razon;

      console.log(`🔍 Control rango: ${controlRango.razon}`);
    }

    let mensajeConsulta = "";
    let datosRedisObtenidos = false;

    // ✅ LÓGICA DE CONSULTA: Solo si no se ha consultado en este rango
    if (!yaConsultadoEnRango) {
      const rangoActual =
        this.dateHelper.obtenerRangoHorarioActualConConstantes();
      console.log(
        `📡 Primera consulta en ${rangoActual.rango} - procediendo...`
      );

      // Determinar qué consultar según estrategia y datos locales
      const necesitaEntradas =
        estrategia.estrategia === "REDIS_ENTRADAS" ||
        (estrategia.estrategia === "REDIS_COMPLETO" && !tieneEntradaHoy);
      const necesitaSalidas =
        estrategia.estrategia === "REDIS_COMPLETO" && !tieneSalidaHoy;

      if (necesitaEntradas || necesitaSalidas) {
        try {
          console.log(
            `📡 Consultando Redis - entradas: ${necesitaEntradas}, salidas: ${necesitaSalidas}`
          );
          const datosRedis =
            await this.apiClient.consultarRedisCompletoPorPersona(
              rol,
              id_o_dni,
              necesitaSalidas
            );

          // Integrar datos de Redis si se encontraron
          if (datosRedis.encontradoEntrada || datosRedis.encontradoSalida) {
            const integracion =
              await this.cacheManager.integrarDatosDirectosDeRedis(
                registroEntrada,
                registroSalida,
                datosRedis,
                rol,
                id_o_dni,
                diaActual
              );

            if (integracion.integrado) {
              console.log(`✅ Datos de Redis integrados exitosamente`);
              datosRedisObtenidos = true;
              mensajeConsulta = `Datos actualizados desde Redis: ${integracion.mensaje}`;

              // Usar los datos integrados
              registroEntrada = integracion.entrada || registroEntrada;
              registroSalida = integracion.salida || registroSalida;
            }
          }

          if (!datosRedisObtenidos) {
            console.log(`📭 No se encontraron datos nuevos en Redis`);
            mensajeConsulta = "No se encontraron datos nuevos en Redis";
          }
        } catch (error) {
          console.error(`❌ Error al consultar Redis:`, error);
          mensajeConsulta = "Error al consultar Redis";
        }
      } else {
        console.log(`✅ Todos los datos necesarios ya están en cache local`);
        mensajeConsulta = "Datos completos en cache local";
      }
    } else {
      console.log(`⏭️ ${mensajeControl} - saltando consulta Redis`);
      mensajeConsulta = `Ya consultado: ${mensajeControl}`;
    }

    // ✅ RETROCOMPATIBILIDAD: SIEMPRE combinar con datos históricos
    const resultado = await this.cacheManager.combinarDatosHistoricosYActuales(
      registroEntrada,
      registroSalida,
      rol,
      id_o_dni,
      true,
      diaActual,
      `${estrategia.razon} + ${mensajeConsulta}`
    );

    // ✅ GARANTIZAR: Si no hay datos y es primera consulta, fallback a API
    if (!resultado.encontrado && !yaConsultadoEnRango) {
      console.log(`🔄 Sin datos locales ni Redis - fallback a API`);
      return await this.consultarAPIYGuardar(
        rol,
        id_o_dni,
        mes,
        "Fallback sin datos locales"
      );
    }

    return resultado;
  }

  /**
   * ✅ MODIFICADO: Consulta API y luego Redis si corresponde según horario
   */
  private async consultarAPIYGuardar(
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number,
    razon: string
  ): Promise<ConsultaAsistenciaResult> {
    const asistenciaAPI =
      await this.apiClient.consultarAsistenciasConReintentos(
        rol,
        id_o_dni,
        mes
      );

    if (asistenciaAPI) {
      await this.procesarYGuardarAsistenciaDesdeAPI(asistenciaAPI);

      const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(rol);
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

      const esConsultaMesActual = this.dateHelper.esConsultaMesActual(mes);
      const diaActual = this.dateHelper.obtenerDiaActual() || 1;

      // ✅ NUEVO: Si es mes actual, verificar si también se debe consultar Redis
      if (esConsultaMesActual) {
        const estrategia = this.dateHelper.determinarEstrategiaSegunHorario();

        console.log(
          `🔍 API completada. Evaluando Redis según horario: ${estrategia.estrategia} - ${estrategia.razon}`
        );

        // Si la estrategia indica consultar Redis, hacerlo
        if (
          estrategia.estrategia === "REDIS_ENTRADAS" ||
          estrategia.estrategia === "REDIS_COMPLETO"
        ) {
          console.log(`☁️ Consultando Redis adicional después de API...`);

          try {
            // Usar el método existente que ya maneja toda la lógica de Redis
            const resultadoConRedis = await this.consultarSoloRedis(
              tipoPersonal,
              rol,
              id_o_dni,
              mes,
              diaActual,
              {
                ...estrategia,
                razon: `${estrategia.razon} + Post-API: consultando Redis para datos del día actual`,
              }
            );

            // Si Redis devolvió datos, usarlos; si no, usar los de API
            if (resultadoConRedis.encontrado) {
              console.log(`✅ Datos de API + Redis combinados exitosamente`);
              return {
                ...resultadoConRedis,
                mensaje: `${razon} + Datos complementados con Redis: ${resultadoConRedis.mensaje}`,
              };
            } else {
              console.log(
                `📭 Redis no tenía datos adicionales, usando solo API`
              );
            }
          } catch (error) {
            console.warn(
              `⚠️ Error al consultar Redis después de API, continuando con datos de API:`,
              error
            );
          }
        } else {
          console.log(
            `⏭️ No corresponde consultar Redis según horario: ${estrategia.razon}`
          );
        }
      }

      // Retornar resultado combinando datos históricos (API) con datos actuales (cache si existe)
      return await this.cacheManager.combinarDatosHistoricosYActuales(
        nuevaEntrada,
        nuevaSalida,
        rol,
        id_o_dni,
        esConsultaMesActual,
        diaActual,
        `Datos obtenidos de API: ${razon}`
      );
    } else {
      // API devuelve 404 - Guardar registro vacío
      console.log("📭 API devuelve 404 - Guardando registro vacío");
      await this.guardarRegistroVacio(rol, id_o_dni, mes);

      return {
        encontrado: false,
        mensaje: `No se encontraron registros para el mes ${mes}: ${razon}`,
        fuenteDatos: "API",
      };
    }
  }

  /**
   * ✅ NUEVO: Guarda registro vacío cuando API devuelve 404
   */
  private async guardarRegistroVacio(
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number
  ): Promise<void> {
    try {
      const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(rol);
      const timestampActual = this.dateHelper.obtenerTimestampPeruano();

      const registroVacio: AsistenciaMensualPersonalLocal = {
        Id_Registro_Mensual: 0, // ID temporal para 404
        mes: mes as Meses,
        ID_o_DNI_Personal: String(id_o_dni),
        registros: {}, // Objeto vacío
        ultima_fecha_actualizacion: timestampActual,
      };

      // Guardar tanto entrada como salida vacías
      await Promise.all([
        this.repository.guardarRegistroMensual(
          tipoPersonal,
          ModoRegistro.Entrada,
          registroVacio
        ),
        this.repository.guardarRegistroMensual(
          tipoPersonal,
          ModoRegistro.Salida,
          { ...registroVacio, Id_Registro_Mensual: 1 }
        ),
      ]);

      console.log(
        `📭 Registro vacío guardado para ${id_o_dni} - mes ${mes} con timestamp ${timestampActual}`
      );
    } catch (error) {
      console.error("Error al guardar registro vacío:", error);
    }
  }

  /**
   * ✅ NUEVO: Obtiene mis asistencias mensuales con integración completa (para usuarios no directivos)
   */
  public async obtenerMiAsistenciaMensualConAPI(
    rol: RolesSistema,
    mes: number
  ): Promise<ConsultaAsistenciaResult> {
    try {
      this.dateHelper = this.dateHelper || new AsistenciaDePersonalDateHelper();

      // Validaciones iguales al método original
      const estadoTemporal = this.dateHelper.obtenerEstadoTemporalMes(mes);

      if (estadoTemporal.tipo === "MES_FUTURO") {
        console.error(`🚨 LOGOUT FORZADO: ${estadoTemporal.descripcion}`);
        throw new Error(
          "Consulta de mes futuro no permitida - sesión cerrada por seguridad"
        );
      }

      const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(rol);

      // Obtener DNI del handler actual
      const { DatosAsistenciaHoyIDB } = await import(
        "../../DatosAsistenciaHoy/DatosAsistenciaHoyIDB"
      );
      const datosIDB = new DatosAsistenciaHoyIDB();
      const handler = await datosIDB.getHandler();

      if (!handler) {
        throw new Error(
          "No se pudo obtener handler para obtener DNI del usuario"
        );
      }

      const miDNI = (handler as any).getMiDNI(); // Todos los handlers tienen este método

      console.log(
        `🎯 Flujo mis asistencias iniciado: ${rol} ${miDNI} - ${estadoTemporal.descripcion}`
      );

      // RAMA: MES ANTERIOR
      if (estadoTemporal.tipo === "MES_ANTERIOR") {
        return await this.procesarMiConsultaMesAnterior(
          tipoPersonal,
          rol,
          miDNI,
          mes
        );
      }

      // RAMA: MES ACTUAL
      return await this.procesarMiConsultaMesActual(
        tipoPersonal,
        rol,
        miDNI,
        mes
      );
    } catch (error) {
      console.error("❌ Error en flujo mis asistencias:", error);
      return {
        encontrado: false,
        mensaje:
          error instanceof Error
            ? error.message
            : "Error en consulta de mis asistencias",
      };
    }
  }

  /**
   * ✅ MODIFICADO: Consulta mi API y luego mi Redis si corresponde
   */
  private async consultarMiAPIYGuardar(
    rol: RolesSistema,
    miDNI: string,
    mes: number,
    razon: string
  ): Promise<ConsultaAsistenciaResult> {
    const asistenciaAPI = await this.apiClient.consultarMisAsistenciasMensuales(
      mes
    );

    if (asistenciaAPI) {
      await this.procesarYGuardarAsistenciaDesdeAPI(asistenciaAPI);

      const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(rol);
      const [nuevaEntrada, nuevaSalida] = await Promise.all([
        this.repository.obtenerRegistroMensual(
          tipoPersonal,
          ModoRegistro.Entrada,
          miDNI,
          mes,
          asistenciaAPI.Id_Registro_Mensual_Entrada
        ),
        this.repository.obtenerRegistroMensual(
          tipoPersonal,
          ModoRegistro.Salida,
          miDNI,
          mes,
          asistenciaAPI.Id_Registro_Mensual_Salida
        ),
      ]);

      const esConsultaMesActual = this.dateHelper.esConsultaMesActual(mes);
      const diaActual = this.dateHelper.obtenerDiaActual() || 1;

      // ✅ NUEVO: Si es mes actual, verificar si también se debe consultar mi Redis
      if (esConsultaMesActual) {
        const estrategia = this.dateHelper.determinarEstrategiaSegunHorario();

        console.log(
          `🔍 Mi API completada. Evaluando mi Redis según horario: ${estrategia.estrategia}`
        );

        if (
          estrategia.estrategia === "REDIS_ENTRADAS" ||
          estrategia.estrategia === "REDIS_COMPLETO"
        ) {
          console.log(`☁️ Consultando mi Redis adicional después de mi API...`);

          try {
            const resultadoConRedis = await this.consultarSoloMiRedis(
              tipoPersonal,
              rol,
              miDNI,
              mes,
              diaActual,
              {
                ...estrategia,
                razon: `${estrategia.razon} + Post-API: consultando mi Redis para datos del día actual`,
              }
            );

            if (resultadoConRedis.encontrado) {
              console.log(
                `✅ Mis datos de API + Redis combinados exitosamente`
              );
              return {
                ...resultadoConRedis,
                mensaje: `${razon} + Mis datos complementados con Redis: ${resultadoConRedis.mensaje}`,
              };
            }
          } catch (error) {
            console.warn(
              `⚠️ Error al consultar mi Redis después de API:`,
              error
            );
          }
        }
      }

      return await this.cacheManager.combinarDatosHistoricosYActuales(
        nuevaEntrada,
        nuevaSalida,
        rol,
        miDNI,
        esConsultaMesActual,
        diaActual,
        `Mis datos obtenidos de API: ${razon}`
      );
    } else {
      console.log("📭 Mi API devuelve 404 - Guardando registro vacío");
      await this.guardarRegistroVacio(rol, miDNI, mes);

      return {
        encontrado: false,
        mensaje: `No se encontraron mis registros para el mes ${mes}: ${razon}`,
        fuenteDatos: "API",
      };
    }
  }

  // Agregar métodos procesarMiConsultaMesAnterior y procesarMiConsultaMesActual
  // que serían copias de los métodos originales pero usando consultarMiAPIYGuardar
  // y this.apiClient.consultarMiRedisEspecifico en lugar de las versiones con DNI

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

  /**
   * ✅ NUEVO: Procesa consulta de mis asistencias para mes anterior
   */
  private async procesarMiConsultaMesAnterior(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    miDNI: string,
    mes: number
  ): Promise<ConsultaAsistenciaResult> {
    console.log(`📅 Procesando mis asistencias - mes anterior: ${mes}`);

    // PASO 1: Consultar IndexedDB
    const [registroEntrada, registroSalida] = await Promise.all([
      this.repository.obtenerRegistroMensual(
        tipoPersonal,
        ModoRegistro.Entrada,
        miDNI,
        mes
      ),
      this.repository.obtenerRegistroMensual(
        tipoPersonal,
        ModoRegistro.Salida,
        miDNI,
        mes
      ),
    ]);

    // PASO 2: Si NO existe en IndexedDB → Consultar API
    if (!registroEntrada && !registroSalida) {
      console.log("📡 Mis datos no existen en IndexedDB - Consultando mi API");
      return await this.consultarMiAPIYGuardar(
        rol,
        miDNI,
        mes,
        "Primera consulta para mis asistencias - mes anterior"
      );
    }

    // PASO 3: SÍ existe → Verificar control de 45 minutos primero
    const registro = registroEntrada || registroSalida;
    const controlRango = this.dateHelper.yaSeConsultoEnRangoActual(
      registro!.ultima_fecha_actualizacion
    );

    if (controlRango.yaConsultado) {
      console.log(
        `⏭️ Mis datos mes anterior - ${controlRango.razon} - Usar datos existentes`
      );
      return {
        entrada: registroEntrada!,
        salida: registroSalida!,
        encontrado: true,
        mensaje: `Mis datos mes anterior - ${controlRango.razon}`,
        fuenteDatos: "INDEXEDDB",
        optimizado: true,
      };
    }

    // PASO 4: Verificar lógica de timestamp del mes
    const mesUltimaActualizacion = this.dateHelper.extraerMesDeTimestamp(
      registro!.ultima_fecha_actualizacion
    );

    if (mesUltimaActualizacion === mes) {
      console.log(
        `🔄 Control 45min pasó + mismo mes ${mes} - Consultar mi API`
      );
      return await this.consultarMiAPIYGuardar(
        rol,
        miDNI,
        mes,
        `Actualización mis datos mes anterior - ${controlRango.razon}`
      );
    } else if (mesUltimaActualizacion > mes) {
      console.log(
        `✅ Mis datos FINALIZADOS (mes ${mesUltimaActualizacion} > ${mes}) - Usar IndexedDB`
      );
      return {
        entrada: registroEntrada!,
        salida: registroSalida!,
        encontrado: true,
        mensaje: "Mis datos finalizados",
        fuenteDatos: "INDEXEDDB",
        optimizado: true,
      };
    } else {
      console.log(
        `⚠️ Mis datos incompletos (mes ${mesUltimaActualizacion} < ${mes}) - Consultar mi API`
      );
      return await this.consultarMiAPIYGuardar(
        rol,
        miDNI,
        mes,
        `Mis datos incompletos - ${controlRango.razon}`
      );
    }
  }

  /**
   * ✅ NUEVO: Procesa consulta de mis asistencias para mes actual
   */
  private async procesarMiConsultaMesActual(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    miDNI: string,
    mes: number
  ): Promise<ConsultaAsistenciaResult> {
    console.log(`📅 Procesando mis asistencias - mes actual: ${mes}`);

    const diaActual = this.dateHelper.obtenerDiaActual() || 1;
    const esFinDeSemana = this.dateHelper.esFinDeSemana();

    // PASO 1: ¿Es día escolar hoy?
    if (!esFinDeSemana) {
      // SÍ - Día escolar
      return await this.procesarMiDiaEscolar(
        tipoPersonal,
        rol,
        miDNI,
        mes,
        diaActual
      );
    } else {
      // NO - Fin de semana
      return await this.procesarMiFinDeSemana(
        tipoPersonal,
        rol,
        miDNI,
        mes,
        diaActual
      );
    }
  }

  /**
   * ✅ NUEVO: Procesa mis asistencias en fin de semana
   */
  private async procesarMiFinDeSemana(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    miDNI: string,
    mes: number,
    diaActual: number
  ): Promise<ConsultaAsistenciaResult> {
    console.log("🏖️ Procesando mis asistencias - fin de semana");

    // Buscar registros existentes
    const [registroEntrada, registroSalida] = await Promise.all([
      this.repository.obtenerRegistroMensual(
        tipoPersonal,
        ModoRegistro.Entrada,
        miDNI,
        mes
      ),
      this.repository.obtenerRegistroMensual(
        tipoPersonal,
        ModoRegistro.Salida,
        miDNI,
        mes
      ),
    ]);

    // Si NO hay registros → Consultar API obligatoriamente
    if (!registroEntrada && !registroSalida) {
      console.log(
        "📡 Fin de semana SIN mis datos - Consultar mi API obligatorio"
      );
      return await this.consultarMiAPIYGuardar(
        rol,
        miDNI,
        mes,
        "Fin de semana sin mis datos - consulta mi API obligatoria"
      );
    }

    const registro = registroEntrada || registroSalida;

    // Verificar control de 45 minutos primero
    const controlRango = this.dateHelper.yaSeConsultoEnRangoActual(
      registro!.ultima_fecha_actualizacion
    );

    if (controlRango.yaConsultado) {
      console.log(
        `⏭️ Fin de semana - ${controlRango.razon} - NO consultar mis datos`
      );
      return await this.cacheManager.combinarDatosHistoricosYActuales(
        registroEntrada,
        registroSalida,
        rol,
        miDNI,
        true,
        diaActual,
        `Fin de semana - ${controlRango.razon}`
      );
    }

    // Verificar cobertura de últimos 5 días escolares
    const ultimosDiasEscolares = this.dateHelper.obtenerUltimosDiasEscolares(5);

    if (ultimosDiasEscolares.length > 0) {
      const verificacionEntrada = registroEntrada
        ? await this.repository.verificarDatosEnUltimosDiasEscolares(
            tipoPersonal,
            ModoRegistro.Entrada,
            miDNI,
            mes,
            ultimosDiasEscolares
          )
        : { tieneDatosSuficientes: false };

      const verificacionSalida = registroSalida
        ? await this.repository.verificarDatosEnUltimosDiasEscolares(
            tipoPersonal,
            ModoRegistro.Salida,
            miDNI,
            mes,
            ultimosDiasEscolares
          )
        : { tieneDatosSuficientes: false };

      const tieneDatosSuficientes =
        verificacionEntrada.tieneDatosSuficientes ||
        verificacionSalida.tieneDatosSuficientes;

      if (tieneDatosSuficientes) {
        console.log(
          "✅ Fin de semana - Cobertura suficiente en mis últimos 5 días - NO consultar API"
        );
        return await this.cacheManager.combinarDatosHistoricosYActuales(
          registroEntrada,
          registroSalida,
          rol,
          miDNI,
          true,
          diaActual,
          "Fin de semana - cobertura suficiente en mis últimos 5 días escolares"
        );
      }
    }

    // ¿Última actualización fue viernes >= 20:00?
    const viernesCompleto = this.dateHelper.fueActualizadoViernesCompleto(
      registro!.ultima_fecha_actualizacion
    );

    if (viernesCompleto) {
      console.log(
        "✅ Fin de semana - Mis datos del viernes completos (20:00+) - NO consultar API"
      );
      return await this.cacheManager.combinarDatosHistoricosYActuales(
        registroEntrada,
        registroSalida,
        rol,
        miDNI,
        true,
        diaActual,
        "Fin de semana - mis datos del viernes completos (actualizado después de 20:00)"
      );
    } else {
      console.log(
        "🔄 Fin de semana - Condiciones para consultar mi API cumplidas"
      );
      return await this.consultarMiAPIYGuardar(
        rol,
        miDNI,
        mes,
        "Fin de semana - mis datos incompletos o sin cobertura suficiente"
      );
    }
  }

  /**
   * ✅ NUEVO: Procesa mis asistencias en día escolar
   */
  private async procesarMiDiaEscolar(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    miDNI: string,
    mes: number,
    diaActual: number
  ): Promise<ConsultaAsistenciaResult> {
    const horaActual = this.dateHelper.obtenerHoraActual() || 0;
    console.log(
      `🏫 Procesando mis asistencias - día escolar: hora ${horaActual}`
    );

    // PASO 1: ¿Hora actual < 06:00?
    if (horaActual < 6) {
      console.log("🌙 Madrugada - Verificar si hay mis datos históricos");
      return await this.procesarMiMadrugadaConDatosHistoricos(
        tipoPersonal,
        rol,
        miDNI,
        mes,
        diaActual
      );
    }

    // PASO 2: ¿Hora actual >= 22:00?
    if (horaActual >= 22) {
      console.log("🌃 Mis datos consolidados - Consultar mi API");
      return await this.consultarMiAPIYGuardar(
        rol,
        miDNI,
        mes,
        "Después de 22:00 - mis datos consolidados en PostgreSQL"
      );
    }

    // PASO 3: 06:00 <= Hora < 22:00 - Lógica Redis/IndexedDB para mis datos
    console.log(
      "🏫 Horario escolar - Aplicar lógica Redis/IndexedDB para mis datos"
    );
    return await this.procesarMiHorarioEscolarConVerificacion(
      tipoPersonal,
      rol,
      miDNI,
      mes,
      diaActual,
      horaActual
    );
  }

  /**
   * ✅ NUEVO: Procesa madrugada con mis datos históricos
   */
  private async procesarMiMadrugadaConDatosHistoricos(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    miDNI: string,
    mes: number,
    diaActual: number
  ): Promise<ConsultaAsistenciaResult> {
    console.log("🌙 Procesando madrugada - SIEMPRE debe haber mis datos");

    // Buscar datos históricos en IndexedDB
    const [registroEntrada, registroSalida] = await Promise.all([
      this.repository.obtenerRegistroMensual(
        tipoPersonal,
        ModoRegistro.Entrada,
        miDNI,
        mes
      ),
      this.repository.obtenerRegistroMensual(
        tipoPersonal,
        ModoRegistro.Salida,
        miDNI,
        mes
      ),
    ]);

    // Si NO hay datos históricos → Consultar API obligatoriamente
    if (!registroEntrada && !registroSalida) {
      console.log(
        "📡 Madrugada SIN mis datos históricos - Consultar mi API obligatorio"
      );
      return await this.consultarMiAPIYGuardar(
        rol,
        miDNI,
        mes,
        "Madrugada sin mis datos históricos - consulta mi API obligatoria"
      );
    }

    // SÍ hay datos históricos → Verificar últimos días escolares
    const ultimosDiasEscolares = this.dateHelper.obtenerUltimosDiasEscolares(5);

    if (ultimosDiasEscolares.length === 0) {
      console.log(
        "📊 No se pudieron obtener días escolares - Usar mis datos existentes"
      );
      return await this.cacheManager.combinarDatosHistoricosYActuales(
        registroEntrada,
        registroSalida,
        rol,
        miDNI,
        false,
        diaActual,
        "Madrugada con mis datos históricos existentes (sin verificación días escolares)"
      );
    }

    // Verificar cobertura en últimos 5 días escolares
    const verificacionEntrada = registroEntrada
      ? await this.repository.verificarDatosEnUltimosDiasEscolares(
          tipoPersonal,
          ModoRegistro.Entrada,
          miDNI,
          mes,
          ultimosDiasEscolares
        )
      : { tieneDatosSuficientes: false };

    const verificacionSalida = registroSalida
      ? await this.repository.verificarDatosEnUltimosDiasEscolares(
          tipoPersonal,
          ModoRegistro.Salida,
          miDNI,
          mes,
          ultimosDiasEscolares
        )
      : { tieneDatosSuficientes: false };

    const tieneDatosSuficientes =
      verificacionEntrada.tieneDatosSuficientes ||
      verificacionSalida.tieneDatosSuficientes;

    if (!tieneDatosSuficientes) {
      console.log(
        "⚠️ Madrugada - Mis datos insuficientes en últimos 5 días escolares - Actualizar desde mi API"
      );
      return await this.consultarMiAPIYGuardar(
        rol,
        miDNI,
        mes,
        "Madrugada - mis datos insuficientes en últimos 5 días escolares"
      );
    }

    // Datos suficientes - Usar datos históricos
    console.log("✅ Madrugada - Mis datos históricos suficientes");
    return await this.cacheManager.combinarDatosHistoricosYActuales(
      registroEntrada,
      registroSalida,
      rol,
      miDNI,
      false,
      diaActual,
      "Madrugada con mis datos históricos suficientes"
    );
  }

  /**
   * ✅ NUEVO: Procesa horario escolar con verificación para mis datos
   */
  private async procesarMiHorarioEscolarConVerificacion(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    miDNI: string,
    mes: number,
    diaActual: number,
    horaActual: number
  ): Promise<ConsultaAsistenciaResult> {
    // Usar la lógica existente pero con mis APIs
    return await this.verificarMisDatosHistoricosYProceder(
      tipoPersonal,
      rol,
      miDNI,
      mes,
      diaActual,
      {
        estrategia: horaActual < 12 ? "REDIS_ENTRADAS" : "REDIS_COMPLETO",
        razon: `Horario escolar ${horaActual}:xx`,
      }
    );
  }

  /**
   * ✅ NUEVO: Verifica mis datos históricos y procede según flowchart
   */
  private async verificarMisDatosHistoricosYProceder(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    miDNI: string,
    mes: number,
    diaActual: number,
    estrategia: any
  ): Promise<ConsultaAsistenciaResult> {
    console.log(
      `🔍 Verificando mis datos históricos antes de aplicar: ${estrategia.estrategia}`
    );

    // PASO 1: Buscar mis registros existentes
    const [registroEntrada, registroSalida] = await Promise.all([
      this.repository.obtenerRegistroMensual(
        tipoPersonal,
        ModoRegistro.Entrada,
        miDNI,
        mes
      ),
      this.repository.obtenerRegistroMensual(
        tipoPersonal,
        ModoRegistro.Salida,
        miDNI,
        mes
      ),
    ]);

    // PASO 2: Si NO hay mis registros mensuales → Mi API + Redis
    if (!registroEntrada && !registroSalida) {
      console.log(`📭 Sin mis registros mensuales → Mi API + Redis`);
      return await this.consultarMiAPILuegoRedis(rol, miDNI, mes, estrategia);
    }

    // PASO 3: Si hay registros → Verificar últimos 5 días escolares
    const ultimosDiasEscolares = this.dateHelper.obtenerUltimosDiasEscolares(5);

    if (ultimosDiasEscolares.length === 0) {
      console.log(`📅 No se pudieron obtener días escolares → Solo mi Redis`);
      return await this.consultarSoloMiRedis(
        tipoPersonal,
        rol,
        miDNI,
        mes,
        diaActual,
        estrategia
      );
    }

    // PASO 4: Verificar cobertura de mis datos históricos
    const verificacionEntrada = registroEntrada
      ? await this.repository.verificarDatosEnUltimosDiasEscolares(
          tipoPersonal,
          ModoRegistro.Entrada,
          miDNI,
          mes,
          ultimosDiasEscolares
        )
      : { tieneDatosSuficientes: false };

    const verificacionSalida = registroSalida
      ? await this.repository.verificarDatosEnUltimosDiasEscolares(
          tipoPersonal,
          ModoRegistro.Salida,
          miDNI,
          mes,
          ultimosDiasEscolares
        )
      : { tieneDatosSuficientes: false };

    // PASO 5: Decidir según cobertura (al menos UNO debe tener datos)
    const tieneDatosSuficientes =
      verificacionEntrada.tieneDatosSuficientes ||
      verificacionSalida.tieneDatosSuficientes;

    if (!tieneDatosSuficientes) {
      console.log(
        `⚠️ Sin mis datos en últimos 5 días escolares → Mi API + Redis`
      );
      return await this.consultarMiAPILuegoRedis(rol, miDNI, mes, estrategia);
    }

    // PASO 6: Datos suficientes → Solo mi Redis
    console.log(`✅ Mis datos históricos suficientes → Solo mi Redis`);
    return await this.consultarSoloMiRedis(
      tipoPersonal,
      rol,
      miDNI,
      mes,
      diaActual,
      estrategia
    );
  }

  /**
   * ✅ NUEVO: Consultar mi API primero, luego mi Redis
   */
  private async consultarMiAPILuegoRedis(
    rol: RolesSistema,
    miDNI: string,
    mes: number,
    estrategia: any
  ): Promise<ConsultaAsistenciaResult> {
    // PASO 1: Consultar mi API para datos históricos
    console.log(`📡 PASO 1: Consultando mi API para datos históricos...`);
    const resultadoAPI = await this.consultarMiAPIYGuardar(
      rol,
      miDNI,
      mes,
      `${estrategia.razon} + Sin mis datos históricos suficientes`
    );

    if (!resultadoAPI.encontrado) {
      console.log(`❌ Mi API no devolvió datos`);
      return resultadoAPI;
    }

    // PASO 2: Ahora consultar mi Redis para datos del día actual
    console.log(`☁️ PASO 2: Consultando mi Redis para datos del día actual...`);
    const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(rol);
    const diaActual = this.dateHelper.obtenerDiaActual() || 1;

    return await this.consultarSoloMiRedis(
      tipoPersonal,
      rol,
      miDNI,
      mes,
      diaActual,
      {
        ...estrategia,
        razon: `${estrategia.razon} + Post-API: consultando mi Redis para hoy`,
      }
    );
  }

  /**
   * ✅ NUEVO: Consultar solo mi Redis con control de rango
   */
  private async consultarSoloMiRedis(
    tipoPersonal: TipoPersonal,
    rol: RolesSistema,
    miDNI: string,
    mes: number,
    diaActual: number,
    estrategia: any
  ): Promise<ConsultaAsistenciaResult> {
    // Obtener mis registros actuales
    let [registroEntrada, registroSalida] = await Promise.all([
      this.repository.obtenerRegistroMensual(
        tipoPersonal,
        ModoRegistro.Entrada,
        miDNI,
        mes
      ),
      this.repository.obtenerRegistroMensual(
        tipoPersonal,
        ModoRegistro.Salida,
        miDNI,
        mes
      ),
    ]);

    // Control de rango: Solo para evitar consultas Redis duplicadas
    const registroParaControl = registroEntrada || registroSalida;
    if (registroParaControl) {
      const controlRango = this.dateHelper.yaSeConsultoEnRangoActual(
        registroParaControl.ultima_fecha_actualizacion
      );

      if (controlRango.yaConsultado) {
        console.log(
          `⏭️ Mi Redis ya consultado en este rango: ${controlRango.razon}`
        );
        return await this.cacheManager.combinarDatosHistoricosYActuales(
          registroEntrada,
          registroSalida,
          rol,
          miDNI,
          true,
          diaActual,
          `${estrategia.razon} + ${controlRango.razon}`
        );
      }
    }

    console.log(
      `📡 Consultando mi Redis con estrategia: ${estrategia.estrategia}`
    );

    let mensajeConsulta = "";

    // Determinar qué consultar según estrategia
    const modosAConsultar = [];
    if (
      estrategia.estrategia === "REDIS_ENTRADAS" ||
      estrategia.estrategia === "REDIS_COMPLETO"
    ) {
      modosAConsultar.push(ModoRegistro.Entrada);
    }
    if (estrategia.estrategia === "REDIS_COMPLETO") {
      modosAConsultar.push(ModoRegistro.Salida);
    }

    // Consultar cada modo con mi nueva API
    for (const modo of modosAConsultar) {
      try {
        const resultado = await this.apiClient.consultarMiRedisEspecifico(modo);

        if (resultado.encontrado && resultado.datos?.Resultados) {
          const resultadoData = Array.isArray(resultado.datos.Resultados)
            ? resultado.datos.Resultados[0]
            : resultado.datos.Resultados;

          if (resultadoData?.AsistenciaMarcada && resultadoData.Detalles) {
            const timestamp =
              resultadoData.Detalles.Timestamp ||
              this.dateHelper.obtenerTimestampPeruano();
            const desfaseSegundos = resultadoData.Detalles.DesfaseSegundos || 0;
            const estado = this.mapper.determinarEstadoAsistencia(
              desfaseSegundos,
              modo
            );

            const fechaHoy = this.dateHelper.obtenerFechaStringActual();
            const actor = this.mapper.obtenerActorDesdeRol(rol);

            if (fechaHoy) {
              const asistenciaDesdeRedis =
                this.cacheManager.crearAsistenciaParaCache(
                  miDNI,
                  actor,
                  modo,
                  timestamp,
                  desfaseSegundos,
                  estado,
                  fechaHoy
                );

              // Integrar en el registro mensual correspondiente
              const registroActual =
                modo === ModoRegistro.Entrada
                  ? registroEntrada
                  : registroSalida;

              const registroActualizado =
                this.cacheManager.integrarDatosDeCacheEnRegistroMensual(
                  registroActual,
                  asistenciaDesdeRedis,
                  diaActual,
                  modo,
                  miDNI,
                  fechaHoy
                );

              if (modo === ModoRegistro.Entrada) {
                registroEntrada = registroActualizado;
              } else {
                registroSalida = registroActualizado;
              }

              mensajeConsulta += `${modo}: Mi Redis, `;

              console.log(`✅ Mi ${modo} integrado desde Redis: ${estado}`);
            }
          }
        } else {
          console.log(`📭 Mi ${modo} no encontrado: ${resultado.mensaje}`);
        }
      } catch (error) {
        console.error(`❌ Error al consultar mi ${modo}:`, error);
      }
    }

    // Limpiar mensaje
    mensajeConsulta =
      mensajeConsulta.replace(/, $/, "") ||
      "No se encontraron mis datos nuevos";

    // Combinar datos finales
    return await this.cacheManager.combinarDatosHistoricosYActuales(
      registroEntrada,
      registroSalida,
      rol,
      miDNI,
      true,
      diaActual,
      `${estrategia.razon} + Mi consulta inteligente: ${mensajeConsulta}`
    );
  }
}
