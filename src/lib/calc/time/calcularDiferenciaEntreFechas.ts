/**
 * Calcula la diferencia entre dos fechas
 * @param fechaInicio Fecha de inicio
 * @param fechaFin Fecha de fin
 * @returns Objeto con la diferencia en días, horas, minutos y segundos
 */
export const calcularDiferenciaEntreFechas = (
  fechaInicio: Date | string,
  fechaFin: Date | string
): {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  totalMs: number;
  totalSegundos: number;
  totalMinutos: number;
  totalHoras: number;
  totalDias: number;
} => {
  const inicio =
    typeof fechaInicio === "string" ? new Date(fechaInicio) : fechaInicio;
  const fin = typeof fechaFin === "string" ? new Date(fechaFin) : fechaFin;

  const diffMs = fin.getTime() - inicio.getTime();
  const totalSegundos = Math.floor(diffMs / 1000);
  const totalMinutos = Math.floor(totalSegundos / 60);
  const totalHoras = Math.floor(totalMinutos / 60);
  const totalDias = Math.floor(totalHoras / 24);

  const segundos = Math.floor((diffMs / 1000) % 60);
  const minutos = Math.floor((diffMs / (1000 * 60)) % 60);
  const horas = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return {
    dias,
    horas,
    minutos,
    segundos,
    totalMs: diffMs,
    totalSegundos,
    totalMinutos,
    totalHoras,
    totalDias,
  };
};
