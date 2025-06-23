import { ENTORNO } from "@/constants/ENTORNO";
import {
  OFFSET_DIAS_ADICIONALES_SIU01,
  OFFSET_HORAS_ADICIONALES_SIU01,
  OFFSET_MINUTOS_ADICIONALES_SIU01,
  OFFSET_SEGUNDOS_ADICIONALES_SIU01,
} from "@/constants/mocks/OFFSET_FECHAS_HORAS_SIU01";
import { Entorno } from "@/interfaces/shared/Entornos";

/**
 * Obtiene la fecha y hora actual en Perú aplicando offsets de mockeo si es necesario
 * @returns Date object ajustado con la zona horaria de Perú y offsets de desarrollo
 */
export function obtenerFechaHoraActualPeru(): Date {
  const fechaPerú = new Date();

  // Perú está en UTC-5
  let offsetHorasTotal = -5;
  let offsetDias = 0;
  let offsetMinutos = 0;
  let offsetSegundos = 0;

  // Aplicar offsets adicionales solo en entorno local para testing/mockeo
  if (ENTORNO === Entorno.LOCAL) {
    offsetDias += OFFSET_DIAS_ADICIONALES_SIU01;
    offsetHorasTotal += OFFSET_HORAS_ADICIONALES_SIU01;
    offsetMinutos += OFFSET_MINUTOS_ADICIONALES_SIU01;
    offsetSegundos += OFFSET_SEGUNDOS_ADICIONALES_SIU01;
  }

  // Aplicar todos los offsets
  fechaPerú.setDate(fechaPerú.getDate() + offsetDias);
  fechaPerú.setHours(fechaPerú.getHours() + offsetHorasTotal);
  fechaPerú.setMinutes(fechaPerú.getMinutes() + offsetMinutos);
  fechaPerú.setSeconds(fechaPerú.getSeconds() + offsetSegundos);

  return fechaPerú;
}

/**
 * Función para obtener la fecha actual en Perú en formato YYYY-MM-DD
 * Mantiene retrocompatibilidad con la función original
 */
export function obtenerFechaActualPeru(): string {
  const fechaPerú = obtenerFechaHoraActualPeru();
  return fechaPerú.toISOString().split("T")[0];
}
