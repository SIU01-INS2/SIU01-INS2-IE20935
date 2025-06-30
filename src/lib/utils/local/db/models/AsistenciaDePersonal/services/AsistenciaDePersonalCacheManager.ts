/* eslint-disable @typescript-eslint/no-explicit-any */
import { Meses } from "@/interfaces/shared/Meses";
import {
  OperationResult,
  ActoresSistema,
  ModoRegistro,
  TipoAsistencia,
  EstadosAsistenciaPersonal,
  RolesSistema,
  AsistenciaMensualPersonalLocal,
  RegistroEntradaSalida,
} from "../AsistenciaDePersonalTypes";
import {
  AsistenciaPersonalHoy,
  AsistenciasTomadasHoyIDB,
  ConsultaAsistenciaHoy,
} from "../../AsistenciasTomadasHoy/AsistenciasTomadasHoyIDB";
import { AsistenciaDePersonalDateHelper } from "./AsistenciaDePersonalDateHelper";
import { AsistenciaDePersonalMapper } from "./AsistenciaDePersonalMapper";
import IndexedDBConnection from "../../../IndexedDBConnection";
import { AsistenciaDePersonalAPIClient } from "./AsistenciaDePersonalAPIClient";
import { AsistenciaDePersonalValidator } from "./AsistenciaDePersonalValidator";

/**
 * 🎯 RESPONSABILIDAD: Manejo del cache de asistencias
 * - Gestionar cache de asistencias de hoy (Redis local)
 * - Integrar datos del cache con registros mensuales
 * - Consultar y actualizar cache
 * - Limpiar cache obsoleto
 * - 🆕 ELIMINAR AUTOMÁTICAMENTE registros del día anterior en cada operación CRUD
 */
export class AsistenciaDePersonalCacheManager {
  private cacheAsistenciasHoy: AsistenciasTomadasHoyIDB;
  private mapper: AsistenciaDePersonalMapper;
  private dateHelper: AsistenciaDePersonalDateHelper;
  private ultimaLimpiezaDiaAnterior: string | null = null; // 🆕 Evita limpiezas duplicadas
  private apiClient: AsistenciaDePersonalAPIClient;
  private validator: AsistenciaDePersonalValidator;

  constructor(
    mapper: AsistenciaDePersonalMapper,
    dateHelper: AsistenciaDePersonalDateHelper,
    apiClient: AsistenciaDePersonalAPIClient,
    validator: AsistenciaDePersonalValidator
  ) {
    this.mapper = mapper;
    this.dateHelper = dateHelper;
    this.apiClient = apiClient;
    this.cacheAsistenciasHoy = new AsistenciasTomadasHoyIDB(this.dateHelper);
    this.validator = validator;
    this.limpiarControlesRedisAntiguos();
    // Inicializar rutinas de mantenimiento del cache
    // this.cacheAsistenciasHoy.inicializarMantenimiento();
  }

  private async limpiarDiasAnterioresAutomaticamente(): Promise<void> {
    try {
      const fechaHoy = this.dateHelper.obtenerFechaStringActual();

      if (!fechaHoy) {
        console.warn(
          "⚠️ No se pudo obtener la fecha actual para limpieza automática"
        );
        return;
      }

      // 🚀 OPTIMIZACIÓN: Evitar limpiezas duplicadas el mismo día
      if (this.ultimaLimpiezaDiaAnterior === fechaHoy) {
        console.log(
          `⏭️ Limpieza de días anteriores ya ejecutada hoy: ${fechaHoy}`
        );
        return;
      }

      console.log(
        `🧹 Limpiando TODAS las asistencias anteriores a: ${fechaHoy}`
      );

      // ✅ UNA SOLA LLAMADA elimina todo lo anterior al día de hoy
      const eliminadas =
        await this.cacheAsistenciasHoy.limpiarAsistenciasAnterioresA(fechaHoy);

      // 📝 MARCAR como ejecutada para evitar duplicados
      this.ultimaLimpiezaDiaAnterior = fechaHoy;

      console.log(
        `✅ Limpieza automática completada: ${eliminadas} registros eliminados`
      );
    } catch (error) {
      console.error(
        "❌ Error en limpieza automática de días anteriores:",
        error
      );
    }
  }

  /**
   * ✅ CORREGIDO: Consulta cache con fecha correcta
   */
  public async consultarCacheAsistenciaHoy(
    actor: ActoresSistema,
    modoRegistro: ModoRegistro,
    id_o_dni: string,
    fecha: string
  ): Promise<AsistenciaPersonalHoy | null> {
    try {
      // 🆕 LIMPIAR día anterior automáticamente
      await this.limpiarDiasAnterioresAutomaticamente();

      const consulta: ConsultaAsistenciaHoy = {
        id_o_dni,
        actor,
        modoRegistro,
        tipoAsistencia: TipoAsistencia.ParaPersonal,
        fecha,
      };

      console.log(
        `🔍 Consultando cache con fecha VERIFICADA: ${fecha} - ${actor} - ${modoRegistro} - ${id_o_dni}`
      );

      const resultado = await this.cacheAsistenciasHoy.consultarAsistencia(
        consulta
      );

      if (resultado) {
        console.log(
          `✅ Encontrado en cache: ${id_o_dni} - ${modoRegistro} - ${fecha} - ${
            (resultado as AsistenciaPersonalHoy).estado
          }`
        );
      } else {
        console.log(
          `❌ No encontrado en cache: ${id_o_dni} - ${modoRegistro} - ${fecha}`
        );
      }

      return resultado as AsistenciaPersonalHoy | null;
    } catch (error) {
      console.error("Error al consultar cache de asistencias:", error);
      return null;
    }
  }

  /**
   * Guarda asistencia en el cache
   * 🆕 INCLUYE limpieza automática del día anterior
   */
  public async guardarAsistenciaEnCache(
    asistencia: AsistenciaPersonalHoy
  ): Promise<OperationResult> {
    try {
      // 🆕 LIMPIAR día anterior automáticamente
      await this.limpiarDiasAnterioresAutomaticamente();

      await this.cacheAsistenciasHoy.guardarAsistencia(asistencia);

      return {
        exitoso: true,
        mensaje: "Asistencia guardada en cache exitosamente",
        datos: asistencia.clave,
      };
    } catch (error) {
      console.error("Error al guardar asistencia en cache:", error);
      return {
        exitoso: false,
        mensaje: `Error al guardar en cache: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * ✅ NUEVO: Integra datos directos de Redis con registros históricos
   */
  public async integrarDatosDirectosDeRedis(
    registroEntrada: AsistenciaMensualPersonalLocal | null,
    registroSalida: AsistenciaMensualPersonalLocal | null,
    datosRedis: {
      entrada?: any;
      salida?: any;
      encontradoEntrada: boolean;
      encontradoSalida: boolean;
    },
    rol: RolesSistema,
    id_o_dni: string | number,
    diaActual: number
  ): Promise<{
    entrada?: AsistenciaMensualPersonalLocal;
    salida?: AsistenciaMensualPersonalLocal;
    integrado: boolean;
    mensaje: string;
  }> {
    try {
      await this.limpiarDiasAnterioresAutomaticamente();

      let entradaFinal = registroEntrada;
      let salidaFinal = registroSalida;
      let integrado = false;

      const fechaHoy = this.dateHelper.obtenerFechaStringActual();
      if (!fechaHoy) {
        return {
          entrada: entradaFinal || undefined,
          salida: salidaFinal || undefined,
          integrado: false,
          mensaje: "No se pudo obtener fecha actual",
        };
      }

      const actor = this.mapper.obtenerActorDesdeRol(rol);

      // Integrar entrada desde Redis
      if (datosRedis.encontradoEntrada && datosRedis.entrada?.Resultados) {
        const resultado = Array.isArray(datosRedis.entrada.Resultados)
          ? datosRedis.entrada.Resultados[0]
          : datosRedis.entrada.Resultados;

        if (resultado?.AsistenciaMarcada && resultado.Detalles) {
          const timestamp =
            resultado.Detalles.Timestamp ||
            this.dateHelper.obtenerTimestampPeruano();
          const desfaseSegundos = resultado.Detalles.DesfaseSegundos || 0;
          const estado = this.mapper.determinarEstadoAsistencia(
            desfaseSegundos,
            ModoRegistro.Entrada
          );

          // ✅ CREAR Y GUARDAR EN CACHE LOCAL
          const asistenciaEntrada = this.crearAsistenciaParaCache(
            String(id_o_dni),
            actor,
            ModoRegistro.Entrada,
            timestamp,
            desfaseSegundos,
            estado,
            fechaHoy
          );

          await this.guardarAsistenciaEnCache(asistenciaEntrada);

          // ✅ INTEGRAR EN REGISTRO MENSUAL
          entradaFinal = this.integrarDatosDeCacheEnRegistroMensual(
            entradaFinal,
            asistenciaEntrada,
            diaActual,
            ModoRegistro.Entrada,
            id_o_dni,
            fechaHoy
          );

          integrado = true;
          console.log(
            `✅ Entrada integrada desde Redis y guardada en cache: ${estado}`
          );
        }
      }

      // Integrar salida desde Redis
      if (datosRedis.encontradoSalida && datosRedis.salida?.Resultados) {
        const resultado = Array.isArray(datosRedis.salida.Resultados)
          ? datosRedis.salida.Resultados[0]
          : datosRedis.salida.Resultados;

        if (resultado?.AsistenciaMarcada && resultado.Detalles) {
          const timestamp =
            resultado.Detalles.Timestamp ||
            this.dateHelper.obtenerTimestampPeruano();
          const desfaseSegundos = resultado.Detalles.DesfaseSegundos || 0;
          const estado = this.mapper.determinarEstadoAsistencia(
            desfaseSegundos,
            ModoRegistro.Salida
          );

          // ✅ CREAR Y GUARDAR EN CACHE LOCAL
          const asistenciaSalida = this.crearAsistenciaParaCache(
            String(id_o_dni),
            actor,
            ModoRegistro.Salida,
            timestamp,
            desfaseSegundos,
            estado,
            fechaHoy
          );

          await this.guardarAsistenciaEnCache(asistenciaSalida);

          // ✅ INTEGRAR EN REGISTRO MENSUAL
          salidaFinal = this.integrarDatosDeCacheEnRegistroMensual(
            salidaFinal,
            asistenciaSalida,
            diaActual,
            ModoRegistro.Salida,
            id_o_dni,
            fechaHoy
          );

          integrado = true;
          console.log(
            `✅ Salida integrada desde Redis y guardada en cache: ${estado}`
          );
        }
      }

      const mensaje = integrado
        ? "Datos integrados desde Redis y guardados en cache local"
        : "No se encontraron datos nuevos en Redis";

      return {
        entrada: entradaFinal || undefined,
        salida: salidaFinal || undefined,
        integrado,
        mensaje,
      };
    } catch (error) {
      console.error("❌ Error al integrar datos directos de Redis:", error);
      return {
        entrada: registroEntrada || undefined,
        salida: registroSalida || undefined,
        integrado: false,
        mensaje: `Error en integración: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * Integra datos del cache en el registro mensual
   * ✅ SIN CAMBIOS: No requiere limpieza adicional
   */
  public integrarDatosDeCacheEnRegistroMensual(
    registroMensual: AsistenciaMensualPersonalLocal | null,
    datosCache: AsistenciaPersonalHoy,
    diaActual: number,
    modoRegistro: ModoRegistro,
    id_o_dni: string | number,
    fecha: string
  ): AsistenciaMensualPersonalLocal {
    // Si no existe registro mensual, crear uno nuevo
    if (!registroMensual) {
      const fechaObj = new Date(fecha);
      const mes = (fechaObj.getMonth() + 1) as Meses;

      console.log(
        `📝 Creando nuevo registro mensual para ${id_o_dni} - mes ${mes}`
      );

      registroMensual = {
        Id_Registro_Mensual: 0, // ID temporal
        mes,
        ID_o_DNI_Personal: String(id_o_dni),
        registros: {},
        ultima_fecha_actualizacion: this.dateHelper.obtenerTimestampPeruano(),
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
   * Combina datos históricos (IndexedDB) con datos del día actual (cache Redis)
   * 🆕 INCLUYE limpieza automática del día anterior
   */
  public async combinarDatosHistoricosYActuales(
    registroEntrada: AsistenciaMensualPersonalLocal | null,
    registroSalida: AsistenciaMensualPersonalLocal | null,
    rol: RolesSistema,
    id_o_dni: string | number,
    esConsultaMesActual: boolean,
    diaActual: number,
    mensajeBase: string
  ): Promise<{
    entrada?: AsistenciaMensualPersonalLocal;
    salida?: AsistenciaMensualPersonalLocal;
    encontrado: boolean;
    mensaje: string;
  }> {
    // 🆕 LIMPIAR día anterior automáticamente
    await this.limpiarDiasAnterioresAutomaticamente();

    let entradaFinal = registroEntrada;
    let salidaFinal = registroSalida;
    let encontradoEnCache = false;

    // Integración cache: Solo para consultas del mes actual
    if (esConsultaMesActual) {
      console.log(
        `🔍 Consultando cache Redis para el día actual (${diaActual})...`
      );

      const actor = this.mapper.obtenerActorDesdeRol(rol);
      const fechaHoy = this.dateHelper.obtenerFechaStringActual();

      if (fechaHoy) {
        // Consultar cache para entrada y salida del día actual
        const [entradaCache, salidaCache] = await Promise.all([
          this.consultarCacheAsistenciaHoyDirecto(
            actor,
            ModoRegistro.Entrada,
            id_o_dni,
            fechaHoy
          ),
          this.consultarCacheAsistenciaHoyDirecto(
            actor,
            ModoRegistro.Salida,
            id_o_dni,
            fechaHoy
          ),
        ]);

        // Integrar entrada desde cache
        if (entradaCache) {
          console.log(`📱 Entrada del día actual encontrada en cache`);
          entradaFinal = this.integrarDatosDeCacheEnRegistroMensual(
            entradaFinal,
            entradaCache,
            diaActual,
            ModoRegistro.Entrada,
            id_o_dni,
            fechaHoy
          );
          encontradoEnCache = true;
        }

        // Integrar salida desde cache
        if (salidaCache) {
          console.log(`📱 Salida del día actual encontrada en cache`);
          salidaFinal = this.integrarDatosDeCacheEnRegistroMensual(
            salidaFinal,
            salidaCache,
            diaActual,
            ModoRegistro.Salida,
            id_o_dni,
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

  // ✅ NUEVO: Control centralizado de consultas Redis
  private static consultasRedisControlGlobal: Map<string, number> = new Map();

  /**
   * ✅ NUEVO: Verifica si ya se consultó Redis para esta persona/fecha/rango
   */
  private generarClaveControlRedis(
    id_o_dni: string | number,
    fecha: string,
    rango: string
  ): string {
    return `redis_control:${fecha}:${rango}:${id_o_dni}`;
  }

  /**
   * ✅ NUEVO: Verifica si ya se consultó Redis en este rango
   */
  public yaSeConsultoRedisEnRango(
    id_o_dni: string | number,
    estrategia: string
  ): {
    yaConsultado: boolean;
    ultimaConsulta: number | null;
    razon: string;
  } {
    const fechaHoy = this.dateHelper.obtenerFechaStringActual();
    const rangoActual =
      this.dateHelper.obtenerRangoHorarioActualConConstantes();

    if (!fechaHoy) {
      return {
        yaConsultado: false,
        ultimaConsulta: null,
        razon: "No se pudo obtener fecha actual",
      };
    }

    const claveControl = this.generarClaveControlRedis(
      id_o_dni,
      fechaHoy,
      rangoActual.rango
    );
    const ultimaConsulta =
      AsistenciaDePersonalCacheManager.consultasRedisControlGlobal.get(
        claveControl
      );

    if (!ultimaConsulta) {
      return {
        yaConsultado: false,
        ultimaConsulta: null,
        razon: `Primera consulta Redis para ${estrategia} en rango ${rangoActual.rango}`,
      };
    }

    const controlRango =
      this.dateHelper.yaSeConsultoEnRangoActual(ultimaConsulta);

    return {
      yaConsultado: controlRango.yaConsultado,
      ultimaConsulta,
      razon: `${controlRango.razon} (control global)`,
    };
  }

  /**
   * ✅ NUEVO: Marca que se consultó Redis en este momento
   */
  public marcarConsultaRedisRealizada(id_o_dni: string | number): void {
    const fechaHoy = this.dateHelper.obtenerFechaStringActual();
    const rangoActual =
      this.dateHelper.obtenerRangoHorarioActualConConstantes();
    const timestampActual = this.dateHelper.obtenerTimestampPeruano();

    if (fechaHoy) {
      const claveControl = this.generarClaveControlRedis(
        id_o_dni,
        fechaHoy,
        rangoActual.rango
      );
      AsistenciaDePersonalCacheManager.consultasRedisControlGlobal.set(
        claveControl,
        timestampActual
      );

      console.log(
        `🔒 Consulta Redis marcada: ${claveControl} - ${this.dateHelper.formatearTimestampLegible(
          timestampActual
        )}`
      );
    }
  }

  /**
   * ✅ NUEVO: Limpia controles de consultas de días anteriores
   */
  public limpiarControlesRedisAntiguos(): void {
    const fechaHoy = this.dateHelper.obtenerFechaStringActual();
    if (!fechaHoy) return;

    const clavesAEliminar: string[] = [];

    for (const [
      clave,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      timestamp,
    ] of AsistenciaDePersonalCacheManager.consultasRedisControlGlobal.entries()) {
      if (clave.includes("redis_control:") && !clave.includes(fechaHoy)) {
        clavesAEliminar.push(clave);
      }
    }

    clavesAEliminar.forEach((clave) => {
      AsistenciaDePersonalCacheManager.consultasRedisControlGlobal.delete(
        clave
      );
    });

    if (clavesAEliminar.length > 0) {
      console.log(
        `🧹 Limpieza controles Redis antiguos: ${clavesAEliminar.length} eliminados`
      );
    }
  }

  /**
   * 🎯 CONSULTA INTELIGENTE: Verifica cache local primero, luego Redis si es necesario
   * ✅ INTEGRACIÓN COMPLETA con AsistenciasTomadasHoyIDB según flowchart
   */
  public async consultarAsistenciaConFallbackRedis(
    rol: RolesSistema,
    id_o_dni: string | number,
    modoRegistro: ModoRegistro,
    estrategia: "REDIS_ENTRADAS" | "REDIS_COMPLETO"
  ): Promise<{
    encontrado: boolean;
    datos?: AsistenciaPersonalHoy;
    fuente: "CACHE_LOCAL" | "REDIS" | "NO_ENCONTRADO";
    mensaje: string;
  }> {
    try {
      // 🆕 LIMPIAR día anterior automáticamente
      await this.limpiarDiasAnterioresAutomaticamente();

      const actor = this.mapper.obtenerActorDesdeRol(rol);
      const fechaHoy = this.dateHelper.obtenerFechaStringActual();

      if (!fechaHoy) {
        return {
          encontrado: false,
          fuente: "NO_ENCONTRADO",
          mensaje: "No se pudo obtener fecha actual",
        };
      }

      console.log(
        `🔍 Consulta inteligente: ${id_o_dni} - ${modoRegistro} - estrategia: ${estrategia}`
      );

      // PASO 1: Consultar cache local (AsistenciasTomadasHoy)
      const datosCache = await this.consultarCacheAsistenciaHoyDirecto(
        actor,
        modoRegistro,
        id_o_dni,
        fechaHoy
      );

      if (datosCache) {
        console.log(
          `✅ Encontrado en cache local: ${datosCache.estado} (${datosCache.dni})`
        );
        return {
          encontrado: true,
          datos: datosCache,
          fuente: "CACHE_LOCAL",
          mensaje: "Datos obtenidos de cache local",
        };
      }

      // PASO 2: Validar si debe consultar Redis según estrategia
      const debeConsultarTipoRegistro =
        estrategia === "REDIS_COMPLETO" ||
        (estrategia === "REDIS_ENTRADAS" &&
          modoRegistro === ModoRegistro.Entrada);

      if (!debeConsultarTipoRegistro) {
        console.log(
          `⏭️ No corresponde consultar ${modoRegistro} con estrategia ${estrategia}`
        );
        return {
          encontrado: false,
          fuente: "NO_ENCONTRADO",
          mensaje: `${modoRegistro} no incluido en estrategia ${estrategia}`,
        };
      }

      // PASO 3: Consultar Redis como fallback
      console.log(`☁️ Consultando Redis como fallback para ${modoRegistro}...`);

      const resultadoRedis = await this.apiClient.consultarRedisEspecifico(
        rol,
        id_o_dni,
        modoRegistro
      );

      if (resultadoRedis.encontrado && resultadoRedis.datos?.Resultados) {
        const resultado = Array.isArray(resultadoRedis.datos.Resultados)
          ? resultadoRedis.datos.Resultados[0]
          : resultadoRedis.datos.Resultados;

        if (resultado?.AsistenciaMarcada && resultado.Detalles) {
          // Crear asistencia desde datos de Redis
          const timestamp =
            resultado.Detalles.Timestamp ||
            this.dateHelper.obtenerTimestampPeruano();
          const desfaseSegundos = resultado.Detalles.DesfaseSegundos || 0;
          const estado = this.mapper.determinarEstadoAsistencia(
            desfaseSegundos,
            modoRegistro
          );

          const asistenciaDesdeRedis = this.crearAsistenciaParaCache(
            String(id_o_dni),
            actor,
            modoRegistro,
            timestamp,
            desfaseSegundos,
            estado,
            fechaHoy
          );

          // Guardar en cache local para próximas consultas
          await this.guardarAsistenciaEnCache(asistenciaDesdeRedis);

          console.log(
            `✅ Encontrado en Redis y guardado en cache: ${estado} (${id_o_dni})`
          );

          return {
            encontrado: true,
            datos: asistenciaDesdeRedis,
            fuente: "REDIS",
            mensaje: "Datos obtenidos de Redis y guardados en cache local",
          };
        }
      }

      console.log(`📭 No encontrado ni en cache local ni en Redis`);
      return {
        encontrado: false,
        fuente: "NO_ENCONTRADO",
        mensaje: "No se encontró asistencia ni en cache local ni en Redis",
      };
    } catch (error) {
      console.error("❌ Error en consulta inteligente:", error);
      return {
        encontrado: false,
        fuente: "NO_ENCONTRADO",
        mensaje: `Error en consulta: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * 🆕 MÉTODO DIRECTO de consulta al cache sin limpieza automática
   * 🎯 PROPÓSITO: Evitar llamadas recursivas de limpieza
   */
  public async consultarCacheAsistenciaHoyDirecto(
    actor: ActoresSistema,
    modoRegistro: ModoRegistro,
    id_o_dni: string | number,
    fecha: string
  ): Promise<AsistenciaPersonalHoy | null> {
    try {
      const consulta: ConsultaAsistenciaHoy = {
        id_o_dni,
        actor,
        modoRegistro,
        tipoAsistencia: TipoAsistencia.ParaPersonal,
        fecha,
      };

      const resultado = await this.cacheAsistenciasHoy.consultarAsistencia(
        consulta
      );

      return resultado as AsistenciaPersonalHoy | null;
    } catch (error) {
      console.error(
        "Error al consultar cache de asistencias (directo):",
        error
      );
      return null;
    }
  }

  /**
   * Obtiene solo datos del día actual cuando no hay datos históricos
   * 🆕 INCLUYE limpieza automática del día anterior
   */
  public async obtenerSoloDatosDelDiaActual(
    rol: RolesSistema,
    id_o_dni: string | number,
    diaActual: number
  ): Promise<{
    entrada?: AsistenciaMensualPersonalLocal;
    salida?: AsistenciaMensualPersonalLocal;
    encontrado: boolean;
    mensaje: string;
  }> {
    // 🆕 LIMPIAR día anterior automáticamente
    await this.limpiarDiasAnterioresAutomaticamente();

    const actor = this.mapper.obtenerActorDesdeRol(rol);
    const fechaHoy = this.dateHelper.obtenerFechaStringActual();

    if (!fechaHoy) {
      return {
        encontrado: false,
        mensaje: "No se pudo obtener la fecha actual",
      };
    }

    console.log(
      `🔍 Buscando datos del día actual en cache para ${id_o_dni} - ${fechaHoy}`
    );

    const [entradaCache, salidaCache] = await Promise.all([
      this.consultarCacheAsistenciaHoyDirecto(
        actor,
        ModoRegistro.Entrada,
        id_o_dni,
        fechaHoy
      ),
      this.consultarCacheAsistenciaHoyDirecto(
        actor,
        ModoRegistro.Salida,
        id_o_dni,
        fechaHoy
      ),
    ]);

    let entrada: AsistenciaMensualPersonalLocal | undefined;
    let salida: AsistenciaMensualPersonalLocal | undefined;

    if (entradaCache) {
      entrada = this.integrarDatosDeCacheEnRegistroMensual(
        null,
        entradaCache,
        diaActual,
        ModoRegistro.Entrada,
        id_o_dni,
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
        id_o_dni,
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
        `❌ No se encontraron datos del día actual en cache para ${id_o_dni}`
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
   * Crea asistencia para el cache a partir de datos de registro
   * ✅ SIN CAMBIOS: No requiere limpieza adicional
   */
  public crearAsistenciaParaCache(
    dni: string,
    rol: ActoresSistema | RolesSistema,
    modoRegistro: ModoRegistro,
    timestamp: number,
    desfaseSegundos: number,
    estado: EstadosAsistenciaPersonal,
    fecha: string
  ): AsistenciaPersonalHoy {
    const clave = this.mapper.generarClaveCache(
      rol as ActoresSistema,
      modoRegistro,
      dni,
      fecha
    );

    return {
      clave,
      dni,
      actor: rol as ActoresSistema,
      modoRegistro,
      tipoAsistencia: TipoAsistencia.ParaPersonal,
      timestamp,
      desfaseSegundos,
      estado,
      fecha,
      timestampConsulta: this.dateHelper.obtenerTimestampPeruano(),
    };
  }

  /**
   * Elimina asistencia del cache de asistencias de hoy
   * 🆕 INCLUYE limpieza automática del día anterior
   */
  public async eliminarAsistenciaDelCache(
    id_o_dni: string | number,
    rol: RolesSistema,
    modoRegistro: ModoRegistro,
    fecha: string
  ): Promise<OperationResult> {
    try {
      // 🆕 LIMPIAR día anterior automáticamente
      await this.limpiarDiasAnterioresAutomaticamente();

      const actor = this.mapper.obtenerActorDesdeRol(rol);
      const consulta: ConsultaAsistenciaHoy = {
        id_o_dni,
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
          `🗄️ No se encontró asistencia en cache para ${id_o_dni} - ${modoRegistro} - ${fecha}`
        );
        return {
          exitoso: false,
          mensaje: "No se encontró la asistencia en el cache",
        };
      }

      // Eliminar del cache usando la clave
      const clave = this.mapper.generarClaveCache(
        actor,
        modoRegistro,
        id_o_dni,
        fecha
      );
      await this.eliminarAsistenciaEspecificaDelCache(clave);

      console.log(`✅ Asistencia eliminada del cache: ${clave}`);
      return {
        exitoso: true,
        mensaje: "Asistencia eliminada del cache exitosamente",
        datos: clave,
      };
    } catch (error) {
      console.error("Error al eliminar asistencia del cache:", error);
      return {
        exitoso: false,
        mensaje: `Error al eliminar del cache: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * Elimina una asistencia específica del cache por clave
   * ✅ SIN CAMBIOS: Método auxiliar que no requiere limpieza
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
   * Limpia el cache de asistencias vencidas
   * 🆕 INCLUYE limpieza automática del día anterior
   */
  public async limpiarCacheVencido(): Promise<OperationResult> {
    try {
      // 🆕 LIMPIAR día anterior automáticamente
      await this.limpiarDiasAnterioresAutomaticamente();

      // El cache se auto-limpia, pero podemos forzar la limpieza
      const ahora = Date.now();
      const TIEMPO_EXPIRACION = 24 * 60 * 60 * 1000; // 24 horas

      await IndexedDBConnection.init();
      const store = await IndexedDBConnection.getStore(
        "asistencias_tomadas_hoy",
        "readwrite"
      );

      return new Promise((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = () => {
          const registros = request.result as AsistenciaPersonalHoy[];
          let eliminados = 0;

          const promesasEliminacion = registros
            .filter((registro) => {
              const tiempoTranscurrido = ahora - registro.timestampConsulta;
              return tiempoTranscurrido > TIEMPO_EXPIRACION;
            })
            .map((registro) => {
              eliminados++;
              return this.eliminarAsistenciaEspecificaDelCache(registro.clave);
            });

          Promise.all(promesasEliminacion)
            .then(() => {
              resolve({
                exitoso: true,
                mensaje: `Cache limpiado: ${eliminados} registros eliminados`,
                datos: { eliminados },
              });
            })
            .catch((error) => {
              reject(error);
            });
        };

        request.onerror = (event) => {
          reject(
            new Error(
              `Error al obtener registros del cache: ${
                (event.target as IDBRequest).error
              }`
            )
          );
        };
      });
    } catch (error) {
      console.error("Error al limpiar cache vencido:", error);
      return {
        exitoso: false,
        mensaje: `Error al limpiar cache: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * Obtiene estadísticas del cache
   * 🆕 INCLUYE limpieza automática del día anterior
   */
  public async obtenerEstadisticasCache(): Promise<{
    totalRegistros: number;
    registrosHoy: number;
    registrosVencidos: number;
  }> {
    try {
      // 🆕 LIMPIAR día anterior automáticamente
      await this.limpiarDiasAnterioresAutomaticamente();

      await IndexedDBConnection.init();
      const store = await IndexedDBConnection.getStore(
        "asistencias_tomadas_hoy",
        "readonly"
      );

      return new Promise((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = () => {
          const registros = request.result as AsistenciaPersonalHoy[];
          const ahora = Date.now();
          const TIEMPO_EXPIRACION = 24 * 60 * 60 * 1000; // 24 horas
          const fechaHoy = this.dateHelper.obtenerFechaStringActual();

          let registrosHoy = 0;
          let registrosVencidos = 0;

          registros.forEach((registro) => {
            if (registro.fecha === fechaHoy) {
              registrosHoy++;
            }

            const tiempoTranscurrido = ahora - registro.timestampConsulta;
            if (tiempoTranscurrido > TIEMPO_EXPIRACION) {
              registrosVencidos++;
            }
          });

          resolve({
            totalRegistros: registros.length,
            registrosHoy,
            registrosVencidos,
          });
        };

        request.onerror = (event) => {
          reject(
            new Error(
              `Error al obtener estadísticas del cache: ${
                (event.target as IDBRequest).error
              }`
            )
          );
        };
      });
    } catch (error) {
      console.error("Error al obtener estadísticas del cache:", error);
      return {
        totalRegistros: 0,
        registrosHoy: 0,
        registrosVencidos: 0,
      };
    }
  }

  /**
   * 🆕 MÉTODO PÚBLICO para forzar limpieza del día anterior
   * 🎯 ÚTIL: Para casos donde se necesite limpiar manualmente
   */
  public async forzarLimpiezaDiaAnterior(): Promise<OperationResult> {
    try {
      const fechaHoy = this.dateHelper.obtenerFechaStringActual();
      if (!fechaHoy) {
        return {
          exitoso: false,
          mensaje: "No se pudo obtener la fecha actual",
        };
      }

      const fechaHoyObj = new Date(fechaHoy);
      const fechaAyer = new Date(fechaHoyObj);
      fechaAyer.setDate(fechaHoyObj.getDate() - 1);

      const fechaAyerString = fechaAyer.toISOString().split("T")[0];

      console.log(`🧹 Forzando limpieza del día anterior: ${fechaAyerString}`);

      await this.cacheAsistenciasHoy.limpiarAsistenciasPorFecha(
        fechaAyerString
      );

      // Resetear el control de limpieza para permitir la próxima automática
      this.ultimaLimpiezaDiaAnterior = null;

      return {
        exitoso: true,
        mensaje: `Limpieza forzada completada para: ${fechaAyerString}`,
        datos: { fechaLimpiada: fechaAyerString },
      };
    } catch (error) {
      console.error("Error al forzar limpieza del día anterior:", error);
      return {
        exitoso: false,
        mensaje: `Error al forzar limpieza: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * 🆕 MÉTODO PÚBLICO para obtener información de limpieza
   * 📊 PROPÓSITO: Monitoreo y depuración del sistema de limpieza automática
   */
  public obtenerInfoLimpiezaAutomatica(): {
    ultimaLimpiezaDiaAnterior: string | null;
    fechaHoy: string | null;
    requiereLimpieza: boolean;
  } {
    const fechaHoy = this.dateHelper.obtenerFechaStringActual();
    const requiereLimpieza = this.ultimaLimpiezaDiaAnterior !== fechaHoy;

    return {
      ultimaLimpiezaDiaAnterior: this.ultimaLimpiezaDiaAnterior,
      fechaHoy,
      requiereLimpieza,
    };
  }
}
