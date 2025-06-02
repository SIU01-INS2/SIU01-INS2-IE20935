"use client";
import { EstadosAsistenciaPersonalStyles } from "@/Assets/styles/EstadosAsistenciaPersonalStyles";

import { EstadosAsistenciaPersonal } from "@/interfaces/shared/EstadosAsistenciaPersonal";
import { Meses, mesesTextos } from "@/interfaces/shared/Meses";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import getDiasEscolaresPorMes from "@/lib/helpers/functions/date/getDiasEsolaresPorMes";
import { segundosAMinutos } from "@/lib/helpers/functions/time/segundosAMinutos";

import {
  ErrorResponseAPIBase,
  MessageProperty,
} from "@/interfaces/shared/apis/types";
import { useState, useEffect } from "react";
import {
  AsistenciaDePersonalIDB,
  AsistenciaMensualPersonal,
  RegistroEntradaSalida,
} from "@/lib/utils/local/db/models/AsistenciaDePersonal/AsistenciaDePersonalIDB";
import { convertirAFormato12Horas } from "@/lib/helpers/formatters/fechas-hora/formatearAFormato12Horas";
import { ENTORNO } from "@/constants/ENTORNO";
import { Entorno } from "@/interfaces/shared/Entornos";
import {
  EventosIDB,
  IEventoLocal,
} from "@/lib/utils/local/db/models/EventosIDB";

// 🔧 CONSTANTE DE CONFIGURACIÓN PARA DESARROLLO
const CONSIDERAR_DIAS_NO_ESCOLARES = false; // false = solo días laborales, true = incluir sábados y domingos

interface RegistroDia {
  fecha: string;
  entradaProgramada: string;
  entradaReal: string;
  diferenciaEntrada: string;
  estadoEntrada: EstadosAsistenciaPersonal;
  salidaProgramada: string;
  salidaReal: string;
  diferenciaSalida: string;
  estadoSalida: EstadosAsistenciaPersonal;
  esEvento: boolean;
  nombreEvento?: string;
  esDiaNoEscolar?: boolean; // Nuevo campo para identificar fines de semana
}

const RegistrosAsistenciaDePersonal = () => {
  const [selectedRol, setSelectedRol] = useState("");
  const [selectedMes, setSelectedMes] = useState("");
  const [dni, setDni] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingEventos, setLoadingEventos] = useState(false);
  const [data, setData] = useState<AsistenciaMensualPersonal | null>(null);
  const [eventos, setEventos] = useState<IEventoLocal[]>([]);
  const [registros, setRegistros] = useState<RegistroDia[]>([]);
  const [error, setError] = useState<ErrorResponseAPIBase | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Obtener fecha actual
  const fechaActual = new Date();
  const mesActual = fechaActual.getMonth() + 1; // getMonth() devuelve 0-11
  const diaActual = fechaActual.getDate();
  const añoActual = fechaActual.getFullYear();

  // Función para obtener meses disponibles (hasta mayo o mes actual)
  const getMesesDisponibles = () => {
    const mesesDisponibles: { value: string; label: string }[] = [];
    const limiteMaximo = mesActual;

    for (let mes = 3; mes <= limiteMaximo; mes++) {
      // Empezar desde marzo (3)
      mesesDisponibles.push({
        value: mes.toString(),
        label: mesesTextos[mes as Meses],
      });
    }

    return mesesDisponibles;
  };

  // Función para verificar si una fecha debe mostrarse (no futura)
  const esFechaValida = (fecha: string): boolean => {
    const fechaObj = new Date(fecha + "T00:00:00");
    const fechaHoy = new Date(añoActual, mesActual - 1, diaActual); // mes-1 porque Date usa 0-11

    return fechaObj <= fechaHoy;
  };

  const [asistenciaPersonalIDB] = useState(
    () =>
      new AsistenciaDePersonalIDB(
        "API01",
        setLoading,
        (error: ErrorResponseAPIBase | null) => {
          // ✅ CAMBIO: Limpiar error completamente cuando es null
          if (error) {
            setError({
              success: false,
              message: error.message,
            });
          } else {
            setError(null); // ← En lugar de setError({ success: false, message: "" })
          }
        },
        (message: MessageProperty | null) => {
          if (message) {
            setSuccessMessage(message.message);
            setTimeout(() => setSuccessMessage(""), 3000);
          } else {
            setSuccessMessage("");
          }
        }
      )
  );

  const roles = [
    { value: RolesSistema.ProfesorPrimaria, label: "Profesor de Primaria" },
    { value: RolesSistema.ProfesorSecundaria, label: "Profesor de Secundaria" },
    { value: RolesSistema.Auxiliar, label: "Auxiliar" },
    {
      value: RolesSistema.PersonalAdministrativo,
      label: "Personal Administrativo",
    },
  ];

  // 🔧 FUNCIÓN CORREGIDA para verificar si un día es evento
  const esEvento = (
    fecha: string
  ): { esEvento: boolean; nombreEvento?: string } => {
    const evento = eventos.find((e) => {
      // ✅ CORRECCIÓN: Agregar 'T00:00:00' para evitar problemas de zona horaria
      const fechaInicio = new Date(e.Fecha_Inicio + "T00:00:00");
      const fechaFin = new Date(e.Fecha_Conclusion + "T00:00:00");
      const fechaConsulta = new Date(fecha + "T00:00:00");

      console.log(`🔍 Verificando evento "${e.Nombre}":`, {
        fechaConsulta: fechaConsulta.toISOString(),
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
        estaEnRango: fechaConsulta >= fechaInicio && fechaConsulta <= fechaFin,
      });

      return fechaConsulta >= fechaInicio && fechaConsulta <= fechaFin;
    });

    const resultado = {
      esEvento: !!evento,
      nombreEvento: evento?.Nombre,
    };

    if (resultado.esEvento) {
      console.log(`🎉 Fecha ${fecha} ES EVENTO: "${resultado.nombreEvento}"`);
    }

    return resultado;
  };

  // Función para mapear estados del enum a strings para la UI
  const mapearEstadoParaUI = (estado: EstadosAsistenciaPersonal): string => {
    const mapeoEstados: Record<EstadosAsistenciaPersonal, string> = {
      [EstadosAsistenciaPersonal.Temprano]: "Temprano",
      [EstadosAsistenciaPersonal.En_Tiempo]: "En tiempo",
      [EstadosAsistenciaPersonal.Cumplido]: "Cumplido",
      [EstadosAsistenciaPersonal.Salida_Anticipada]: "Salida anticipada",
      [EstadosAsistenciaPersonal.Tarde]: "Tarde",
      [EstadosAsistenciaPersonal.Falta]: "Falta",
      [EstadosAsistenciaPersonal.Sin_Registro]: "Sin registro",
      [EstadosAsistenciaPersonal.No_Registrado]: "No registrado",
      [EstadosAsistenciaPersonal.Inactivo]: "Inactivo",
      [EstadosAsistenciaPersonal.Evento]: "Evento",
      [EstadosAsistenciaPersonal.Otro]: "Otro",
    };

    return mapeoEstados[estado] || estado;
  };

  // 🕐 FUNCIÓN ADAPTADA para calcular la hora programada con formato 12 horas
  const calcularHoraProgramada = (
    timestamp: number,
    desfaseSegundos: number
  ): string => {
    if (timestamp === 0 || timestamp === null) return "N/A";

    // CORRECCIÓN: El timestamp está en UTC, SUMAR 5 horas para mostrar hora de Perú
    const timestampProgramado = timestamp - desfaseSegundos * 1000;

    // SUMAR 5 horas (en milisegundos) para convertir de UTC a hora de Perú
    const timestampPeru = timestampProgramado + 5 * 60 * 60 * 1000;
    const fechaProgramadaPeru = new Date(timestampPeru);

    // Obtener formato 24 horas primero
    const tiempo24Horas = fechaProgramadaPeru.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    // Convertir a formato 12 horas usando tu función
    return convertirAFormato12Horas(tiempo24Horas, false); // sin segundos por defecto
  };

  // 🕐 FUNCIÓN ADAPTADA para formatear hora con formato 12 horas
  const formatearHora = (timestamp: number): string => {
    if (timestamp === 0 || timestamp === null) return "No registrado";

    // CORRECCIÓN: El timestamp está en UTC, SUMAR 5 horas para mostrar hora de Perú
    const timestampPeru = timestamp + 5 * 60 * 60 * 1000;
    const fechaPeru = new Date(timestampPeru);

    // Obtener formato 24 horas primero
    const tiempo24Horas = fechaPeru.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    // Convertir a formato 12 horas usando tu función
    return convertirAFormato12Horas(tiempo24Horas, false); // sin segundos por defecto
  };

  // 🔍 FUNCIÓN DE DEBUG actualizada para mostrar ambos formatos
  const debugTimestamp = (
    label: string,
    timestamp: number,
    desfase?: number
  ) => {
    console.log(`🔍 DEBUG ${label}:`);
    console.log(`  - Timestamp original: ${timestamp}`);
    console.log(`  - Fecha UTC: ${new Date(timestamp).toISOString()}`);

    // Conversión correcta: SUMAR 5 horas a UTC para obtener hora de Perú
    const timestampPeru = timestamp + 5 * 60 * 60 * 1000;
    const fechaPeru = new Date(timestampPeru);

    const tiempo24Horas = fechaPeru.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const tiempo12Horas = convertirAFormato12Horas(tiempo24Horas, false);

    console.log(`  - Timestamp Perú (+5h): ${timestampPeru}`);
    console.log(`  - Hora Perú (24h): ${tiempo24Horas}`);
    console.log(`  - Hora Perú (12h): ${tiempo12Horas}`);

    if (desfase !== undefined) {
      const timestampProgramado = timestamp - desfase * 1000;
      const timestampProgramadoPeru = timestampProgramado + 5 * 60 * 60 * 1000;
      const fechaProgramadaPeru = new Date(timestampProgramadoPeru);

      const tiempoProgramado24h = fechaProgramadaPeru.toLocaleTimeString(
        "es-ES",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }
      );

      const tiempoProgramado12h = convertirAFormato12Horas(
        tiempoProgramado24h,
        false
      );

      console.log(`  - Desfase segundos: ${desfase}`);
      console.log(`  - Hora programada Perú (24h): ${tiempoProgramado24h}`);
      console.log(`  - Hora programada Perú (12h): ${tiempoProgramado12h}`);
    }
  };

  // Función para verificar si una fecha es día laboral (lunes a viernes)
  const esDiaLaboral = (fecha: string): boolean => {
    const fechaObj = new Date(fecha + "T00:00:00");
    const diaSemana = fechaObj.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
    return diaSemana >= 1 && diaSemana <= 5; // Solo lunes a viernes
  };

  // 📅 FUNCIÓN MEJORADA para generar todas las fechas del mes según configuración
  const obtenerFechasDelMes = (mes: number, año: number): string[] => {
    if (CONSIDERAR_DIAS_NO_ESCOLARES && ENTORNO === Entorno.LOCAL) {
      // Generar TODOS los días del mes
      console.log(
        "📅 MODO DESARROLLO: Incluyendo todos los días (incluidos fines de semana)"
      );

      const fechas: string[] = [];
      const ultimoDiaDelMes = new Date(año, mes, 0).getDate(); // mes sin restar 1 da el último día del mes anterior

      for (let dia = 1; dia <= ultimoDiaDelMes; dia++) {
        const fecha = `${año}-${mes.toString().padStart(2, "0")}-${dia
          .toString()
          .padStart(2, "0")}`;
        fechas.push(fecha);
      }

      return fechas;
    } else {
      // Solo días laborables (comportamiento original)
      console.log("📅 MODO PRODUCCIÓN: Solo días laborables");
      return getDiasEscolaresPorMes(mes, año);
    }
  };

  // Función para obtener asistencias combinadas de entrada y salida - ✅ MEJORADA PARA USAR EL NUEVO MÉTODO
  const obtenerAsistenciasCombinadas = async (
    rol: RolesSistema,
    dni: string,
    mes: number
  ): Promise<Record<
    string,
    { entrada?: RegistroEntradaSalida; salida?: RegistroEntradaSalida }
  > | null> => {
    try {
      // ✅ CAMBIO PRINCIPAL: Usar el método que incluye cache en lugar del método directo
      console.log(
        `🔄 Obteniendo asistencias combinadas usando método con cache: ${rol} ${dni} - mes ${mes}`
      );

      const resultado =
        await asistenciaPersonalIDB.obtenerAsistenciaMensualConAPI(
          rol,
          dni,
          mes
        );

      if (!resultado.encontrado) {
        console.log(`❌ No se encontraron datos para ${dni} - mes ${mes}`);
        return null;
      }

      // ✅ PROCESAR DATOS DEL MÉTODO QUE INCLUYE CACHE
      const registrosCombinados: Record<
        string,
        { entrada?: RegistroEntradaSalida; salida?: RegistroEntradaSalida }
      > = {};

      const año = new Date().getFullYear();

      // Procesar entradas - FILTRAR SEGÚN CONFIGURACIÓN
      if (resultado.entrada) {
        Object.entries(resultado.entrada.registros).forEach(
          ([dia, registro]) => {
            // Crear fecha para verificar si es día laboral
            const fechaCompleta = `${año}-${mes
              .toString()
              .padStart(2, "0")}-${dia.padStart(2, "0")}`;

            const esLaboral = esDiaLaboral(fechaCompleta);
            const debeIncluir = CONSIDERAR_DIAS_NO_ESCOLARES || esLaboral;

            if (debeIncluir) {
              if (!registrosCombinados[dia]) {
                registrosCombinados[dia] = {};
              }
              registrosCombinados[dia].entrada = registro;
              console.log(
                `✅ INCLUIDO entrada del día ${dia} (${fechaCompleta}) - ${
                  esLaboral ? "Día laboral" : "Fin de semana"
                } - Estado: ${registro.estado}`
              );
            } else {
              console.log(
                `🚫 IGNORADO entrada del día ${dia} (${fechaCompleta}) - No es día laboral`
              );
            }
          }
        );
      }

      // Procesar salidas - FILTRAR SEGÚN CONFIGURACIÓN
      if (resultado.salida) {
        Object.entries(resultado.salida.registros).forEach(
          ([dia, registro]) => {
            // Crear fecha para verificar si es día laboral
            const fechaCompleta = `${año}-${mes
              .toString()
              .padStart(2, "0")}-${dia.padStart(2, "0")}`;

            const esLaboral = esDiaLaboral(fechaCompleta);
            const debeIncluir = CONSIDERAR_DIAS_NO_ESCOLARES || esLaboral;

            if (debeIncluir) {
              if (!registrosCombinados[dia]) {
                registrosCombinados[dia] = {};
              }
              registrosCombinados[dia].salida = registro;
              console.log(
                `✅ INCLUIDO salida del día ${dia} (${fechaCompleta}) - ${
                  esLaboral ? "Día laboral" : "Fin de semana"
                } - Estado: ${registro.estado}`
              );
            } else {
              console.log(
                `🚫 IGNORADO salida del día ${dia} (${fechaCompleta}) - No es día laboral`
              );
            }
          }
        );
      }

      console.log(
        "📊 DEBUG - Registros combinados finales (incluyendo cache):",
        registrosCombinados
      );

      return Object.keys(registrosCombinados).length > 0
        ? registrosCombinados
        : null;
    } catch (error) {
      console.error("Error al obtener asistencias combinadas:", error);
      return null;
    }
  };

  // ✅ MODIFICACIÓN ADICIONAL: Mejorar el procesamiento de datos para mostrar mejor la info del cache
  const procesarDatos = async () => {
    if (!selectedRol || !selectedMes || !dni) return;

    try {
      // ✅ USAR LA FUNCIÓN MEJORADA que ahora incluye datos del cache
      const registrosCombinados = await obtenerAsistenciasCombinadas(
        selectedRol as RolesSistema,
        dni,
        parseInt(selectedMes)
      );

      const año = new Date().getFullYear();
      const mes = parseInt(selectedMes);

      // 📅 USAR NUEVA FUNCIÓN que respeta la configuración de días
      const todasLasFechas = obtenerFechasDelMes(mes, año);

      console.log(`📅 DEBUG - Año: ${año}, Mes: ${mes}`);
      console.log(
        `📅 DEBUG - Configuración CONSIDERAR_DIAS_NO_ESCOLARES: ${CONSIDERAR_DIAS_NO_ESCOLARES}`
      );
      console.log(`📅 DEBUG - Fechas generadas:`, todasLasFechas);
      console.log(
        `📅 DEBUG - Claves del JSON (incluyendo cache):`,
        registrosCombinados ? Object.keys(registrosCombinados) : "Sin registros"
      );

      // FILTRAR SOLO FECHAS VÁLIDAS (hasta hoy)
      const fechasFiltradas = todasLasFechas.filter((fecha) =>
        esFechaValida(fecha)
      );

      console.log(`📅 DEBUG - Fechas filtradas (hasta hoy):`, fechasFiltradas);

      const registrosResultado: RegistroDia[] = fechasFiltradas.map((fecha) => {
        const fechaObj = new Date(fecha + "T00:00:00");
        const dia = fechaObj.getDate().toString();
        const eventoInfo = esEvento(fecha);
        const esLaboral = esDiaLaboral(fecha);

        console.log(
          `🔍 DEBUG - Procesando fecha ${fecha} -> día ${dia} (${
            esLaboral ? "laboral" : "no laboral"
          }):`,
          registrosCombinados
            ? registrosCombinados[dia]
            : "Sin registros combinados"
        );

        // Si es evento, retornar registro especial
        if (eventoInfo.esEvento) {
          return {
            fecha,
            entradaProgramada: "N/A",
            entradaReal: "Evento",
            diferenciaEntrada: "N/A",
            estadoEntrada: EstadosAsistenciaPersonal.Evento,
            salidaProgramada: "N/A",
            salidaReal: "Evento",
            diferenciaSalida: "N/A",
            estadoSalida: EstadosAsistenciaPersonal.Evento,
            esEvento: true,
            nombreEvento: eventoInfo.nombreEvento,
            esDiaNoEscolar: !esLaboral,
          };
        }

        // REGLA 4: Si no hay registros combinados O no hay registro para este día específico
        // = No se tomó asistencia ese día
        if (!registrosCombinados || !registrosCombinados[dia]) {
          console.log(`⚠️ DEBUG - Día ${dia}: No se tomó asistencia`);
          return {
            fecha,
            entradaProgramada: "N/A",
            entradaReal: "No se tomó asistencia",
            diferenciaEntrada: "N/A",
            estadoEntrada: EstadosAsistenciaPersonal.Sin_Registro,
            salidaProgramada: "N/A",
            salidaReal: "No se tomó asistencia",
            diferenciaSalida: "N/A",
            estadoSalida: EstadosAsistenciaPersonal.Sin_Registro,
            esEvento: false,
            esDiaNoEscolar: !esLaboral,
          };
        }

        const registroDia = registrosCombinados[dia];

        // ✅ RESTO DEL PROCESAMIENTO IGUAL (sin cambios en esta parte)
        // ... (mantener toda la lógica existente de procesamiento de entrada y salida)

        // Procesar información de entrada
        let entradaProgramada = "N/A";
        let entradaReal = "No registrado";
        let diferenciaEntrada = "N/A";
        let estadoEntrada = EstadosAsistenciaPersonal.No_Registrado;

        if (registroDia.entrada) {
          console.log(
            `🔍 DEBUG - RAW entrada día ${dia}:`,
            JSON.stringify(registroDia.entrada, null, 2)
          );

          // REGLA 2: Si toda la entrada es null = Usuario inactivo ("24": null)
          if (registroDia.entrada === null) {
            entradaReal = "Inactivo";
            estadoEntrada = EstadosAsistenciaPersonal.Inactivo;
            console.log(
              `❌ DEBUG - Día ${dia} entrada: INACTIVO (entrada completa null)`
            );
          }
          // REGLA 3: Si timestamp Y desfase son null/0 = Falta
          else if (
            (registroDia.entrada.timestamp === null ||
              registroDia.entrada.timestamp === 0) &&
            (registroDia.entrada.desfaseSegundos === null ||
              registroDia.entrada.desfaseSegundos === 0)
          ) {
            entradaReal = "Falta";
            estadoEntrada = EstadosAsistenciaPersonal.Falta;
            console.log(
              `❌ DEBUG - Día ${dia} entrada: FALTA (timestamp y desfase null/0)`
            );
          }
          // Si hay timestamp válido, usar datos reales
          else if (registroDia.entrada.timestamp > 0) {
            // 🔍 AÑADIR debug de timestamp
            debugTimestamp(
              "ENTRADA",
              registroDia.entrada.timestamp,
              registroDia.entrada.desfaseSegundos
            );

            // Usar el estado que viene del registro directamente
            estadoEntrada = registroDia.entrada.estado;
            entradaProgramada = calcularHoraProgramada(
              registroDia.entrada.timestamp,
              registroDia.entrada.desfaseSegundos
            );
            entradaReal = formatearHora(registroDia.entrada.timestamp);
            const desfaseMinutos = segundosAMinutos(
              registroDia.entrada.desfaseSegundos
            );
            diferenciaEntrada = `${
              desfaseMinutos >= 0 ? "+" : ""
            }${desfaseMinutos} min`;
            console.log(
              `✅ DEBUG - Día ${dia} entrada: ${mapearEstadoParaUI(
                estadoEntrada
              )} (timestamp: ${registroDia.entrada.timestamp}) - DESDE CACHE`
            );
          }
          // Casos edge donde hay estado pero no timestamp válido
          else {
            estadoEntrada = registroDia.entrada.estado;
            entradaReal = mapearEstadoParaUI(estadoEntrada);
            console.log(
              `⚠️ DEBUG - Día ${dia} entrada: ${mapearEstadoParaUI(
                estadoEntrada
              )} (sin timestamp válido) - DESDE CACHE`
            );
          }
        }

        // Procesar información de salida (similar a entrada)
        let salidaProgramada = "N/A";
        let salidaReal = "No registrado";
        let diferenciaSalida = "N/A";
        let estadoSalida = EstadosAsistenciaPersonal.No_Registrado;

        if (registroDia.salida) {
          console.log(
            `🔍 DEBUG - RAW salida día ${dia}:`,
            JSON.stringify(registroDia.salida, null, 2)
          );

          // Similar lógica que entrada pero para salida
          if (registroDia.salida === null) {
            salidaReal = "Inactivo";
            estadoSalida = EstadosAsistenciaPersonal.Inactivo;
          } else if (
            (registroDia.salida.timestamp === null ||
              registroDia.salida.timestamp === 0) &&
            (registroDia.salida.desfaseSegundos === null ||
              registroDia.salida.desfaseSegundos === 0)
          ) {
            salidaReal = "Falta";
            estadoSalida = EstadosAsistenciaPersonal.Falta;
          } else if (registroDia.salida.timestamp > 0) {
            debugTimestamp(
              "SALIDA",
              registroDia.salida.timestamp,
              registroDia.salida.desfaseSegundos
            );

            estadoSalida = registroDia.salida.estado;
            salidaProgramada = calcularHoraProgramada(
              registroDia.salida.timestamp,
              registroDia.salida.desfaseSegundos
            );
            salidaReal = formatearHora(registroDia.salida.timestamp);
            const desfaseMinutos = segundosAMinutos(
              registroDia.salida.desfaseSegundos
            );
            diferenciaSalida = `${
              desfaseMinutos >= 0 ? "+" : ""
            }${desfaseMinutos} min`;
            console.log(
              `✅ DEBUG - Día ${dia} salida: ${mapearEstadoParaUI(
                estadoSalida
              )} (timestamp: ${registroDia.salida.timestamp}) - DESDE CACHE`
            );
          } else {
            estadoSalida = registroDia.salida.estado;
            salidaReal = mapearEstadoParaUI(estadoSalida);
            console.log(
              `⚠️ DEBUG - Día ${dia} salida: ${mapearEstadoParaUI(
                estadoSalida
              )} (sin timestamp válido) - DESDE CACHE`
            );
          }
        }

        const resultado = {
          fecha,
          entradaProgramada,
          entradaReal,
          diferenciaEntrada,
          estadoEntrada,
          salidaProgramada,
          salidaReal,
          diferenciaSalida,
          estadoSalida,
          esEvento: false,
          esDiaNoEscolar: !esLaboral,
        };

        console.log(
          `📊 DEBUG - Resultado final día ${dia} (con cache):`,
          resultado
        );
        return resultado;
      });

      setRegistros(registrosResultado);
    } catch (error) {
      console.error("Error al procesar datos:", error);
      setError({
        success: false,
        message: "Error al procesar los datos de asistencia",
      });
    }
  };

  // Función para obtener eventos (mock)
  const obtenerEventos = async (mes: number) => {
    try {
      const eventosIDB = new EventosIDB("API01", setLoadingEventos);

      const eventosDelMes = await eventosIDB.getEventosPorMes(mes);
      setEventos(eventosDelMes);
    } catch (error) {
      console.error("Error obteniendo eventos:", error);
    }
  };

  // ✅ CORRECCIÓN 1: Limpiar error correctamente
  const buscarAsistencias = async () => {
    if (!selectedRol || !selectedMes || !dni || dni.length !== 8) {
      setError({
        success: false,
        message: "Por favor completa todos los campos correctamente",
      });
      return;
    }

    // ✅ CAMBIO: Limpiar error completamente en lugar de setear mensaje vacío
    setError(null); // ← En lugar de setError({ success: false, message: "" })
    setSuccessMessage("");
    setLoading(true);

    try {
      await obtenerEventos(parseInt(selectedMes));

      const resultado =
        await asistenciaPersonalIDB.obtenerAsistenciaMensualConAPI(
          selectedRol as RolesSistema,
          dni,
          parseInt(selectedMes)
        );

      if (resultado.encontrado) {
        let datosParaMostrar: AsistenciaMensualPersonal;

        if (resultado.entrada) {
          datosParaMostrar = resultado.entrada;
        } else if (resultado.salida) {
          datosParaMostrar = resultado.salida;
        } else {
          throw new Error("No se pudieron procesar los datos obtenidos");
        }

        setData(datosParaMostrar);
        setSuccessMessage(resultado.mensaje);
      } else {
        setError({ success: false, message: resultado.mensaje });
        setData(null);
        setRegistros([]);
      }
    } catch (error) {
      console.error("Error al buscar asistencias:", error);
      setError({
        success: false,
        message: "Error al obtener los datos de asistencia",
      });
      setData(null);
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  };

  // Procesar datos cuando cambien
  useEffect(() => {
    if (data && selectedRol && selectedMes && dni) {
      procesarDatos();
    }
  }, [data, eventos, selectedRol, selectedMes, dni]);

  return (
    <div className="p-4 lg-only:p-6">
      {/* 🔧 BANNER DE DESARROLLO cuando está activado el modo días no escolares */}
      {CONSIDERAR_DIAS_NO_ESCOLARES && ENTORNO === Entorno.LOCAL && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg mb-4">
          <div className="flex items-center">
            <span className="text-lg mr-2">⚠️</span>
            <div>
              <p className="font-medium">Modo Desarrollo Activado</p>
              <p className="text-sm">
                Se están mostrando registros de todos los días (incluidos
                sábados y domingos). Para producción, cambiar
                CONSIDERAR_DIAS_NO_ESCOLARES a false.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de búsqueda */}
      <div className="bg-white rounded-lg shadow-md p-4 lg-only:p-6 mb-6">
        <h2 className="text-xl lg-only:text-2xl font-bold text-gris-oscuro mb-4">
          Consulta de Asistencias de Personal
        </h2>

        <div className="grid grid-cols-1 md-only:grid-cols-2 lg-only:grid-cols-4 gap-4">
          {/* Selector de Rol */}
          <div>
            <label className="block text-sm font-medium text-gris-oscuro mb-2">
              Rol
            </label>
            <select
              value={selectedRol}
              onChange={(e) => setSelectedRol(e.target.value)}
              disabled={loading || loadingEventos} // Bloquear durante carga
              className="w-full px-3 py-2 border border-gris-claro rounded-md focus:outline-none focus:ring-2 focus:ring-azul-principal disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Seleccionar rol</option>
              {roles.map((rol) => (
                <option key={rol.value} value={rol.value}>
                  {rol.label}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Mes - LIMITADO */}
          <div>
            <label className="block text-sm font-medium text-gris-oscuro mb-2">
              Mes
            </label>
            <select
              value={selectedMes}
              onChange={(e) => setSelectedMes(e.target.value)}
              disabled={loading && loadingEventos} // Bloquear durante carga
              className="w-full px-3 py-2 border border-gris-claro rounded-md focus:outline-none focus:ring-2 focus:ring-azul-principal disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Seleccionar mes</option>
              {getMesesDisponibles().map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Input DNI */}
          <div>
            <label className="block text-sm font-medium text-gris-oscuro mb-2">
              DNI
            </label>
            <input
              type="text"
              value={dni}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 8);
                setDni(value);
              }}
              disabled={loading && loadingEventos} // Bloquear durante carga
              minLength={8}
              maxLength={8}
              placeholder="12345678"
              className="w-full px-3 py-2 border border-gris-claro rounded-md focus:outline-none focus:ring-2 focus:ring-azul-principal disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Botón de búsqueda */}
          <div className="flex items-end">
            <button
              onClick={buscarAsistencias}
              disabled={loading || loadingEventos}
              className="w-full bg-azul-principal text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading && loadingEventos ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Buscando...
                </>
              ) : (
                "Buscar"
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
            <p className="text-red-700 text-sm">{error.message}</p>
          </div>
        )}

        {/* Mensaje de éxito */}
        {successMessage && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-md">
            <p className="text-green-700 text-sm">{successMessage}</p>
          </div>
        )}
      </div>

      {/* Información del usuario */}
      {data && !loading && !loadingEventos && (
        <div className="bg-white rounded-lg shadow-md p-4 lg-only:p-6 mb-6">
          <h3 className="text-lg lg-only:text-xl font-semibold text-gris-oscuro mb-2">
            Asistencias del {roles.find((r) => r.value === selectedRol)?.label}
          </h3>
          <p className="text-gris-intermedio">
            <span className="font-medium">DNI: {data.Dni_Personal}</span> - Mes:{" "}
            {mesesTextos[data.mes as Meses]}
          </p>
          <p className="text-xs text-gris-intermedio mt-1">
            Total de registros: {registros.length}{" "}
            {CONSIDERAR_DIAS_NO_ESCOLARES && ENTORNO === Entorno.LOCAL
              ? "(todos los días hasta la fecha actual)"
              : "(solo días laborables hasta la fecha actual)"}
          </p>
        </div>
      )}

      {(loading || loadingEventos) && (
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              {/* Spinner principal */}
              <div className="w-16 h-16 border-4 border-gray-200 border-t-azul-principal rounded-full animate-spin"></div>
              {/* Pulsos concéntricos - MANTENER */}
              <div className="absolute inset-0 w-16 h-16 border-4 border-azul-principal/20 rounded-full animate-ping"></div>
            </div>
            <p className="mt-4 text-gris-intermedio font-medium">
              Consultando registros de asistencia...
            </p>
            <p className="text-sm text-gris-intermedio">
              Esto puede tomar unos segundos
            </p>
          </div>
        </div>
      )}

      {/* Tabla de registros */}
      {registros.length > 0 && !loading && !loadingEventos && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gris-oscuro text-white">
                <tr>
                  <th className="px-2 lg-only:px-4 py-3 text-center text-xs lg-only:text-sm font-medium">
                    Fecha
                  </th>
                  <th className="px-2 lg-only:px-4 py-3 text-center text-xs lg-only:text-sm font-medium">
                    Entrada Programada
                  </th>
                  <th className="px-2 lg-only:px-4 py-3 text-center text-xs lg-only:text-sm font-medium">
                    Entrada Real
                  </th>
                  <th className="px-2 lg-only:px-4 py-3 text-center text-xs lg-only:text-sm font-medium">
                    Diferencia Entrada
                  </th>
                  <th className="px-2 lg-only:px-4 py-3 text-center text-xs lg-only:text-sm font-medium">
                    Estado Entrada
                  </th>
                  <th className="px-2 lg-only:px-4 py-3 text-center text-xs lg-only:text-sm font-medium">
                    Salida Programada
                  </th>
                  <th className="px-2 lg-only:px-4 py-3 text-center text-xs lg-only:text-sm font-medium">
                    Salida Real
                  </th>
                  <th className="px-2 lg-only:px-4 py-3 text-center text-xs lg-only:text-sm font-medium">
                    Diferencia Salida
                  </th>
                  <th className="px-2 lg-only:px-4 py-3 text-center text-xs lg-only:text-sm font-medium">
                    Estado Salida
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gris-claro">
                {registros.map((registro, index) => (
                  <tr
                    key={registro.fecha}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } ${registro.esDiaNoEscolar ? "bg-blue-50" : ""}`}
                  >
                    <td className="px-2 lg-only:px-4 py-3 text-xs lg-only:text-sm text-gris-oscuro text-center">
                      <div className="flex flex-col items-center">
                        <span>
                          {new Date(
                            registro.fecha + "T00:00:00"
                          ).toLocaleDateString("es-ES", {
                            weekday: "short",
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </span>
                        {registro.esEvento && (
                          <div className="text-xs text-violeta-principal font-medium mt-1">
                            {registro.nombreEvento}
                          </div>
                        )}
                        {registro.esDiaNoEscolar && !registro.esEvento && (
                          <div className="text-xs text-blue-600 font-medium mt-1">
                            📅 Fin de semana
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 lg-only:px-4 py-3 text-xs lg-only:text-sm text-gris-oscuro text-center">
                      {registro.entradaProgramada}
                    </td>
                    <td className="px-2 lg-only:px-4 py-3 text-xs lg-only:text-sm text-gris-oscuro text-center">
                      {registro.entradaReal}
                    </td>
                    <td className="px-2 lg-only:px-4 py-3 text-xs lg-only:text-sm text-gris-oscuro text-center">
                      {registro.diferenciaEntrada}
                    </td>
                    <td className="px-2 lg-only:px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          EstadosAsistenciaPersonalStyles[
                            registro.estadoEntrada
                          ]
                        }`}
                      >
                        {mapearEstadoParaUI(registro.estadoEntrada)}
                      </span>
                    </td>
                    <td className="px-2 lg-only:px-4 py-3 text-xs lg-only:text-sm text-gris-oscuro text-center">
                      {registro.salidaProgramada}
                    </td>
                    <td className="px-2 lg-only:px-4 py-3 text-xs lg-only:text-sm text-gris-oscuro text-center">
                      {registro.salidaReal}
                    </td>
                    <td className="px-2 lg-only:px-4 py-3 text-xs lg-only:text-sm text-gris-oscuro text-center">
                      {registro.diferenciaSalida}
                    </td>
                    <td className="px-2 lg-only:px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          EstadosAsistenciaPersonalStyles[registro.estadoSalida]
                        }`}
                      >
                        {mapearEstadoParaUI(registro.estadoSalida)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leyenda explicativa de estados */}
      {registros.length > 0 && !loading && !loadingEventos && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-4 lg-only:p-6">
          <h4 className="text-sm lg-only:text-base font-semibold text-gris-oscuro mb-4">
            Leyenda de Estados de Asistencia
          </h4>
          <div className="grid grid-cols-1 md-only:grid-cols-2 lg-only:grid-cols-3 gap-3 lg-only:gap-4">
            {/* Estados de Entrada */}
            <div className="space-y-3">
              <h5 className="text-xs lg-only:text-sm font-medium text-gris-oscuro bg-gray-100 px-2 py-1 rounded">
                Estados de Entrada
              </h5>

              <div className="flex items-start space-x-2">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    EstadosAsistenciaPersonalStyles[
                      EstadosAsistenciaPersonal.En_Tiempo
                    ]
                  }`}
                >
                  En tiempo
                </span>
                <p className="text-xs text-gris-intermedio">
                  Llegó dentro del horario establecido
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    EstadosAsistenciaPersonalStyles[
                      EstadosAsistenciaPersonal.Temprano
                    ]
                  }`}
                >
                  Temprano
                </span>
                <p className="text-xs text-gris-intermedio">
                  Llegó antes del horario programado
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    EstadosAsistenciaPersonalStyles[
                      EstadosAsistenciaPersonal.Tarde
                    ]
                  }`}
                >
                  Tarde
                </span>
                <p className="text-xs text-gris-intermedio">
                  Llegó después del horario establecido
                </p>
              </div>
            </div>

            {/* Estados de Salida */}
            <div className="space-y-3">
              <h5 className="text-xs lg-only:text-sm font-medium text-gris-oscuro bg-gray-100 px-2 py-1 rounded">
                Estados de Salida
              </h5>

              <div className="flex items-start space-x-2">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    EstadosAsistenciaPersonalStyles[
                      EstadosAsistenciaPersonal.Cumplido
                    ]
                  }`}
                >
                  Cumplido
                </span>
                <p className="text-xs text-gris-intermedio">
                  Completó su horario laboral correctamente
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    EstadosAsistenciaPersonalStyles[
                      EstadosAsistenciaPersonal.Salida_Anticipada
                    ]
                  }`}
                >
                  Salida anticipada
                </span>
                <p className="text-xs text-gris-intermedio">
                  Se retiró antes del horario establecido
                </p>
              </div>
            </div>

            {/* Estados Especiales */}
            <div className="space-y-3">
              <h5 className="text-xs lg-only:text-sm font-medium text-gris-oscuro bg-gray-100 px-2 py-1 rounded">
                Estados Especiales
              </h5>

              <div className="flex items-start space-x-2">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    EstadosAsistenciaPersonalStyles[
                      EstadosAsistenciaPersonal.Falta
                    ]
                  }`}
                >
                  Falta
                </span>
                <p className="text-xs text-gris-intermedio">
                  No asistió al trabajo ese día
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    EstadosAsistenciaPersonalStyles[
                      EstadosAsistenciaPersonal.No_Registrado
                    ]
                  }`}
                >
                  No registrado
                </span>
                <p className="text-xs text-gris-intermedio">
                  No marcó entrada/salida en el sistema
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    EstadosAsistenciaPersonalStyles[
                      EstadosAsistenciaPersonal.Sin_Registro
                    ]
                  }`}
                >
                  Sin registro
                </span>
                <p className="text-xs text-gris-intermedio">
                  No se tomó asistencia ese día
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    EstadosAsistenciaPersonalStyles[
                      EstadosAsistenciaPersonal.Inactivo
                    ]
                  }`}
                >
                  Inactivo
                </span>
                <p className="text-xs text-gris-intermedio">
                  Usuario inactivo en el sistema
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    EstadosAsistenciaPersonalStyles[
                      EstadosAsistenciaPersonal.Evento
                    ]
                  }`}
                >
                  Evento
                </span>
                <p className="text-xs text-gris-intermedio">
                  Día feriado o evento especial
                </p>
              </div>
            </div>
          </div>

          {/* Nota explicativa */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              <span className="font-medium">Nota:</span> Los estados se calculan
              automáticamente según la diferencia entre el horario programado y
              el horario real de entrada/salida registrado en el sistema.
              {CONSIDERAR_DIAS_NO_ESCOLARES && ENTORNO === Entorno.LOCAL && (
                <span className="block mt-1">
                  <span className="font-medium">Desarrollo:</span> Los registros
                  con fondo azul claro corresponden a fines de semana.
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrosAsistenciaDePersonal;
