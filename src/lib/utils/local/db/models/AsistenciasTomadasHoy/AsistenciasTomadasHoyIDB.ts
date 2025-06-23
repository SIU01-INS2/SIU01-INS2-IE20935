import IndexedDBConnection from "../../IndexedDBConnection";
import { ActoresSistema } from "@/interfaces/shared/ActoresSistema";
import { ModoRegistro } from "@/interfaces/shared/ModoRegistroPersonal";
import { TipoAsistencia } from "@/interfaces/shared/AsistenciaRequests";
import { EstadosAsistenciaPersonal } from "@/interfaces/shared/EstadosAsistenciaPersonal";
import { EstadosAsistencia } from "@/interfaces/shared/EstadosAsistenciaEstudiantes";
import { CANTIDAD_MINUTOS_MAXIMO_PARA_DESCARTE_ASISTENCIAS } from "@/constants/CANTIDAD_MINUTOS_MAXIMO_PARA_DESCARTE_ASISTENCIAS";
import { TablasLocal } from "@/interfaces/shared/TablasSistema";
import { AsistenciaDePersonalDateHelper } from "../AsistenciaDePersonal/services/AsistenciaDePersonalDateHelper";
import {
  SEGUNDOS_TOLERANCIA_ENTRADA_PERSONAL,
  SEGUNDOS_TOLERANCIA_SALIDA_PERSONAL,
} from "@/constants/MINUTOS_TOLERANCIA_ASISTENCIA_PERSONAL";

// ✅ INTERFAZ: Estructura base para asistencias
interface AsistenciaHoyBase {
  clave: string; // Clave única: fecha:modo:actor:dni[:extras]
  dni: string;
  actor: ActoresSistema;
  modoRegistro: ModoRegistro;
  tipoAsistencia: TipoAsistencia;
  fecha: string; // YYYY-MM-DD
  timestampConsulta: number; // Momento en que se consultó desde Redis (timestamp peruano)
}

// ✅ INTERFAZ: Asistencia de personal
export interface AsistenciaPersonalHoy extends AsistenciaHoyBase {
  timestamp: number; // Momento del registro de entrada/salida
  desfaseSegundos: number;
  estado: EstadosAsistenciaPersonal;
}

// ✅ INTERFAZ: Asistencia de estudiante
export interface AsistenciaEstudianteHoy extends AsistenciaHoyBase {
  estado: EstadosAsistencia;
  nivelEducativo?: string;
  grado?: string;
  seccion?: string;
}

// ✅ TIPO UNIÓN: Para manejar ambos tipos
export type AsistenciaHoy = AsistenciaPersonalHoy | AsistenciaEstudianteHoy;

// ✅ INTERFAZ: Para consultas específicas
export interface ConsultaAsistenciaHoy {
  id_o_dni: string | number;
  actor: ActoresSistema;
  modoRegistro: ModoRegistro;
  tipoAsistencia: TipoAsistencia;
  fecha?: string; // Opcional, por defecto hoy
  nivelEducativo?: string; // Para estudiantes
  grado?: string; // Para estudiantes
  seccion?: string; // Para estudiantes
}

/**
 * ✅ CLASE: Gestiona las asistencias tomadas en el día actual
 * 🎯 PROPÓSITO: Evitar consultas excesivas a Redis almacenando temporalmente los datos
 * ⏰ LÓGICA: Implementa descarte automático después del tiempo establecido
 * 📁 TABLA: asistencias_tomadas_hoy (solo local, no se sincroniza)
 *
 * ✅ CORREGIDO:
 * - Toda lógica temporal delegada a DateHelper (SRP)
 * - Timestamps peruanos consistentes desde Redux
 * - Mantenimiento optimizado con horarios reales
 * - Logging mejorado con timestamps legibles
 */
export class AsistenciasTomadasHoyIDB {
  private nombreTabla: string = TablasLocal.Tabla_Asistencias_Tomadas_Hoy;
  private dateHelper: AsistenciaDePersonalDateHelper; // ✅ NUEVO: Dependencia de DateHelper
  private intervalos: NodeJS.Timeout[] = []; // ✅ NUEVO: Para limpiar intervalos

  constructor(dateHelper: AsistenciaDePersonalDateHelper) {
    // ✅ NUEVO: Constructor con dependencia
    this.dateHelper = dateHelper;
  }

  /**
   * ✅ GENERAR CLAVE ÚNICA para identificar cada asistencia
   * 📝 FORMATO PERSONAL: fecha:modo:actor:dni
   * 📝 FORMATO ESTUDIANTE: fecha:modo:actor:dni:nivel:grado:seccion
   * 🎯 COMPATIBILIDAD: Igual formato que usa el endpoint de marcado
   * ✅ CORREGIDO: Usar DateHelper para obtener fecha
   */
  private generarClave(consulta: ConsultaAsistenciaHoy): string {
    // ✅ CORREGIDO: Usar DateHelper en lugar de new Date()
    const fecha =
      consulta.fecha ||
      this.dateHelper.obtenerFechaStringActual() ||
      this.obtenerFechaHoyFallback();
    const base = `${fecha}:${consulta.modoRegistro}:${consulta.actor}:${consulta.id_o_dni}`;

    // ✅ FORMATO ESTUDIANTE: Siempre incluir nivel, grado y sección
    if (consulta.actor === ActoresSistema.Estudiante) {
      const nivel = consulta.nivelEducativo || "UNKNOWN";
      const grado = consulta.grado || "0";
      const seccion = consulta.seccion || "X";
      return `${base}:${nivel}:${grado}:${seccion}`;
    }

    // ✅ FORMATO PERSONAL: Solo la clave base
    return base;
  }

  /**
   * ✅ NUEVO: Fallback para obtener fecha si DateHelper falla
   * Solo se usa como respaldo de emergencia
   */
  private obtenerFechaHoyFallback(): string {
    console.warn(
      "⚠️ Usando fallback para obtener fecha (DateHelper no disponible)"
    );
    const hoy = new Date();
    return hoy.toISOString().split("T")[0];
  }

  /**
   * ✅ VERIFICAR si una asistencia debe ser descartada por tiempo
   * 🕐 LÓGICA: Descartar si han pasado más de X minutos desde la consulta
   * ✅ CORREGIDO: Usar DateHelper para timestamp actual
   */
  private debeDescartar(
    timestampConsulta: number,
    tipoAsistencia: TipoAsistencia
  ): boolean {
    // ✅ CORREGIDO: Usar DateHelper en lugar de Date.now()
    const timestampActual = this.dateHelper.obtenerTimestampPeruano();
    const tiempoTranscurrido = timestampActual - timestampConsulta;
    const minutosTranscurridos = Math.floor(tiempoTranscurrido / (1000 * 60));

    const limitMinutos =
      CANTIDAD_MINUTOS_MAXIMO_PARA_DESCARTE_ASISTENCIAS[tipoAsistencia];

    const debeDescartar = minutosTranscurridos > limitMinutos;

    if (debeDescartar) {
      console.log(
        `⏰ Asistencia expirada: ${minutosTranscurridos}min > ${limitMinutos}min límite (consultada: ${this.dateHelper.formatearTimestampLegible(
          timestampConsulta
        )})`
      );
    }

    return debeDescartar;
  }

  /**
   * ✅ CONSULTAR asistencia en cache local
   * 🔍 RETORNA: La asistencia si existe y no debe descartarse, null en caso contrario
   * ✅ CORREGIDO: Logging mejorado con timestamps legibles
   */
  public async consultarAsistencia(
    consulta: ConsultaAsistenciaHoy
  ): Promise<AsistenciaHoy | null> {
    try {
      await IndexedDBConnection.init();
      const store = await IndexedDBConnection.getStore(
        this.nombreTabla,
        "readonly"
      );

      const clave = this.generarClave(consulta);

      return new Promise<AsistenciaHoy | null>((resolve, reject) => {
        const request = store.get(clave);

        request.onsuccess = () => {
          const asistencia = request.result as AsistenciaHoy | undefined;

          if (!asistencia) {
            console.log(`📭 No encontrada en cache: ${clave}`);
            resolve(null);
            return;
          }

          // Verificar si debe descartarse por tiempo
          if (
            this.debeDescartar(
              asistencia.timestampConsulta,
              asistencia.tipoAsistencia
            )
          ) {
            console.log(
              `⏰ Asistencia expirada en cache: ${clave} (consultada: ${this.dateHelper.formatearTimestampLegible(
                asistencia.timestampConsulta
              )})`
            );
            // Eliminar la asistencia expirada
            this.eliminarAsistencia(clave).catch(console.error);
            resolve(null);
            return;
          }

          console.log(
            `✅ Asistencia encontrada en cache: ${clave} (consultada: ${this.dateHelper.formatearTimestampLegible(
              asistencia.timestampConsulta
            )})`
          );
          resolve(asistencia);
        };

        request.onerror = () => {
          console.error(`❌ Error al consultar asistencia: ${request.error}`);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("❌ Error al consultar asistencia en cache:", error);
      return null;
    }
  }

  /**
   * ✅ GUARDAR asistencia desde datos de Redis en cache local
   * 💾 COMPATIBLE: Maneja tanto personal como estudiantes
   * 🔄 FORMATO: Adapta según el tipo de datos recibidos
   * ✅ CORREGIDO: Usar timestamp peruano para timestampConsulta
   */
  public async guardarAsistenciaDesdeRedis(
    clave: string,
    valor: string | string[], // Redis puede devolver string (estudiantes) o array (personal)
    actor: ActoresSistema,
    modoRegistro: ModoRegistro,
    tipoAsistencia: TipoAsistencia,
    dni: string,
    nivelEducativo?: string,
    grado?: string,
    seccion?: string
  ): Promise<void> {
    try {
      // ✅ CORREGIDO: Usar DateHelper para fecha y timestamp
      const fecha =
        this.dateHelper.obtenerFechaStringActual() ||
        this.obtenerFechaHoyFallback();
      const timestampConsulta = this.dateHelper.obtenerTimestampPeruano();

      let asistenciaCache: AsistenciaHoy;

      if (actor === ActoresSistema.Estudiante) {
        // ✅ ASISTENCIA DE ESTUDIANTE: El valor es un estado (string)
        const estado = valor as EstadosAsistencia;

        asistenciaCache = {
          clave,
          dni,
          actor,
          modoRegistro,
          tipoAsistencia,
          estado,
          nivelEducativo,
          grado,
          seccion,
          fecha,
          timestampConsulta,
        } as AsistenciaEstudianteHoy;
      } else {
        // ✅ ASISTENCIA DE PERSONAL: El valor es un array [timestamp, desfaseSegundos]
        const valorArray = Array.isArray(valor) ? valor : [valor, "0"];
        const timestamp = parseInt(valorArray[0]) || 0;
        const desfaseSegundos = parseInt(valorArray[1]) || 0;

        // Determinar estado basado en desfase
        const estado = this.determinarEstadoPersonal(
          desfaseSegundos,
          modoRegistro
        );

        asistenciaCache = {
          clave,
          dni,
          actor,
          modoRegistro,
          tipoAsistencia,
          timestamp,
          desfaseSegundos,
          estado,
          fecha,
          timestampConsulta,
        } as AsistenciaPersonalHoy;
      }

      await this.guardarAsistencia(asistenciaCache);
      console.log(
        `💾 Asistencia desde Redis guardada en cache: ${clave} (timestamp: ${this.dateHelper.formatearTimestampLegible(
          timestampConsulta
        )})`
      );
    } catch (error) {
      console.error("❌ Error al guardar asistencia desde Redis:", error);
      throw error;
    }
  }

  /**
   * ✅ DETERMINAR ESTADO de asistencia personal basado en desfase
   * ⏰ LÓGICA: Igual que en AsistenciaDePersonalIDB
   * ✅ SIN CAMBIOS: No maneja timestamps directamente
   */
  private determinarEstadoPersonal(
    desfaseSegundos: number,
    modoRegistro: ModoRegistro
  ): EstadosAsistenciaPersonal {
    if (modoRegistro === ModoRegistro.Entrada) {
      // ✅ CAMBIO: Solo Temprano o Tarde
      if (desfaseSegundos <= SEGUNDOS_TOLERANCIA_ENTRADA_PERSONAL) {
        return EstadosAsistenciaPersonal.Temprano; // ✅ CAMBIADO
      } else {
        return EstadosAsistenciaPersonal.Tarde; // ✅ SIN TOLERANCIA
      }
    } else {
      // Para salidas mantener la lógica existente o cambiar según necesites
      if (desfaseSegundos >= -SEGUNDOS_TOLERANCIA_SALIDA_PERSONAL) {
        return EstadosAsistenciaPersonal.Cumplido;
      } else {
        return EstadosAsistenciaPersonal.Salida_Anticipada;
      }
    }
  }

  /**
   * ✅ ELIMINAR asistencia específica del cache
   * ✅ SIN CAMBIOS: No maneja timestamps
   */
  private async eliminarAsistencia(clave: string): Promise<void> {
    try {
      await IndexedDBConnection.init();
      const store = await IndexedDBConnection.getStore(
        this.nombreTabla,
        "readwrite"
      );

      return new Promise<void>((resolve, reject) => {
        const request = store.delete(clave);

        request.onsuccess = () => {
          console.log(`🗑️ Asistencia eliminada del cache: ${clave}`);
          resolve();
        };

        request.onerror = () => {
          console.error(`❌ Error al eliminar asistencia: ${request.error}`);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("❌ Error al eliminar asistencia del cache:", error);
    }
  }

  /**
   * ✅ LIMPIAR asistencias expiradas del cache
   * 🧹 EJECUTA: Rutina de limpieza eliminando registros antiguos
   * ✅ MEJORADO: Logging detallado con timestamps
   */
  public async limpiarAsistenciasExpiradas(): Promise<{
    eliminadas: number;
    errores: number;
    timestampLimpieza: number;
  }> {
    const timestampLimpieza = this.dateHelper.obtenerTimestampPeruano();
    const resultado = {
      eliminadas: 0,
      errores: 0,
      timestampLimpieza,
    };

    try {
      await IndexedDBConnection.init();
      const store = await IndexedDBConnection.getStore(
        this.nombreTabla,
        "readwrite"
      );

      return new Promise<typeof resultado>((resolve, reject) => {
        const request = store.openCursor();

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest)
            .result as IDBCursorWithValue;

          if (cursor) {
            const asistencia = cursor.value as AsistenciaHoy;

            // Verificar si debe descartarse
            if (
              this.debeDescartar(
                asistencia.timestampConsulta,
                asistencia.tipoAsistencia
              )
            ) {
              try {
                cursor.delete();
                resultado.eliminadas++;
                console.log(
                  `🗑️ Asistencia expirada eliminada: ${
                    asistencia.clave
                  } (consultada: ${this.dateHelper.formatearTimestampLegible(
                    asistencia.timestampConsulta
                  )})`
                );
              } catch (error) {
                resultado.errores++;
                console.error(
                  `❌ Error al eliminar ${asistencia.clave}:`,
                  error
                );
              }
            }

            cursor.continue();
          } else {
            // Terminamos de recorrer todos los registros
            console.log(
              `🧹 Limpieza completada en ${this.dateHelper.formatearTimestampLegible(
                timestampLimpieza
              )}: ${resultado.eliminadas} eliminadas, ${
                resultado.errores
              } errores`
            );
            resolve(resultado);
          }
        };

        request.onerror = () => {
          console.error(`❌ Error durante limpieza: ${request.error}`);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("❌ Error al limpiar asistencias expiradas:", error);
      resultado.errores++;
      return resultado;
    }
  }

  /**
   * ✅ LIMPIAR todas las asistencias de una fecha específica
   * 🗓️ ÚTIL: Para limpiar datos del día anterior al cambiar de día
   * ✅ SIN CAMBIOS: No maneja timestamps directamente
   */
  public async limpiarAsistenciasPorFecha(fecha: string): Promise<void> {
    try {
      await IndexedDBConnection.init();
      const store = await IndexedDBConnection.getStore(
        this.nombreTabla,
        "readwrite"
      );

      return new Promise<void>((resolve, reject) => {
        const request = store.openCursor();

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest)
            .result as IDBCursorWithValue;

          if (cursor) {
            const asistencia = cursor.value as AsistenciaHoy;

            // Si la fecha coincide, eliminar
            if (asistencia.fecha === fecha) {
              cursor.delete();
              console.log(
                `🗑️ Asistencia de fecha ${fecha} eliminada: ${asistencia.clave}`
              );
            }

            cursor.continue();
          } else {
            console.log(`🧹 Limpieza por fecha completada: ${fecha}`);
            resolve();
          }
        };

        request.onerror = () => {
          console.error(`❌ Error al limpiar por fecha: ${request.error}`);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(
        `❌ Error al limpiar asistencias de fecha ${fecha}:`,
        error
      );
    }
  }

  /**
   * ✅ LIMPIAR todas las asistencias con fecha anterior a la especificada
   * 🗓️ ÚTIL: Para limpiar todos los días anteriores de una vez
   */
  public async limpiarAsistenciasAnterioresA(
    fechaLimite: string
  ): Promise<number> {
    try {
      // 🔍 DEBUG TEMPORAL
      console.log("🔍 DEBUG limpiarAsistenciasAnterioresA:");
      console.log("- fechaLimite recibida:", fechaLimite);

      await IndexedDBConnection.init();
      const store = await IndexedDBConnection.getStore(
        this.nombreTabla,
        "readwrite"
      );

      // ✅ CONVERTIR fechaLimite a timestamp para comparación confiable
      const fechaLimiteObj = new Date(fechaLimite + "T00:00:00.000Z");
      const timestampLimite = fechaLimiteObj.getTime();

      console.log("- fechaLimite como Date:", fechaLimiteObj);
      console.log("- timestampLimite:", timestampLimite);

      return new Promise<number>((resolve, reject) => {
        const request = store.openCursor();
        let eliminadas = 0;

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest)
            .result as IDBCursorWithValue;

          if (cursor) {
            const asistencia = cursor.value as AsistenciaHoy;

            // ✅ COMPARACIÓN CONFIABLE: Convertir fecha de asistencia a timestamp
            const fechaAsistenciaObj = new Date(
              asistencia.fecha + "T00:00:00.000Z"
            );
            const timestampAsistencia = fechaAsistenciaObj.getTime();

            const debeEliminar = timestampAsistencia < timestampLimite;

            // 🔍 DEBUG TEMPORAL
            console.log(`🔍 Comparando asistencia:`);
            console.log(
              `  - Fecha: "${asistencia.fecha}" -> timestamp: ${timestampAsistencia}`
            );
            console.log(`  - Es anterior? ${debeEliminar}`);
            console.log(`  - Clave: ${asistencia.clave}`);

            if (debeEliminar) {
              cursor.delete();
              eliminadas++;
              console.log(
                `🗑️ Asistencia ELIMINADA: ${asistencia.clave} (fecha: ${asistencia.fecha})`
              );
            } else {
              console.log(
                `✅ Asistencia CONSERVADA: ${asistencia.clave} (fecha: ${asistencia.fecha})`
              );
            }

            cursor.continue();
          } else {
            console.log(
              `🧹 Limpieza completada: ${eliminadas} asistencias anteriores a ${fechaLimite} eliminadas`
            );
            resolve(eliminadas);
          }
        };

        request.onerror = () => {
          console.error(
            `❌ Error al limpiar asistencias anteriores: ${request.error}`
          );
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(
        `❌ Error al limpiar asistencias anteriores a ${fechaLimite}:`,
        error
      );
      return 0;
    }
  }

  /**
   * ✅ GUARDAR asistencia en cache local
   * 💾 ALMACENA: Los datos de asistencia con timestamp de consulta actual
   * ✅ CORREGIDO: Usar timestamp peruano para timestampConsulta
   */
  public async guardarAsistencia(asistencia: AsistenciaHoy): Promise<void> {
    try {
      await IndexedDBConnection.init();
      const store = await IndexedDBConnection.getStore(
        this.nombreTabla,
        "readwrite"
      );

      // ✅ CORREGIDO: Usar DateHelper para timestamp de consulta
      const timestampConsultaActual = this.dateHelper.obtenerTimestampPeruano();
      const asistenciaConTimestamp = {
        ...asistencia,
        timestampConsulta: timestampConsultaActual,
      };

      return new Promise<void>((resolve, reject) => {
        const request = store.put(asistenciaConTimestamp);

        request.onsuccess = () => {
          console.log(
            `💾 Asistencia guardada en cache: ${
              asistencia.clave
            } (timestamp: ${this.dateHelper.formatearTimestampLegible(
              timestampConsultaActual
            )})`
          );
          resolve();
        };

        request.onerror = () => {
          console.error(`❌ Error al guardar asistencia: ${request.error}`);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("❌ Error al guardar asistencia en cache:", error);
      throw error;
    }
  }

  /**
   * ✅ CONSULTAR MÚLTIPLES asistencias (para consultas por aula/sección)
   * 🎯 ÚTIL: Para cuando se consultan todos los estudiantes de una sección
   * ✅ SIN CAMBIOS: No maneja timestamps directamente
   */
  public async consultarAsistenciasMultiples(
    actor: ActoresSistema,
    modoRegistro: ModoRegistro,
    tipoAsistencia: TipoAsistencia,
    filtros?: {
      fecha?: string;
      nivelEducativo?: string;
      grado?: string;
      seccion?: string;
    }
  ): Promise<AsistenciaHoy[]> {
    try {
      await IndexedDBConnection.init();
      const store = await IndexedDBConnection.getStore(
        this.nombreTabla,
        "readonly"
      );

      return new Promise<AsistenciaHoy[]>((resolve, reject) => {
        const request = store.openCursor();
        const resultados: AsistenciaHoy[] = [];

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest)
            .result as IDBCursorWithValue;

          if (cursor) {
            const asistencia = cursor.value as AsistenciaHoy;

            // Verificar si cumple criterios básicos
            if (
              asistencia.actor === actor &&
              asistencia.modoRegistro === modoRegistro &&
              asistencia.tipoAsistencia === tipoAsistencia
            ) {
              // Aplicar filtros adicionales si se proporcionan
              let cumpleFiltros = true;

              if (filtros?.fecha && asistencia.fecha !== filtros.fecha) {
                cumpleFiltros = false;
              }

              if (
                filtros?.nivelEducativo &&
                "nivelEducativo" in asistencia &&
                asistencia.nivelEducativo !== filtros.nivelEducativo
              ) {
                cumpleFiltros = false;
              }

              if (
                filtros?.grado &&
                "grado" in asistencia &&
                asistencia.grado !== filtros.grado
              ) {
                cumpleFiltros = false;
              }

              if (
                filtros?.seccion &&
                "seccion" in asistencia &&
                asistencia.seccion !== filtros.seccion
              ) {
                cumpleFiltros = false;
              }

              // Verificar si no ha expirado
              if (
                cumpleFiltros &&
                !this.debeDescartar(
                  asistencia.timestampConsulta,
                  asistencia.tipoAsistencia
                )
              ) {
                resultados.push(asistencia);
              }
            }

            cursor.continue();
          } else {
            resolve(resultados);
          }
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("❌ Error al consultar asistencias múltiples:", error);
      return [];
    }
  }

  /**
   * ✅ OBTENER ESTADÍSTICAS del cache
   * 📊 INFORMACIÓN: Cantidad de registros, expirados, etc.
   * ✅ CORREGIDO: Usar DateHelper para fecha
   */
  public async obtenerEstadisticas(): Promise<{
    totalRegistros: number;
    registrosExpirados: number;
    registrosValidos: number;
    fechaHoy: string;
    timestampEstadisticas: number;
  }> {
    const timestampEstadisticas = this.dateHelper.obtenerTimestampPeruano();
    const stats = {
      totalRegistros: 0,
      registrosExpirados: 0,
      registrosValidos: 0,
      fechaHoy:
        this.dateHelper.obtenerFechaStringActual() ||
        this.obtenerFechaHoyFallback(),
      timestampEstadisticas,
    };

    try {
      await IndexedDBConnection.init();
      const store = await IndexedDBConnection.getStore(
        this.nombreTabla,
        "readonly"
      );

      return new Promise<typeof stats>((resolve, reject) => {
        const request = store.openCursor();

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest)
            .result as IDBCursorWithValue;

          if (cursor) {
            const asistencia = cursor.value as AsistenciaHoy;
            stats.totalRegistros++;

            if (
              this.debeDescartar(
                asistencia.timestampConsulta,
                asistencia.tipoAsistencia
              )
            ) {
              stats.registrosExpirados++;
            } else {
              stats.registrosValidos++;
            }

            cursor.continue();
          } else {
            console.log(
              `📊 Estadísticas obtenidas: ${stats.totalRegistros} total, ${
                stats.registrosValidos
              } válidos, ${
                stats.registrosExpirados
              } expirados (${this.dateHelper.formatearTimestampLegible(
                timestampEstadisticas
              )})`
            );
            resolve(stats);
          }
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("❌ Error al obtener estadísticas:", error);
      return stats;
    }
  }

  /**
   * ✅ INICIALIZAR rutinas de mantenimiento
   * 🔄 EJECUTA: Limpieza automática cada cierto tiempo
   * ✅ CORREGIDO: Usar DateHelper para cálculos temporales
   */
  public inicializarMantenimiento(): void {
    console.log(
      `🔧 Inicializando mantenimiento de cache de asistencias (${this.dateHelper.formatearTimestampLegible(
        this.dateHelper.obtenerTimestampPeruano()
      )})`
    );

    // ✅ CORREGIDO: Limpiar asistencias expiradas cada 5 minutos usando DateHelper
    const intervaloLimpieza = setInterval(async () => {
      try {
        const timestampInicio = this.dateHelper.obtenerTimestampPeruano();
        const resultado = await this.limpiarAsistenciasExpiradas();

        if (resultado.eliminadas > 0) {
          console.log(
            `🧹 Mantenimiento automático completado en ${this.dateHelper.formatearTimestampLegible(
              timestampInicio
            )}: ${resultado.eliminadas} asistencias expiradas eliminadas`
          );
        }
      } catch (error) {
        console.error("❌ Error en mantenimiento automático:", error);
      }
    }, 5 * 60 * 1000); // 5 minutos

    this.intervalos.push(intervaloLimpieza);

    // ✅ CORREGIDO: Usar DateHelper para cálculos de medianoche
    this.programarLimpiezaMedianoche();
  }

  /**
   * ✅ NUEVO: Programa limpieza automática a medianoche usando DateHelper
   */
  private programarLimpiezaMedianoche(): void {
    const timestampActual = this.dateHelper.obtenerTimestampPeruano();
    const fechaActual = new Date(timestampActual);

    // Calcular medianoche del día siguiente
    const medianoche = new Date(fechaActual);
    medianoche.setDate(fechaActual.getDate() + 1);
    medianoche.setHours(0, 0, 0, 0);

    const tiempoHastaMedianoche = medianoche.getTime() - timestampActual;

    console.log(
      `🌙 Programando limpieza de medianoche para: ${this.dateHelper.formatearTimestampLegible(
        medianoche.getTime()
      )} (en ${Math.round(tiempoHastaMedianoche / (1000 * 60))} minutos)`
    );

    const timeoutMedianoche = setTimeout(() => {
      // Limpiar datos del día anterior
      const fechaAyer = this.dateHelper.generarFechaString(
        fechaActual.getMonth() + 1,
        fechaActual.getDate() - 1,
        fechaActual.getFullYear()
      );

      console.log(
        `🌙 Ejecutando limpieza de medianoche para fecha: ${fechaAyer}`
      );
      this.limpiarAsistenciasPorFecha(fechaAyer).catch(console.error);

      // Configurar limpieza diaria recursiva
      const intervaloLimpiezaDiaria = setInterval(async () => {
        const timestampLimpieza = this.dateHelper.obtenerTimestampPeruano();
        const fechaLimpieza = new Date(timestampLimpieza);

        const fechaAyer = this.dateHelper.generarFechaString(
          fechaLimpieza.getMonth() + 1,
          fechaLimpieza.getDate() - 1,
          fechaLimpieza.getFullYear()
        );

        console.log(`🌙 Limpieza diaria automática para fecha: ${fechaAyer}`);
        await this.limpiarAsistenciasPorFecha(fechaAyer);
      }, 24 * 60 * 60 * 1000); // 24 horas

      this.intervalos.push(intervaloLimpiezaDiaria);
    }, tiempoHastaMedianoche);

    console.log(
      `Limpieza de cache se hara a la media noche de hoy, ${timeoutMedianoche}`
    );
  }

  /**
   * ✅ NUEVO: Limpia todos los intervalos de mantenimiento
   * 🧹 ÚTIL: Para limpiar recursos al destruir la instancia
   */
  public limpiarMantenimiento(): void {
    console.log(
      `🛑 Limpiando ${this.intervalos.length} intervalos de mantenimiento`
    );

    this.intervalos.forEach((intervalo) => {
      clearInterval(intervalo);
    });

    this.intervalos = [];
  }

  /**
   * ✅ NUEVO: Obtiene información detallada del mantenimiento
   */
  public obtenerInfoMantenimiento(): {
    intervalosActivos: number;
    proximaLimpieza: string;
    ultimaLimpieza: string | null;
  } {
    const timestampActual = this.dateHelper.obtenerTimestampPeruano();

    // Calcular próxima limpieza (próximo múltiplo de 5 minutos)
    const minutosActuales = new Date(timestampActual).getMinutes();
    const minutosProximaLimpieza = Math.ceil(minutosActuales / 5) * 5;
    const proximaLimpieza = new Date(timestampActual);
    proximaLimpieza.setMinutes(minutosProximaLimpieza, 0, 0);

    return {
      intervalosActivos: this.intervalos.length,
      proximaLimpieza: this.dateHelper.formatearTimestampLegible(
        proximaLimpieza.getTime()
      ),
      ultimaLimpieza: null, // Podrías almacenar esto en una variable de instancia
    };
  }
}
