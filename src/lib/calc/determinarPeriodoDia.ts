// Define el enum para los períodos del día

import { PeriodoDia } from "@/Assets/voice/others/SaludosDIa";

/**
 * Determina si un timestamp corresponde a la mañana, tarde o noche según los siguientes rangos:
 * - Mañana: 00:00 a 11:59 horas
 * - Tarde: 12:00 a 17:59 horas
 * - Noche: 18:00 a 23:59 horas
 *
 * @param fechaHora - Timestamp en formato ISO o instancia de Date
 * @returns El período del día (Mañana, Tarde o Noche)
 */

export const determinarPeriodoDia = (
  fechaHora: string | Date | number
): PeriodoDia => {
  // Convertir el parámetro a objeto Date

  const fecha = new Date(fechaHora);

  // Obtener la hora (0-23)

  const hora = fecha.getHours();

  // Clasificar según el rango horario

  if (hora >= 0 && hora < 12) {
    return PeriodoDia.MAÑANA;
  } else if (hora >= 12 && hora < 18) {
    return PeriodoDia.TARDE;
  } else {
    return PeriodoDia.NOCHE;
  }
};
