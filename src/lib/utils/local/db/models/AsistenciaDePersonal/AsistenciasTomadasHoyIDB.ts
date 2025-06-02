import IndexedDBConnection from "../../IndexedDBConnection";
import { ActoresSistema } from "@/interfaces/shared/ActoresSistema";
import { ModoRegistro } from "@/interfaces/shared/ModoRegistroPersonal";
import { TipoAsistencia } from "@/interfaces/shared/AsistenciaRequests";
import { EstadosAsistenciaPersonal } from "@/interfaces/shared/EstadosAsistenciaPersonal";
import { EstadosAsistencia } from "@/interfaces/shared/EstadosAsistenciaEstudiantes";
import { CANTIDAD_MINUTOS_MAXIMO_PARA_DESCARTE_ASISTENCIAS } from "@/constants/CANTIDAD_MINUTOS_MAXIMO_PARA_DESCARTE_ASISTENCIAS";
import { TablasLocal } from "@/interfaces/shared/TablasSistema";

// ✅ INTERFAZ: Estructura base para asistencias
interface AsistenciaHoyBase {
  clave: string; // Clave única: fecha:modo:actor:dni[:extras]
  dni: string;
  actor: ActoresSistema;
  modoRegistro: ModoRegistro;
  tipoAsistencia: TipoAsistencia;
  fecha: string; // YYYY-MM-DD
  timestampConsulta: number; // Momento en que se consultó desde Redis
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
  dni: string;
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
 */
export class AsistenciasTomadasHoyIDB {
  private nombreTabla: string = TablasLocal.Tabla_Asistencias_Tomadas_Hoy;

  constructor() {}

  /**
   * ✅ GENERAR CLAVE ÚNICA para identificar cada asistencia
   * 📝 FORMATO PERSONAL: fecha:modo:actor:dni
   * 📝 FORMATO ESTUDIANTE: fecha:modo:actor:dni:nivel:grado:seccion
   * 🎯 COMPATIBILIDAD: Igual formato que usa el endpoint de marcado
   */
  private generarClave(consulta: ConsultaAsistenciaHoy): string {
    const fecha = consulta.fecha || this.obtenerFechaHoy();
    const base = `${fecha}:${consulta.modoRegistro}:${consulta.actor}:${consulta.dni}`;

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
   * ✅ OBTENER FECHA ACTUAL en formato YYYY-MM-DD
   */
  private obtenerFechaHoy(): string {
    const hoy = new Date();
    return hoy.toISOString().split("T")[0];
  }

  /**
   * ✅ VERIFICAR si una asistencia debe ser descartada por tiempo
   * 🕐 LÓGICA: Descartar si han pasado más de X minutos desde la consulta
   */
  private debeDescartar(
    timestampConsulta: number,
    tipoAsistencia: TipoAsistencia
  ): boolean {
    const tiempoTranscurrido = Date.now() - timestampConsulta;
    const minutosTranscurridos = Math.floor(tiempoTranscurrido / (1000 * 60));

    const limitMinutos =
      CANTIDAD_MINUTOS_MAXIMO_PARA_DESCARTE_ASISTENCIAS[tipoAsistencia];

    return minutosTranscurridos > limitMinutos;
  }

  /**
   * ✅ CONSULTAR asistencia en cache local
   * 🔍 RETORNA: La asistencia si existe y no debe descartarse, null en caso contrario
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
            console.log(`⏰ Asistencia expirada en cache: ${clave}`);
            // Eliminar la asistencia expirada
            this.eliminarAsistencia(clave).catch(console.error);
            resolve(null);
            return;
          }

          console.log(`✅ Asistencia encontrada en cache: ${clave}`);
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
      const fecha = this.obtenerFechaHoy();
      const timestampConsulta = Date.now();

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
      console.log(`💾 Asistencia desde Redis guardada en cache: ${clave}`);
    } catch (error) {
      console.error("❌ Error al guardar asistencia desde Redis:", error);
      throw error;
    }
  }

  /**
   * ✅ DETERMINAR ESTADO de asistencia personal basado en desfase
   * ⏰ LÓGICA: Igual que en AsistenciaDePersonalIDB
   */
  private determinarEstadoPersonal(
    desfaseSegundos: number,
    modoRegistro: ModoRegistro
  ): EstadosAsistenciaPersonal {
    const TOLERANCIA_TARDANZA = 5 * 60; // 5 minutos en segundos
    const TOLERANCIA_TEMPRANO = 15 * 60; // 15 minutos en segundos

    if (modoRegistro === ModoRegistro.Entrada) {
      if (desfaseSegundos <= 0) {
        return EstadosAsistenciaPersonal.En_Tiempo;
      } else if (desfaseSegundos <= TOLERANCIA_TARDANZA) {
        return EstadosAsistenciaPersonal.En_Tiempo;
      } else {
        return EstadosAsistenciaPersonal.Tarde;
      }
    } else {
      if (desfaseSegundos >= 0) {
        return EstadosAsistenciaPersonal.Cumplido;
      } else if (desfaseSegundos >= -TOLERANCIA_TEMPRANO) {
        return EstadosAsistenciaPersonal.Cumplido;
      } else {
        return EstadosAsistenciaPersonal.Salida_Anticipada;
      }
    }
  }

  /**
   * ✅ ELIMINAR asistencia específica del cache
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
   */
  public async limpiarAsistenciasExpiradas(): Promise<{
    eliminadas: number;
    errores: number;
  }> {
    const resultado = { eliminadas: 0, errores: 0 };

    try {
      await IndexedDBConnection.init();
      const store = await IndexedDBConnection.getStore(
        this.nombreTabla,
        "readwrite"
      );

      return new Promise<{ eliminadas: number; errores: number }>(
        (resolve, reject) => {
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
                    `🗑️ Asistencia expirada eliminada: ${asistencia.clave}`
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
                `🧹 Limpieza completada: ${resultado.eliminadas} eliminadas, ${resultado.errores} errores`
              );
              resolve(resultado);
            }
          };

          request.onerror = () => {
            console.error(`❌ Error durante limpieza: ${request.error}`);
            reject(request.error);
          };
        }
      );
    } catch (error) {
      console.error("❌ Error al limpiar asistencias expiradas:", error);
      resultado.errores++;
      return resultado;
    }
  }

  /**
   * ✅ LIMPIAR todas las asistencias de una fecha específica
   * 🗓️ ÚTIL: Para limpiar datos del día anterior al cambiar de día
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
   * ✅ GUARDAR asistencia en cache local
   * 💾 ALMACENA: Los datos de asistencia con timestamp de consulta actual
   */
  public async guardarAsistencia(asistencia: AsistenciaHoy): Promise<void> {
    try {
      await IndexedDBConnection.init();
      const store = await IndexedDBConnection.getStore(
        this.nombreTabla,
        "readwrite"
      );

      // Asegurar que tiene timestamp de consulta actual
      const asistenciaConTimestamp = {
        ...asistencia,
        timestampConsulta: Date.now(),
      };

      return new Promise<void>((resolve, reject) => {
        const request = store.put(asistenciaConTimestamp);

        request.onsuccess = () => {
          console.log(`💾 Asistencia guardada en cache: ${asistencia.clave}`);
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
   */
  public async obtenerEstadisticas(): Promise<{
    totalRegistros: number;
    registrosExpirados: number;
    registrosValidos: number;
    fechaHoy: string;
  }> {
    const stats = {
      totalRegistros: 0,
      registrosExpirados: 0,
      registrosValidos: 0,
      fechaHoy: this.obtenerFechaHoy(),
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
   */
  public inicializarMantenimiento(): void {
    // Limpiar asistencias expiradas cada 5 minutos
    setInterval(async () => {
      try {
        const resultado = await this.limpiarAsistenciasExpiradas();
        if (resultado.eliminadas > 0) {
          console.log(
            `🧹 Mantenimiento automático: ${resultado.eliminadas} asistencias expiradas eliminadas`
          );
        }
      } catch (error) {
        console.error("❌ Error en mantenimiento automático:", error);
      }
    }, 5 * 60 * 1000); // 5 minutos

    // Limpiar asistencias del día anterior a medianoche
    const ahora = new Date();
    const medianoche = new Date(ahora);
    medianoche.setDate(ahora.getDate() + 1);
    medianoche.setHours(0, 0, 0, 0);

    const tiempoHastaMedianoche = medianoche.getTime() - ahora.getTime();

    setTimeout(() => {
      // Limpiar datos del día anterior
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const fechaAyer = ayer.toISOString().split("T")[0];

      this.limpiarAsistenciasPorFecha(fechaAyer).catch(console.error);

      // Configurar limpieza diaria
      setInterval(async () => {
        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);
        const fechaAyer = ayer.toISOString().split("T")[0];

        await this.limpiarAsistenciasPorFecha(fechaAyer);
      }, 24 * 60 * 60 * 1000); // 24 horas
    }, tiempoHastaMedianoche);
  }
}
