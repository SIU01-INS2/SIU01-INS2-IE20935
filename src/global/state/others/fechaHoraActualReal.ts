import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { ReduxPayload } from "../ReducersPayload";
import getRandomAPI03IntanceURL from "@/lib/helpers/functions/getRandomAPI03InstanceURL";
import { ZONA_HORARIA_LOCAL } from "@/constants/ZONA_HORARIA_LOCAL";
import {
  DiasSemana,
  diasSemanaTextos,
  diasSemanaTextosCortos,
} from "@/interfaces/shared/DiasSemana";
import {
  Meses,
  mesesTextos,
  mesesTextosCortos,
} from "@/interfaces/shared/Meses";

// Constante para el offset de tiempo (para pruebas)
// Modificar estos valores para cambiar el offset aplicado a la hora del servidor
export const TIME_OFFSET = {
  days: -1,
  minutes: 0,
  hours: -8, // Agregar propiedad 'hours' con un valor predeterminado
  seconds: 0,
  enabled: process.env.NODE_ENV === "development", // Habilitar/deshabilitar el offset
};

// Interfaces para datos de tiempo formateados y utilidades
export interface FormatosHora {
  fechaCompleta: string;
  fechaCorta: string;
  horaCompleta: string;
  horaSinSegundos: string;

  // Nuevos formatos
  fechaLegible: string; // Ejemplo: "Lunes, 15 de Enero de 2024"
  fechaNumericaCorta: string; // Ejemplo: "15/01/2024"
  horaAmPm: string; // Ejemplo: "10:30 AM"
}

export interface UtilidadesTiempo {
  hora: number;
  minutos: number;
  segundos: number;
  esDiaEscolar: boolean;
  diaSemana: string; // Nombre del día (Lunes, Martes, etc)
  diaSemanaCorto: string; // Abreviatura (Lun, Mar, etc)
  diaSemanaIndice: number; // 0-6 (0 = Domingo, 6 = Sábado)
  diaMes: number; // 1-31
  mes: string; // Nombre del mes (Enero, Febrero, etc)
  mesCorto: string; // Abreviatura (Ene, Feb, etc)
  mesIndice: number; // 0-11 (0 = Enero, 11 = Diciembre)
  año: number; // Año completo (ej: 2024)
  diasEnMes: number; // Número de días en el mes actual
  esFinDeSemana: boolean; // true si es Sábado o Domingo
  trimestre: number; // 1-4 (trimestre del año)
  semanaDelAño: number; // 1-53
  diaDelAño: number; // 1-366
  esHoy: boolean; // true si la fecha es hoy (sin considerar la hora)
  timestamp: number; // timestamp en milisegundos
}

// Interfaz para la fecha y hora actual con datos formateados
export interface FechaHoraActualRealState {
  fechaHora: string | null;
  timezone: string;
  lastSync: number;
  error: string | null;
  inicializado: boolean;
  formateada: FormatosHora | null;
  utilidades: UtilidadesTiempo | null;
}

const initialState: FechaHoraActualRealState = {
  fechaHora: null,
  timezone: ZONA_HORARIA_LOCAL,
  lastSync: 0,
  error: null,
  inicializado: false,
  formateada: null,
  utilidades: null,
};

/**
 * Obtiene el número de días en un mes específico
 * @param año Año
 * @param mes Mes (0-11)
 * @returns Número de días en el mes
 */
export const obtenerDiasEnMes = (año: number, mes: number): number => {
  return new Date(año, mes + 1, 0).getDate();
};

/**
 * Obtiene el número de semana del año
 * @param fecha Fecha a evaluar
 * @returns Número de semana (1-53)
 */
export const obtenerSemanaDelAño = (fecha: Date): number => {
  // Crear una copia de la fecha para no modificar la original
  const fechaCopia = new Date(fecha);

  // Obtener el primer día del año
  const primerDiaAño = new Date(fecha.getFullYear(), 0, 1);

  // Ajustar al primer día de la semana (domingo)
  const diaSemana = primerDiaAño.getDay();
  primerDiaAño.setDate(primerDiaAño.getDate() - diaSemana);

  // Calcular días transcurridos desde el inicio del año
  const msDiff = fechaCopia.getTime() - primerDiaAño.getTime();
  const diasDesdeInicio = Math.floor(msDiff / (24 * 60 * 60 * 1000));

  // Calcular la semana
  const semana = Math.ceil((diasDesdeInicio + 1) / 7);

  return semana;
};

/**
 * Obtiene el día del año (1-366)
 * @param fecha Fecha a evaluar
 * @returns Día del año
 */
export const obtenerDiaDelAño = (fecha: Date): number => {
  const inicioAño = new Date(fecha.getFullYear(), 0, 0);
  const diff = fecha.getTime() - inicioAño.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
};

/**
 * Obtiene el trimestre del año (1-4)
 * @param fecha Fecha a evaluar
 * @returns Número de trimestre
 */
export const obtenerTrimestre = (fecha: Date): number => {
  return Math.ceil((fecha.getMonth() + 1) / 3);
};

/**
 * Verifica si dos fechas corresponden al mismo día (ignorando la hora)
 * @param fecha1 Primera fecha
 * @param fecha2 Segunda fecha
 * @returns true si ambas fechas son del mismo día
 */
export const esMismoDia = (fecha1: Date, fecha2: Date): boolean => {
  return (
    fecha1.getFullYear() === fecha2.getFullYear() &&
    fecha1.getMonth() === fecha2.getMonth() + 1 &&
    fecha1.getDate() === fecha2.getDate()
  );
};

// Thunk para obtener la hora del servidor
export const fetchFechaHoraActual = createAsyncThunk(
  "fechaHoraActualReal/fetch",
  async (timezone: string = ZONA_HORARIA_LOCAL, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${getRandomAPI03IntanceURL()}/api/time?timezone=${timezone}`
      );

      if (!response.ok) {
        throw new Error("Error al obtener la hora del servidor");
      }

      const data = await response.json();

      // Crear una fecha usando el timestamp ya ajustado a la zona horaria
      const fechaLocal = new Date(data.serverTime);

      // Aplicamos el offset si está habilitado
      if (TIME_OFFSET.enabled) {
        fechaLocal.setDate(fechaLocal.getDate() + TIME_OFFSET.days);
        fechaLocal.setHours(fechaLocal.getHours() + TIME_OFFSET.hours);
        fechaLocal.setMinutes(fechaLocal.getMinutes() + TIME_OFFSET.minutes);
        fechaLocal.setSeconds(fechaLocal.getSeconds() + TIME_OFFSET.seconds);
      }

      return {
        fechaHora: fechaLocal.toISOString(),
        timezone: data.timezone,
        lastSync: Date.now(),
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Error desconocido"
      );
    }
  }
);

// Función auxiliar para actualizar formatos y utilidades
const actualizarFormatosYUtilidades = (state: FechaHoraActualRealState) => {
  if (!state.fechaHora) {
    state.formateada = null;
    state.utilidades = null;
    return;
  }

  const fechaHoraDate = new Date(state.fechaHora);
  const ahora = new Date();

  // Actualizar formatos sin especificar timeZone para evitar doble ajuste
  state.formateada = {
    fechaCompleta: new Intl.DateTimeFormat("es-PE", {
      dateStyle: "full",
      timeStyle: "long",
    }).format(fechaHoraDate),

    fechaCorta: new Intl.DateTimeFormat("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(fechaHoraDate),

    horaCompleta: new Intl.DateTimeFormat("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(fechaHoraDate),

    horaSinSegundos: new Intl.DateTimeFormat("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(fechaHoraDate),

    // Nuevos formatos
    fechaLegible: `${
      diasSemanaTextos[fechaHoraDate.getDay() as DiasSemana]
    }, ${fechaHoraDate.getDate()} de ${
      mesesTextos[(fechaHoraDate.getMonth() + 1) as Meses]
    } de ${fechaHoraDate.getFullYear()}`,

    fechaNumericaCorta: `${fechaHoraDate
      .getDate()
      .toString()
      .padStart(2, "0")}/${(fechaHoraDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${fechaHoraDate.getFullYear()}`,

    horaAmPm: new Intl.DateTimeFormat("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(fechaHoraDate),
  };

  // Obtener datos adicionales de la fecha
  const diaSemanaIndice = fechaHoraDate.getDay() as DiasSemana;
  const diaMes = fechaHoraDate.getDate();
  const mesIndice = (fechaHoraDate.getMonth() + 1) as Meses;
  const año = fechaHoraDate.getFullYear();
  const hora = fechaHoraDate.getHours();
  const minutos = fechaHoraDate.getMinutes();
  const segundos = fechaHoraDate.getSeconds();

  // Calcular valores derivados
  const diasEnMes = obtenerDiasEnMes(año, mesIndice);
  const esFinDeSemana = diaSemanaIndice === 0 || diaSemanaIndice === 6;
  const trimestre = obtenerTrimestre(fechaHoraDate);
  const semanaDelAño = obtenerSemanaDelAño(fechaHoraDate);
  const diaDelAño = obtenerDiaDelAño(fechaHoraDate);
  const esHoy = esMismoDia(fechaHoraDate, ahora);
  const timestamp = fechaHoraDate.getTime();

  // Actualizar utilidades
  state.utilidades = {
    hora,
    minutos,
    segundos,
    esDiaEscolar: diaSemanaIndice >= 1 && diaSemanaIndice <= 5, // Lunes a Viernes

    // Nuevos campos
    diaSemana: diasSemanaTextos[diaSemanaIndice],
    diaSemanaCorto: diasSemanaTextosCortos[diaSemanaIndice],
    diaSemanaIndice,
    diaMes,
    mes: mesesTextos[mesIndice],
    mesCorto: mesesTextosCortos[mesIndice],
    mesIndice,
    año,
    diasEnMes,
    esFinDeSemana,
    trimestre,
    semanaDelAño,
    diaDelAño,
    esHoy,
    timestamp,
  };

  // Marcar como inicializado
  state.inicializado = true;
};

const fechaHoraActualRealSlice = createSlice({
  name: "fechaHoraActualReal",
  initialState,
  reducers: {
    setFechaHoraActualReal: (
      state,
      action: PayloadAction<ReduxPayload<string | null>>
    ) => {
      state.fechaHora = action.payload.value;
      actualizarFormatosYUtilidades(state);
    },
    updateFechaHoraActual: (state) => {
      if (state.fechaHora) {
        // Parseamos la fecha actual
        const fechaActual = new Date(state.fechaHora);

        // Añadimos un segundo para que el tiempo avance
        fechaActual.setSeconds(fechaActual.getSeconds() + 1);

        // Actualizamos el estado con la nueva fecha
        state.fechaHora = fechaActual.toISOString();

        // Actualizamos formatos y utilidades
        actualizarFormatosYUtilidades(state);
      }
    },
    setTimezone: (state, action: PayloadAction<ReduxPayload<string>>) => {
      state.timezone = action.payload.value;
      // Actualizamos formatos y utilidades con la nueva zona horaria
      actualizarFormatosYUtilidades(state);
    },
    avanzarHora: (state, action: PayloadAction<ReduxPayload<number>>) => {
      if (state.fechaHora) {
        const fechaActual = new Date(state.fechaHora);
        fechaActual.setHours(fechaActual.getHours() + action.payload.value);
        state.fechaHora = fechaActual.toISOString();
        actualizarFormatosYUtilidades(state);
      }
    },
    avanzarDia: (state, action: PayloadAction<ReduxPayload<number>>) => {
      if (state.fechaHora) {
        const fechaActual = new Date(state.fechaHora);
        fechaActual.setDate(fechaActual.getDate() + action.payload.value);
        state.fechaHora = fechaActual.toISOString();
        actualizarFormatosYUtilidades(state);
      }
    },
    avanzarMes: (state, action: PayloadAction<ReduxPayload<number>>) => {
      if (state.fechaHora) {
        const fechaActual = new Date(state.fechaHora);
        fechaActual.setMonth(fechaActual.getMonth() + 1 + action.payload.value);
        state.fechaHora = fechaActual.toISOString();
        actualizarFormatosYUtilidades(state);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .addCase(fetchFechaHoraActual.pending, (state: any) => {
        state.error = null;
      })
      .addCase(fetchFechaHoraActual.fulfilled, (state, action) => {
        state.fechaHora = action.payload.fechaHora;
        state.timezone = action.payload.timezone;
        state.lastSync = action.payload.lastSync;
        state.error = null;

        // Actualizamos formatos y utilidades
        actualizarFormatosYUtilidades(state);
      })
      .addCase(fetchFechaHoraActual.rejected, (state, action) => {
        state.error = (action.payload as string) || "Error desconocido";
      });
  },
});

export const {
  setFechaHoraActualReal,
  updateFechaHoraActual,
  setTimezone,
  avanzarHora,
  avanzarDia,
  avanzarMes,
} = fechaHoraActualRealSlice.actions;

export default fechaHoraActualRealSlice.reducer;
