export interface AuthBlockedDetails {
  tiempoActualUTC: number; // Timestamp Unix en segundos
  timestampDesbloqueoUTC: number; // Timestamp Unix en segundos
  tiempoRestante: string; // Formato "Xh Ym"
  fechaDesbloqueo: string; // Fecha formateada
  esBloqueoPermanente: boolean; // Indica si es un bloqueo permanente
}