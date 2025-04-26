// Función para obtener la fecha actual en Perú en formato YYYY-MM-DD
export function obtenerFechaActualPeru(): string {
  // Perú está en UTC-5
  const fechaPerú = new Date();
  fechaPerú.setHours(fechaPerú.getHours() - 5); // Ajustar a hora de Perú (UTC-5)
  return fechaPerú.toISOString().split("T")[0];
}
