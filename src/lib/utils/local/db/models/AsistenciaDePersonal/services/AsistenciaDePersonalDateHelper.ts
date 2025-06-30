import { DIA_ESCOLAR_MINIMO_PARA_CONSULTAR_API } from "@/constants/DISPONIBILLIDAD_IDS_RDP02_GENERADOS";
import {
  DIAS_SEMANA,
  HORARIOS_CONSULTA,
} from "@/constants/HORARIOS_CONSULTA_INTELIGENTE";
import store from "@/global/store";

/**
 * 🎯 RESPONSABILIDAD: Manejo de fechas y lógica temporal
 * - Obtener fecha actual desde Redux
 * - Calcular días escolares
 * - Validar rangos de fechas
 * - Determinar lógica de consulta a API
 * -  Métodos para flujo inteligente de consultas
 */
export class AsistenciaDePersonalDateHelper {
  /**
   * Obtiene la fecha actual desde el estado de Redux
   * @returns Objeto Date con la fecha actual según el estado global o null si no se puede obtener.
   */
  public obtenerFechaHoraActualDesdeRedux(): Date | null {
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
        "Error al obtener fecha desde Redux en AsistenciaPersonalDateHelper:",
        error
      );
      return null;
    }
  }

  /**
   * ✅ NUEVO: Evalúa si debe consultar API según última actualización (flujo del flowchart)
   */
  public evaluarNecesidadConsultaSegunTimestamp(
    ultimaActualizacion: number,
    mesConsultado: number
  ): {
    debeConsultar: boolean;
    razon: string;
    esConsultaNecesaria: boolean;
    esDatoFinalizado: boolean;
  } {
    try {
      const fechaActual = this.obtenerFechaHoraActualDesdeRedux();
      if (!fechaActual) {
        return {
          debeConsultar: true,
          razon: "No se pudo obtener fecha actual - consultar por seguridad",
          esConsultaNecesaria: true,
          esDatoFinalizado: false,
        };
      }

      const mesActual = fechaActual.getMonth() + 1;
      const fechaUltimaActualizacion = new Date(ultimaActualizacion);
      const mesUltimaActualizacion = fechaUltimaActualizacion.getMonth() + 1;

      // Caso 1: Mes consultado es anterior al actual
      if (mesConsultado < mesActual) {
        if (mesUltimaActualizacion > mesConsultado) {
          return {
            debeConsultar: false,
            razon:
              "Datos FINALIZADOS - última actualización fue en mes posterior",
            esConsultaNecesaria: false,
            esDatoFinalizado: true,
          };
        } else if (mesUltimaActualizacion === mesConsultado) {
          return {
            debeConsultar: true,
            razon:
              "Datos fueron actualizados en el mismo mes - pueden haber cambiado",
            esConsultaNecesaria: true,
            esDatoFinalizado: false,
          };
        } else {
          return {
            debeConsultar: true,
            razon:
              "Datos pueden estar incompletos - última actualización anterior al mes consultado",
            esConsultaNecesaria: true,
            esDatoFinalizado: false,
          };
        }
      }

      // Caso 2: Mes consultado es el actual
      if (mesConsultado === mesActual) {
        // Para mes actual, aplicar lógica de horarios
        return this.evaluarConsultaMesActualSegunHorario(ultimaActualizacion);
      }

      // Caso 3: Mes futuro (no debería llegar aquí si se valida antes)
      return {
        debeConsultar: false,
        razon: "Mes futuro - LOGOUT FORZADO",
        esConsultaNecesaria: false,
        esDatoFinalizado: false,
      };
    } catch (error) {
      console.error("Error al evaluar necesidad de consulta:", error);
      return {
        debeConsultar: true,
        razon: "Error en evaluación - consultar por seguridad",
        esConsultaNecesaria: true,
        esDatoFinalizado: false,
      };
    }
  }

  /**
   * ✅ NUEVO: Obtiene el rango horario actual
   */
  public obtenerRangoHorarioActual(): {
    rango: "MADRUGADA" | "ENTRADAS" | "COMPLETO" | "CONSOLIDADO";
    inicio: number;
    fin: number;
    descripcion: string;
  } {
    const horaActual = this.obtenerHoraActual() || 0;

    if (horaActual < 6) {
      return {
        rango: "MADRUGADA",
        inicio: 0,
        fin: 5,
        descripcion: "00:00-05:59 - Madrugada sin consultas",
      };
    } else if (horaActual >= 6 && horaActual < 12) {
      return {
        rango: "ENTRADAS",
        inicio: 6,
        fin: 11,
        descripcion: "06:00-11:59 - Solo entradas",
      };
    } else if (horaActual >= 12 && horaActual < 22) {
      return {
        rango: "COMPLETO",
        inicio: 12,
        fin: 21,
        descripcion: "12:00-21:59 - Entradas y salidas",
      };
    } else {
      return {
        rango: "CONSOLIDADO",
        inicio: 22,
        fin: 23,
        descripcion: "22:00-23:59 - Datos consolidados",
      };
    }
  }

  /**
   * ✅ CORREGIDO: Control de 45 minutos por rango
   */
  public yaSeConsultoEnRangoActual(ultimaFechaActualizacion: number): {
    yaConsultado: boolean;
    rangoActual: string;
    rangoUltimaConsulta: string;
    razon: string;
    minutosTranscurridos: number;
  } {
    try {
      const fechaActual = this.obtenerFechaHoraActualDesdeRedux();
      if (!fechaActual) {
        return {
          yaConsultado: false,
          rangoActual: "DESCONOCIDO",
          rangoUltimaConsulta: "DESCONOCIDO",
          razon: "No se pudo obtener fecha actual",
          minutosTranscurridos: 0,
        };
      }

      const horaActual = fechaActual.getHours();
      const fechaHoyString = this.obtenerFechaStringActual();
      const fechaUltimaActualizacionString =
        this.convertirTimestampAFechaString(ultimaFechaActualizacion);
      const fechaUltimaActualizacion = new Date(ultimaFechaActualizacion);
      const horaUltimaActualizacion = fechaUltimaActualizacion.getHours();

      // Calcular minutos transcurridos
      const diferenciaMs = fechaActual.getTime() - ultimaFechaActualizacion;
      const minutosTranscurridos = Math.floor(diferenciaMs / (1000 * 60));

      console.log(
        `🔍 Control de rangos: última=${fechaUltimaActualizacionString} ${horaUltimaActualizacion}:xx, actual=${fechaHoyString} ${horaActual}:xx, transcurridos=${minutosTranscurridos}min`
      );

      // Si la última actualización no es de hoy, definitivamente se puede consultar
      if (fechaHoyString !== fechaUltimaActualizacionString) {
        const rangoActual = this.obtenerNombreRango(horaActual);
        return {
          yaConsultado: false,
          rangoActual,
          rangoUltimaConsulta: "DIA_DIFERENTE",
          razon: `Última actualización no es de hoy (${fechaUltimaActualizacionString} vs hoy ${fechaHoyString})`,
          minutosTranscurridos,
        };
      }

      // Ambas fechas son de hoy, comparar rangos y tiempo
      const rangoActual = this.obtenerNombreRango(horaActual);
      const rangoUltimaConsulta = this.obtenerNombreRango(
        horaUltimaActualizacion
      );

      // ✅ NUEVA LÓGICA: Verificar 45 minutos + cambio de rango
      if (rangoActual === rangoUltimaConsulta && minutosTranscurridos < 45) {
        return {
          yaConsultado: true,
          rangoActual,
          rangoUltimaConsulta,
          razon: `Ya consultado en rango ${rangoActual} hace ${minutosTranscurridos}min (< 45min límite)`,
          minutosTranscurridos,
        };
      }

      // Si cambió de rango O pasaron 45+ minutos, puede consultar
      const razonCambio =
        rangoActual !== rangoUltimaConsulta
          ? `Cambio de rango: ${rangoUltimaConsulta} → ${rangoActual}`
          : `Mismo rango ${rangoActual} pero pasaron ${minutosTranscurridos}min (≥ 45min)`;

      return {
        yaConsultado: false,
        rangoActual,
        rangoUltimaConsulta,
        razon: razonCambio,
        minutosTranscurridos,
      };
    } catch (error) {
      console.error("Error verificando rango de consulta:", error);
      return {
        yaConsultado: false,
        rangoActual: "ERROR",
        rangoUltimaConsulta: "ERROR",
        razon: "Error en verificación",
        minutosTranscurridos: 0,
      };
    }
  }

  /**
   * ✅ NUEVO: Obtiene el nombre del rango según la hora usando las constantes
   */
  private obtenerNombreRango(hora: number): string {
    if (hora < HORARIOS_CONSULTA.INICIO_DIA_ESCOLAR) {
      return "MADRUGADA";
    } else if (
      hora >= HORARIOS_CONSULTA.INICIO_DIA_ESCOLAR &&
      hora < HORARIOS_CONSULTA.SEPARACION_ENTRADAS_SALIDAS
    ) {
      return "ENTRADAS";
    } else if (
      hora >= HORARIOS_CONSULTA.SEPARACION_ENTRADAS_SALIDAS &&
      hora < HORARIOS_CONSULTA.FIN_CONSOLIDACION
    ) {
      return "COMPLETO";
    } else {
      return "CONSOLIDADO";
    }
  }

  /**
   * ✅ NUEVO: Obtiene detalles del rango horario actual usando las constantes
   */
  public obtenerRangoHorarioActualConConstantes(): {
    rango: string;
    inicio: number;
    fin: number;
    descripcion: string;
  } {
    const horaActual = this.obtenerHoraActual() || 0;

    if (horaActual < HORARIOS_CONSULTA.INICIO_DIA_ESCOLAR) {
      return {
        rango: "MADRUGADA",
        inicio: 0,
        fin: HORARIOS_CONSULTA.INICIO_DIA_ESCOLAR - 1,
        descripcion: `00:00-${String(
          HORARIOS_CONSULTA.INICIO_DIA_ESCOLAR - 1
        ).padStart(2, "0")}:59 - Madrugada sin consultas`,
      };
    } else if (
      horaActual >= HORARIOS_CONSULTA.INICIO_DIA_ESCOLAR &&
      horaActual < HORARIOS_CONSULTA.SEPARACION_ENTRADAS_SALIDAS
    ) {
      return {
        rango: "ENTRADAS",
        inicio: HORARIOS_CONSULTA.INICIO_DIA_ESCOLAR,
        fin: HORARIOS_CONSULTA.SEPARACION_ENTRADAS_SALIDAS - 1,
        descripcion: `${String(HORARIOS_CONSULTA.INICIO_DIA_ESCOLAR).padStart(
          2,
          "0"
        )}:00-${String(
          HORARIOS_CONSULTA.SEPARACION_ENTRADAS_SALIDAS - 1
        ).padStart(2, "0")}:59 - Solo entradas`,
      };
    } else if (
      horaActual >= HORARIOS_CONSULTA.SEPARACION_ENTRADAS_SALIDAS &&
      horaActual < HORARIOS_CONSULTA.FIN_CONSOLIDACION
    ) {
      return {
        rango: "COMPLETO",
        inicio: HORARIOS_CONSULTA.SEPARACION_ENTRADAS_SALIDAS,
        fin: HORARIOS_CONSULTA.FIN_CONSOLIDACION - 1,
        descripcion: `${String(
          HORARIOS_CONSULTA.SEPARACION_ENTRADAS_SALIDAS
        ).padStart(2, "0")}:00-${String(
          HORARIOS_CONSULTA.FIN_CONSOLIDACION - 1
        ).padStart(2, "0")}:59 - Entradas y salidas`,
      };
    } else {
      return {
        rango: "CONSOLIDADO",
        inicio: HORARIOS_CONSULTA.FIN_CONSOLIDACION,
        fin: 23,
        descripcion: `${String(HORARIOS_CONSULTA.FIN_CONSOLIDACION).padStart(
          2,
          "0"
        )}:00-23:59 - Datos consolidados`,
      };
    }
  }

  /**
   * ✅ NUEVO: Genera clave para control de consultas por rango
   */
  public generarClaveControlConsulta(
    id_o_dni: string | number,
    mes: number,
    rango: string
  ): string {
    const fecha = this.obtenerFechaStringActual() || "unknown";
    return `consulta:${fecha}:${mes}:${id_o_dni}:${rango}`;
  }

  /**
   * ✅ CORREGIDO: Evaluar consulta para mes actual - SIEMPRE consultar Redis en horario escolar
   */
  private evaluarConsultaMesActualSegunHorario(ultimaActualizacion: number): {
    debeConsultar: boolean;
    razon: string;
    esConsultaNecesaria: boolean;
    esDatoFinalizado: boolean;
  } {
    const horaActual = this.obtenerHoraActual();
    const esFinDeSemana = this.esFinDeSemana();

    const fechaUltimaActualizacionString =
      this.convertirTimestampAFechaString(ultimaActualizacion);
    const fechaHoyString = this.obtenerFechaStringActual();

    console.log(`⏰ Evaluando consulta mes actual:`, {
      horaActual,
      esFinDeSemana,
      fechaHoy: fechaHoyString,
      fechaUltimaActualizacion: fechaUltimaActualizacionString,
      timestampOriginal: ultimaActualizacion,
    });

    if (horaActual === null) {
      return {
        debeConsultar: true,
        razon: "No se pudo obtener hora actual",
        esConsultaNecesaria: true,
        esDatoFinalizado: false,
      };
    }

    // Fin de semana
    if (esFinDeSemana) {
      const fueViernesCompleto =
        this.fueActualizadoViernesCompleto(ultimaActualizacion);

      if (fueViernesCompleto) {
        return {
          debeConsultar: false,
          razon:
            "Fin de semana - datos del viernes completos (actualizado después de 20:00)",
          esConsultaNecesaria: false,
          esDatoFinalizado: false,
        };
      } else {
        return {
          debeConsultar: true,
          razon: "Fin de semana - datos del viernes incompletos",
          esConsultaNecesaria: true,
          esDatoFinalizado: false,
        };
      }
    }

    // Día escolar
    if (horaActual < 6) {
      return {
        debeConsultar: false,
        razon: "Antes de 6:00 AM - sin nuevas asistencias",
        esConsultaNecesaria: false,
        esDatoFinalizado: false,
      };
    }

    if (horaActual >= 22) {
      return {
        debeConsultar: true,
        razon: "Después de 22:00 - datos consolidados en PostgreSQL",
        esConsultaNecesaria: true,
        esDatoFinalizado: false,
      };
    }

    // ✅ CORREGIDO: Entre 6:00 y 22:00 - SIEMPRE consultar Redis para datos del día actual
    // Los datos de API son históricos, Redis tiene datos del día actual
    return {
      debeConsultar: true,
      razon: `Horario escolar (${horaActual}:xx) - Consultar Redis para datos del día actual (API tiene históricos hasta ${fechaUltimaActualizacionString})`,
      esConsultaNecesaria: true,
      esDatoFinalizado: false,
    };
  }

  // ========================================================================================
  // MÉTODOS PARA FLUJO INTELIGENTE
  // ========================================================================================

  /**
   * Obtiene la hora actual desde Redux (0-23)
   */
  public obtenerHoraActual(): number | null {
    const fechaActual = this.obtenerFechaHoraActualDesdeRedux();
    return fechaActual ? fechaActual.getHours() : null;
  }

  /**
   * Verifica si es fin de semana (Sábado o Domingo)
   */
  public esFinDeSemana(): boolean {
    const fechaActual = this.obtenerFechaHoraActualDesdeRedux();
    if (!fechaActual) return false;

    const diaSemana = fechaActual.getDay(); // 0=domingo, 6=sábado
    return diaSemana === 0 || diaSemana === 6;
  }

  /**
   * Obtiene timestamp peruano (hora de Perú como número)
   * Para el campo obligatorio `ultima_fecha_actualizacion`
   */
  public obtenerTimestampPeruano(): number {
    const fechaActual = this.obtenerFechaHoraActualDesdeRedux();
    if (!fechaActual) {
      console.warn("No se pudo obtener fecha desde Redux, usando Date.now()");
      return Date.now();
    }

    return fechaActual.getTime();
  }

  /**
   * ✅ NUEVO: Extrae el mes de un timestamp
   */
  public extraerMesDeTimestamp(timestamp: number): number {
    try {
      const fecha = new Date(timestamp);
      return fecha.getMonth() + 1; // 1-12
    } catch (error) {
      console.error("Error al extraer mes de timestamp:", error);
      return 0;
    }
  }

  /**
   * ✅ NUEVO: Verifica si la última actualización fue un viernes >= 20:00
   */
  public fueActualizadoViernesCompleto(timestamp: number): boolean {
    try {
      const fecha = new Date(timestamp);
      const diaSemana = fecha.getDay();
      const hora = fecha.getHours();

      const esViernes = diaSemana === DIAS_SEMANA.VIERNES; // ✅ USAR CONSTANTE
      const esHoraCompleta = hora >= HORARIOS_CONSULTA.VIERNES_COMPLETO; // ✅ USAR CONSTANTE

      console.log(
        `📅 Verificando viernes completo: ${fecha.toLocaleString(
          "es-PE"
        )} - Día: ${diaSemana} (viernes=${esViernes}), Hora: ${hora} (completo=${esHoraCompleta})`
      );

      return esViernes && esHoraCompleta;
    } catch (error) {
      console.error("Error al verificar viernes completo:", error);
      return false;
    }
  }
  /**
   * ✅ NUEVO: Obtiene los últimos N días escolares del mes actual
   */
  public obtenerUltimosDiasEscolares(cantidadDias: number = 5): number[] {
    try {
      const fechaActual = this.obtenerFechaHoraActualDesdeRedux();
      if (!fechaActual) {
        console.warn("No se pudo obtener fecha actual para días escolares");
        return [];
      }

      const anio = fechaActual.getFullYear();
      const mes = fechaActual.getMonth(); // 0-11
      const diaActual = fechaActual.getDate();

      const diasEscolares: number[] = [];
      let diasEncontrados = 0;

      // Buscar hacia atrás desde ayer hasta encontrar N días escolares
      for (
        let dia = diaActual - 1;
        dia >= 1 && diasEncontrados < cantidadDias;
        dia--
      ) {
        const fecha = new Date(anio, mes, dia);
        const diaSemana = fecha.getDay(); // 0=domingo, 6=sábado

        // Si es día escolar (lunes a viernes)
        if (diaSemana >= 1 && diaSemana <= 5) {
          diasEscolares.unshift(dia); // Agregar al inicio para mantener orden cronológico
          diasEncontrados++;
        }
      }

      console.log(
        `📅 Últimos ${cantidadDias} días escolares encontrados:`,
        diasEscolares
      );
      return diasEscolares;
    } catch (error) {
      console.error("Error al obtener últimos días escolares:", error);
      return [];
    }
  }

  /**
   * ✅ NUEVO: Verifica si una fecha es día escolar (sin hora específica)
   */
  public esDiaEscolarFecha(dia: number, mes?: number, anio?: number): boolean {
    try {
      const fechaActual = this.obtenerFechaHoraActualDesdeRedux();
      if (!fechaActual) return false;

      const mesActual = mes !== undefined ? mes - 1 : fechaActual.getMonth(); // Convertir a 0-11
      const anioActual = anio || fechaActual.getFullYear();

      const fecha = new Date(anioActual, mesActual, dia);
      const diaSemana = fecha.getDay(); // 0=domingo, 6=sábado

      return diaSemana >= 1 && diaSemana <= 5; // Solo lunes a viernes
    } catch (error) {
      console.error("Error al verificar día escolar:", error);
      return false;
    }
  }

  /**
   * ✅ ACTUALIZADO: Usar constantes para horarios
   */
  public determinarEstrategiaSegunHorario(): {
    estrategia:
      | "NO_CONSULTAR"
      | "REDIS_ENTRADAS"
      | "REDIS_COMPLETO"
      | "API_CONSOLIDADO";
    razon: string;
    debeConsultar: boolean;
  } {
    const horaActual = this.obtenerHoraActual();

    if (horaActual === null) {
      return {
        estrategia: "API_CONSOLIDADO",
        razon: "No se pudo obtener hora actual - usar API por seguridad",
        debeConsultar: true,
      };
    }

    // ✅ USAR CONSTANTES en lugar de números hardcodeados
    if (horaActual < HORARIOS_CONSULTA.INICIO_DIA_ESCOLAR) {
      return {
        estrategia: "NO_CONSULTAR",
        razon: `Antes de ${String(
          HORARIOS_CONSULTA.INICIO_DIA_ESCOLAR
        ).padStart(2, "0")}:00 - Sin nuevas asistencias`,
        debeConsultar: false,
      };
    }

    if (horaActual >= HORARIOS_CONSULTA.FIN_CONSOLIDACION) {
      return {
        estrategia: "API_CONSOLIDADO",
        razon: `Después de ${String(
          HORARIOS_CONSULTA.FIN_CONSOLIDACION
        ).padStart(2, "0")}:00 - Datos consolidados en PostgreSQL`,
        debeConsultar: true,
      };
    }

    if (horaActual < HORARIOS_CONSULTA.SEPARACION_ENTRADAS_SALIDAS) {
      return {
        estrategia: "REDIS_ENTRADAS",
        razon: `${String(HORARIOS_CONSULTA.INICIO_DIA_ESCOLAR).padStart(
          2,
          "0"
        )}:00-${String(
          HORARIOS_CONSULTA.SEPARACION_ENTRADAS_SALIDAS - 1
        ).padStart(2, "0")}:59 - Consultar Redis solo para entradas`,
        debeConsultar: true,
      };
    }

    return {
      estrategia: "REDIS_COMPLETO",
      razon: `${String(HORARIOS_CONSULTA.SEPARACION_ENTRADAS_SALIDAS).padStart(
        2,
        "0"
      )}:00-${String(HORARIOS_CONSULTA.FIN_CONSOLIDACION - 1).padStart(
        2,
        "0"
      )}:59 - Consultar Redis para entradas y salidas`,
      debeConsultar: true,
    };
  }

  /**
   * ✅ NUEVO: Valida si debe consultar API para mes anterior según última actualización
   */
  public debeConsultarAPIMesAnteriorSegunTimestamp(
    ultimaActualizacion: number,
    mesConsultado: number
  ): {
    debeConsultar: boolean;
    razon: string;
    esDatoFinalizado: boolean;
  } {
    try {
      const mesActualizacion = this.extraerMesDeTimestamp(ultimaActualizacion);

      if (mesActualizacion === mesConsultado) {
        return {
          debeConsultar: true,
          razon:
            "Datos fueron actualizados en el mismo mes consultado - pueden haber cambiado",
          esDatoFinalizado: false,
        };
      } else if (mesActualizacion > mesConsultado) {
        return {
          debeConsultar: false,
          razon:
            "Datos finalizados - última actualización fue en mes posterior al consultado",
          esDatoFinalizado: true,
        };
      } else {
        return {
          debeConsultar: true,
          razon:
            "Datos pueden estar incompletos - última actualización fue antes del mes consultado",
          esDatoFinalizado: false,
        };
      }
    } catch (error) {
      console.error("Error al evaluar consulta por timestamp:", error);
      return {
        debeConsultar: true,
        razon: "Error al evaluar - consultar API por seguridad",
        esDatoFinalizado: false,
      };
    }
  }

  /**
   * Validar si estamos en horario escolar
   * Combina lógica existente con nuevas validaciones
   */
  public validarHorarioEscolar(): {
    esHorarioEscolar: boolean;
    esDiaEscolar: boolean;
    horaActual: number;
    razon: string;
  } {
    const fechaActual = this.obtenerFechaHoraActualDesdeRedux();

    if (!fechaActual) {
      return {
        esHorarioEscolar: false,
        esDiaEscolar: false,
        horaActual: 0,
        razon: "No se pudo obtener fecha desde Redux",
      };
    }

    const horaActual = fechaActual.getHours();
    const diaSemana = fechaActual.getDay(); // 0=domingo, 6=sábado
    const esDiaEscolar = diaSemana >= 1 && diaSemana <= 5; // Lunes a Viernes

    // Validar horario escolar (6:00 AM - 10:00 PM)
    const esHorarioEscolar = horaActual >= 6 && horaActual < 22;

    let razon = "";
    if (!esDiaEscolar) {
      razon = "Es fin de semana";
    } else if (!esHorarioEscolar) {
      razon =
        horaActual < 6
          ? "Muy temprano (antes de 6:00 AM)"
          : "Muy tarde (después de 10:00 PM)";
    } else {
      razon = "Horario escolar válido";
    }

    return {
      esHorarioEscolar: esHorarioEscolar && esDiaEscolar,
      esDiaEscolar,
      horaActual,
      razon,
    };
  }

  /**
   * Determina tipo de consulta según mes
   */
  public determinarTipoConsulta(mes: number): {
    tipo: "MES_FUTURO" | "MES_ANTERIOR" | "MES_ACTUAL";
    debeLogout: boolean;
    razon: string;
  } {
    const fechaActual = this.obtenerFechaHoraActualDesdeRedux();

    if (!fechaActual) {
      return {
        tipo: "MES_ACTUAL",
        debeLogout: false,
        razon: "No se pudo obtener fecha desde Redux",
      };
    }

    const mesActual = fechaActual.getMonth() + 1;

    if (mes > mesActual) {
      return {
        tipo: "MES_FUTURO",
        debeLogout: true,
        razon: "Consulta de mes futuro no permitida - logout forzado",
      };
    } else if (mes < mesActual) {
      return {
        tipo: "MES_ANTERIOR",
        debeLogout: false,
        razon: "Mes anterior - aplicar optimización IndexedDB",
      };
    } else {
      return {
        tipo: "MES_ACTUAL",
        debeLogout: false,
        razon: "Mes actual - aplicar lógica de horarios",
      };
    }
  }

  /**
   * Determina estrategia de consulta para mes actual
   */
  public determinarEstrategiaConsultaMesActual(): {
    estrategia:
      | "NO_CONSULTAR"
      | "REDIS_ENTRADAS"
      | "REDIS_COMPLETO"
      | "API_CONSOLIDADO";
    razon: string;
    horaActual: number;
  } {
    const fechaActual = this.obtenerFechaHoraActualDesdeRedux();

    if (!fechaActual) {
      return {
        estrategia: "API_CONSOLIDADO",
        razon: "No se pudo obtener fecha desde Redux - usar API por seguridad",
        horaActual: 0,
      };
    }

    const horaActual = fechaActual.getHours();
    const esFinDeSemana = this.esFinDeSemana();

    // ✅ CORREGIDO: Fines de semana SÍ permiten consultas
    if (esFinDeSemana) {
      // En fines de semana, usar datos consolidados de API
      return {
        estrategia: "API_CONSOLIDADO",
        razon: "Fin de semana - usar datos consolidados de API",
        horaActual,
      };
    }

    // Lógica de horarios para días escolares
    if (horaActual < 6) {
      return {
        estrategia: "API_CONSOLIDADO", // ✅ CAMBIADO: NO bloquear, usar API
        razon: "Antes de 6:00 AM - usar datos consolidados de API",
        horaActual,
      };
    } else if (horaActual >= 6 && horaActual < 12) {
      return {
        estrategia: "REDIS_ENTRADAS",
        razon:
          "Horario de entradas (6:00-12:00) - consultar Redis para entradas",
        horaActual,
      };
    } else if (horaActual >= 12 && horaActual < 22) {
      return {
        estrategia: "REDIS_COMPLETO",
        razon:
          "Horario completo (12:00-22:00) - consultar Redis para entradas y salidas",
        horaActual,
      };
    } else {
      return {
        estrategia: "API_CONSOLIDADO",
        razon: "Después de 22:00 - datos consolidados en PostgreSQL",
        horaActual,
      };
    }
  }

  /**
   * Valida si debe consultar API para mes anterior
   */
  public debeConsultarAPIMesAnterior(
    existeEnIndexedDB: boolean,
    ultimaFechaActualizacion: number | null,
    mesConsultado: number
  ): {
    debeConsultar: boolean;
    razon: string;
  } {
    if (!existeEnIndexedDB) {
      return {
        debeConsultar: true,
        razon: "No existe en IndexedDB - consulta inicial requerida",
      };
    }

    if (!ultimaFechaActualizacion) {
      return {
        debeConsultar: true,
        razon: "Registro sin fecha de actualización - requiere actualización",
      };
    }

    // Extraer mes de la última actualización
    const fechaActualizacion = new Date(ultimaFechaActualizacion);
    const mesActualizacion = fechaActualizacion.getMonth() + 1;

    if (mesActualizacion === mesConsultado) {
      return {
        debeConsultar: true,
        razon:
          "Datos fueron actualizados en el mismo mes consultado - pueden haber cambiado",
      };
    } else {
      return {
        debeConsultar: false,
        razon:
          "Datos de mes finalizado - no consultar API (optimización aplicada)",
      };
    }
  }

  /**
   * Crear timestamp con fecha actual de Perú
   */
  public crearTimestampActual(): number {
    return this.obtenerTimestampPeruano();
  }

  /**
   * Verificar si una fecha está en el pasado
   */
  public esFechaPasada(timestamp: number): boolean {
    const fechaActual = this.obtenerFechaHoraActualDesdeRedux();
    if (!fechaActual) return false;

    return timestamp < fechaActual.getTime();
  }

  /**
   * Obtener diferencia en días entre dos timestamps
   */
  public obtenerDiferenciaDias(timestamp1: number, timestamp2: number): number {
    const diferenciaMilisegundos = Math.abs(timestamp1 - timestamp2);
    return Math.floor(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
  }

  // ========================================================================================
  // MÉTODOS ORIGINALES (SIN CAMBIOS)
  // ========================================================================================

  /**
   * Calcula el día escolar del mes (sin contar fines de semana)
   */
  public calcularDiaEscolarDelMes(): number {
    const fechaActual = this.obtenerFechaHoraActualDesdeRedux() || new Date();
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
  public debeConsultarAPI(diaEscolar: number): boolean {
    // Si estamos en el primer día escolar del mes, es seguro que no hay IDs en PostgreSQL
    if (diaEscolar <= 1) {
      return false;
    }

    // A partir del segundo día escolar, es probable que ya tengamos registros con IDs
    return diaEscolar >= DIA_ESCOLAR_MINIMO_PARA_CONSULTAR_API;
  }

  /**
   * Obtiene todos los días laborales anteriores al día actual en el mes (usando fecha Redux)
   */
  public obtenerDiasLaboralesAnteriores(): number[] {
    const fechaActual = this.obtenerFechaHoraActualDesdeRedux();

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
   * Función para verificar si un día es día escolar (lunes a viernes)
   */
  public esDiaEscolar(dia: string, fechaRef?: Date): boolean {
    const fechaActual = fechaRef || this.obtenerFechaHoraActualDesdeRedux();
    if (!fechaActual) return false;

    const diaNumero = parseInt(dia);
    if (isNaN(diaNumero)) return false;

    const añoActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth(); // 0-11

    const fecha = new Date(añoActual, mesActual, diaNumero);
    const diaSemana = fecha.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
    return diaSemana >= 1 && diaSemana <= 5; // Solo lunes a viernes
  }

  /**
   * Verifica si es una consulta del mes actual
   */
  public esConsultaMesActual(mes: number): boolean {
    const fechaActual = this.obtenerFechaHoraActualDesdeRedux();
    if (!fechaActual) return false;

    return mes === fechaActual.getMonth() + 1;
  }

  /**
   * Obtiene el mes actual
   */
  public obtenerMesActual(): number | null {
    const fechaActual = this.obtenerFechaHoraActualDesdeRedux();
    return fechaActual ? fechaActual.getMonth() + 1 : null;
  }

  /**
   * Obtiene el día actual
   */
  public obtenerDiaActual(): number | null {
    const fechaActual = this.obtenerFechaHoraActualDesdeRedux();
    return fechaActual ? fechaActual.getDate() : null;
  }

  /**
   * ✅ CORREGIDO: Obtener fecha string actual sin doble conversión de zona horaria
   */
  public obtenerFechaStringActual(): string | null {
    const fechaActual = this.obtenerFechaHoraActualDesdeRedux();
    if (!fechaActual) return null;

    // ✅ CORREGIDO: Usar métodos locales para evitar conversión UTC
    const año = fechaActual.getFullYear();
    const mes = (fechaActual.getMonth() + 1).toString().padStart(2, "0");
    const dia = fechaActual.getDate().toString().padStart(2, "0");

    const fechaString = `${año}-${mes}-${dia}`;

    console.log(
      `📅 Fecha string generada: ${fechaString} (desde Redux: ${fechaActual.toLocaleString(
        "es-PE"
      )})`
    );

    return fechaString;
  }

  /**
   * ✅ CORREGIDO: Convertir timestamp a fecha string sin problemas de zona horaria
   */
  public convertirTimestampAFechaString(timestamp: number): string {
    const fecha = new Date(timestamp);

    // ✅ CORREGIDO: Usar métodos locales para evitar conversión UTC
    const año = fecha.getFullYear();
    const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
    const dia = fecha.getDate().toString().padStart(2, "0");

    const fechaString = `${año}-${mes}-${dia}`;

    console.log(
      `🔄 Timestamp ${timestamp} convertido a fecha: ${fechaString} (fecha objeto: ${fecha.toLocaleString(
        "es-PE"
      )})`
    );

    return fechaString;
  }

  /**
   * Convierte una fecha específica a string formato YYYY-MM-DD
   */
  public convertirFechaAString(fecha: Date): string {
    return fecha.toISOString().split("T")[0];
  }

  /**
   * ✅ CORREGIDO: Generar fecha string para mes y día específicos
   */
  public generarFechaString(mes: number, dia: number, año?: number): string {
    const añoFinal =
      año ||
      this.obtenerFechaHoraActualDesdeRedux()?.getFullYear() ||
      new Date().getFullYear();

    const fechaString = `${añoFinal}-${mes.toString().padStart(2, "0")}-${dia
      .toString()
      .padStart(2, "0")}`;

    console.log(
      `🎯 Fecha string generada manualmente: ${fechaString} (mes: ${mes}, día: ${dia}, año: ${añoFinal})`
    );

    return fechaString;
  }

  /**
   * Obtiene información completa de la fecha actual
   * Reemplaza el acceso directo a Redux desde otras clases
   */
  public obtenerInfoFechaActual(): {
    fechaActual: Date;
    mesActual: number;
    diaActual: number;
    añoActual: number;
    esHoy: boolean;
  } | null {
    try {
      const fechaActual = this.obtenerFechaHoraActualDesdeRedux();

      if (!fechaActual) {
        console.error(
          "No se pudo obtener fecha desde Redux en obtenerInfoFechaActual"
        );
        return null;
      }

      return {
        fechaActual,
        mesActual: fechaActual.getMonth() + 1,
        diaActual: fechaActual.getDate(),
        añoActual: fechaActual.getFullYear(),
        esHoy: true, // Siempre es "hoy" ya que viene de Redux tiempo real
      };
    } catch (error) {
      console.error("Error al obtener información de fecha actual:", error);
      return null;
    }
  }

  /**
   * Verifica si un timestamp es muy antiguo (más de 24 horas)
   * Útil para detectar datos desactualizados
   */
  public esTimestampMuyAntiguo(
    timestamp: number,
    horasLimite: number = 24
  ): boolean {
    try {
      const fechaActual = this.obtenerFechaHoraActualDesdeRedux();
      if (!fechaActual) {
        console.warn(
          "No se pudo obtener fecha actual para verificar timestamp antiguo"
        );
        return false;
      }

      const timestampActual = fechaActual.getTime();
      const diferenciaMilisegundos = timestampActual - timestamp;
      const diferenciaHoras = diferenciaMilisegundos / (1000 * 60 * 60);

      const esAntiguo = diferenciaHoras > horasLimite;

      if (esAntiguo) {
        console.log(
          `⏰ Timestamp antiguo detectado: ${diferenciaHoras.toFixed(
            1
          )} horas de diferencia (límite: ${horasLimite}h)`
        );
      }

      return esAntiguo;
    } catch (error) {
      console.error("Error al verificar si timestamp es antiguo:", error);
      return false;
    }
  }

  /**
   * Formatea un timestamp a texto legible en español-Perú
   */
  public formatearTimestampLegible(timestamp: number): string {
    try {
      const fecha = new Date(timestamp);
      return fecha.toLocaleString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch (error) {
      console.error("Error al formatear timestamp:", error);
      return "Fecha inválida";
    }
  }

  /**
   * Calcula diferencia entre dos timestamps en formato legible
   */
  public calcularDiferenciaTimestamps(
    timestamp1: number,
    timestamp2: number
  ): {
    milisegundos: number;
    segundos: number;
    minutos: number;
    horas: number;
    dias: number;
    textoLegible: string;
  } {
    try {
      const diferenciaMilisegundos = Math.abs(timestamp1 - timestamp2);
      const segundos = Math.floor(diferenciaMilisegundos / 1000);
      const minutos = Math.floor(segundos / 60);
      const horas = Math.floor(minutos / 60);
      const dias = Math.floor(horas / 24);

      let textoLegible = "";
      if (dias > 0) {
        textoLegible = `${dias} día${dias > 1 ? "s" : ""}`;
      } else if (horas > 0) {
        textoLegible = `${horas} hora${horas > 1 ? "s" : ""}`;
      } else if (minutos > 0) {
        textoLegible = `${minutos} minuto${minutos > 1 ? "s" : ""}`;
      } else {
        textoLegible = `${segundos} segundo${segundos > 1 ? "s" : ""}`;
      }

      return {
        milisegundos: diferenciaMilisegundos,
        segundos,
        minutos,
        horas,
        dias,
        textoLegible,
      };
    } catch (error) {
      console.error("Error al calcular diferencia de timestamps:", error);
      return {
        milisegundos: 0,
        segundos: 0,
        minutos: 0,
        horas: 0,
        dias: 0,
        textoLegible: "Error en cálculo",
      };
    }
  }

  /**
   * Obtiene información sobre el estado temporal del mes consultado
   */
  public obtenerEstadoTemporalMes(mes: number): {
    tipo: "MES_FUTURO" | "MES_ANTERIOR" | "MES_ACTUAL";
    descripcion: string;
    debeLogout: boolean;
    esConsultaValida: boolean;
  } {
    try {
      const fechaActual = this.obtenerFechaHoraActualDesdeRedux();

      if (!fechaActual) {
        return {
          tipo: "MES_ACTUAL",
          descripcion: "No se pudo obtener fecha desde Redux",
          debeLogout: false,
          esConsultaValida: false,
        };
      }

      const mesActual = fechaActual.getMonth() + 1;

      if (mes > mesActual) {
        return {
          tipo: "MES_FUTURO",
          descripcion: `Consulta de mes futuro (${mes} > ${mesActual}) - No permitida`,
          debeLogout: true,
          esConsultaValida: false,
        };
      } else if (mes < mesActual) {
        return {
          tipo: "MES_ANTERIOR",
          descripcion: `Consulta de mes anterior (${mes} < ${mesActual}) - Optimización IndexedDB aplicable`,
          debeLogout: false,
          esConsultaValida: true,
        };
      } else {
        return {
          tipo: "MES_ACTUAL",
          descripcion: `Consulta del mes actual (${mes}) - Aplicar lógica de horarios`,
          debeLogout: false,
          esConsultaValida: true,
        };
      }
    } catch (error) {
      console.error("Error al obtener estado temporal del mes:", error);
      return {
        tipo: "MES_ACTUAL",
        descripcion: "Error al determinar estado temporal",
        debeLogout: false,
        esConsultaValida: false,
      };
    }
  }

  /**
   * Valida si una fecha está dentro del año académico actual
   */
  public esFechaDelAñoAcademico(timestamp: number): boolean {
    try {
      const fechaActual = this.obtenerFechaHoraActualDesdeRedux();
      if (!fechaActual) return false;

      const fechaConsultada = new Date(timestamp);
      const añoActual = fechaActual.getFullYear();
      const añoConsultado = fechaConsultada.getFullYear();

      // Año académico generalmente va de marzo de un año a febrero del siguiente
      // Por simplicidad, validamos que esté dentro del año actual o el anterior
      return añoConsultado === añoActual || añoConsultado === añoActual - 1;
    } catch (error) {
      console.error("Error al validar fecha del año académico:", error);
      return false;
    }
  }

  /**
   * Obtiene rango de timestamps para un mes específico
   */
  public obtenerRangoTimestampsMes(
    mes: number,
    año?: number
  ): {
    inicioMes: number;
    finMes: number;
    diasEnMes: number;
  } | null {
    try {
      const fechaActual = this.obtenerFechaHoraActualDesdeRedux();
      const añoFinal =
        año || fechaActual?.getFullYear() || new Date().getFullYear();

      // Primer día del mes a las 00:00:00
      const inicioMes = new Date(añoFinal, mes - 1, 1, 0, 0, 0, 0).getTime();

      // Último día del mes a las 23:59:59
      const ultimoDia = new Date(añoFinal, mes, 0).getDate();
      const finMes = new Date(
        añoFinal,
        mes - 1,
        ultimoDia,
        23,
        59,
        59,
        999
      ).getTime();

      return {
        inicioMes,
        finMes,
        diasEnMes: ultimoDia,
      };
    } catch (error) {
      console.error("Error al obtener rango de timestamps del mes:", error);
      return null;
    }
  }

  /**
   * Crear timestamp para un día específico del mes actual
   */
  public crearTimestampParaDia(
    dia: number,
    hora: number = 0,
    minutos: number = 0
  ): number | null {
    try {
      const fechaActual = this.obtenerFechaHoraActualDesdeRedux();
      if (!fechaActual) return null;

      const nuevaFecha = new Date(fechaActual);
      nuevaFecha.setDate(dia);
      nuevaFecha.setHours(hora, minutos, 0, 0);

      return nuevaFecha.getTime();
    } catch (error) {
      console.error("Error al crear timestamp para día específico:", error);
      return null;
    }
  }
}
