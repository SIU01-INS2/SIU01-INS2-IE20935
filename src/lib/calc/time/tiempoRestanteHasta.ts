import { FechaHoraActualRealState } from "@/global/state/others/fechaHoraActualReal";

export interface TiempoRestante {
  total: number;
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  yaVencido: boolean;
  formateado: string;
  // Nuevos campos
  formatoCorto: string; // Ejemplo: "2d 5h 30m"
  porcentajeCompletado: number; // 0-100, útil para barras de progreso
  enRango: boolean; // true si el tiempo está dentro de un rango especificado
}

// Función selectora para obtener tiempo restante hasta una fecha objetivo
export const tiempoRestanteHasta = (
  state: { fechaHoraActualReal: FechaHoraActualRealState },
  fechaObjetivoPeruana: string | Date,
  fechaInicio?: string | Date
): TiempoRestante | null => {
  if (!state.fechaHoraActualReal.fechaHora) return null;

  // Usamos directamente la fecha actual sin transformaciones adicionales de zona horaria
  const fechaActual = fechaInicio
    ? typeof fechaInicio === "string"
      ? new Date(fechaInicio)
      : fechaInicio
    : new Date(state.fechaHoraActualReal.fechaHora);

  // Convertir la fecha objetivo a un objeto Date
  const fechaObjetivoObj =
    typeof fechaObjetivoPeruana === "string"
      ? new Date(fechaObjetivoPeruana)
      : fechaObjetivoPeruana;

  // Calcular diferencia en milisegundos
  const diffMs = fechaObjetivoObj.getTime() - fechaActual.getTime();

  // Calcular porcentaje completado si se proporciona una fecha de inicio
  let porcentajeCompletado = 0;
  let enRango = false;

  if (fechaInicio) {
    const fechaInicioObj =
      typeof fechaInicio === "string" ? new Date(fechaInicio) : fechaInicio;

    const duracionTotal = fechaObjetivoObj.getTime() - fechaInicioObj.getTime();
    const tiempoTranscurrido = fechaActual.getTime() - fechaInicioObj.getTime();

    if (duracionTotal > 0) {
      porcentajeCompletado = Math.min(
        100,
        Math.max(0, (tiempoTranscurrido / duracionTotal) * 100)
      );
      enRango = tiempoTranscurrido >= 0 && tiempoTranscurrido <= duracionTotal;
    }
  }

  // Si la fecha ya pasó
  if (diffMs <= 0) {
    return {
      total: 0,
      dias: 0,
      horas: 0,
      minutos: 0,
      segundos: 0,
      yaVencido: true,
      formateado: "Fecha vencida",
      formatoCorto: "Vencido",
      porcentajeCompletado: 100,
      enRango: false,
    };
  }

  // Convertir a unidades de tiempo
  const segundos = Math.floor((diffMs / 1000) % 60);
  const minutos = Math.floor((diffMs / (1000 * 60)) % 60);
  const horas = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Formato legible
  let formateado = "";
  if (dias > 0) formateado += `${dias} día${dias > 1 ? "s" : ""} `;
  if (horas > 0 || dias > 0)
    formateado += `${horas} hora${horas > 1 ? "s" : ""} `;
  if (minutos > 0 || horas > 0 || dias > 0)
    formateado += `${minutos} minuto${minutos > 1 ? "s" : ""} `;
  formateado += `${segundos} segundo${segundos > 1 ? "s" : ""}`;

  // Formato corto
  let formatoCorto = "";
  if (dias > 0) formatoCorto += `${dias}d `;
  if (horas > 0 || dias > 0) formatoCorto += `${horas}h `;
  if (minutos > 0 || (horas === 0 && dias === 0))
    formatoCorto += `${minutos}m `;
  if (horas === 0 && dias === 0) formatoCorto += `${segundos}s`;
  formatoCorto = formatoCorto.trim();

  return {
    total: diffMs,
    dias,
    horas,
    minutos,
    segundos,
    yaVencido: false,
    formateado,
    formatoCorto,
    porcentajeCompletado: fechaInicio ? porcentajeCompletado : 0,
    enRango: fechaInicio ? enRango : true,
  };
};
