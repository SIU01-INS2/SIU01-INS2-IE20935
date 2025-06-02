import { ENTORNO } from "@/constants/ENTORNO";
import { OFFSET_HORAS_ADICIONALES_SIU01 } from "@/constants/mocks/OFFSET_FECHAS_HORAS_SIU01";
import { Entorno } from "@/interfaces/shared/Entornos";

// Función para obtener la fecha actual en Perú en formato YYYY-MM-DD
export function obtenerFechaActualPeru(): string {
  // Perú está en UTC-5
  const fechaPerú = new Date();
  let offsetHorasAdicionales = -5; // Ajuste para UTC-5

  if (ENTORNO === Entorno.LOCAL)
    offsetHorasAdicionales += OFFSET_HORAS_ADICIONALES_SIU01;

  fechaPerú.setHours(fechaPerú.getHours() + offsetHorasAdicionales); // Ajustar a hora de Perú (UTC-5)
  return fechaPerú.toISOString().split("T")[0];
}
