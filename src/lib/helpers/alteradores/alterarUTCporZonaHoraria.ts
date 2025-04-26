/**
 * Devuelve un string ISO como si la fecha estuviera en la zona horaria dada.
 *
 * @param date - Fecha en formato Date o ISO string.
 * @param timeZone - Zona horaria (ej: "America/Lima", "Europe/Madrid").
 * @returns ISO string representando la fecha en esa zona horaria.
 */
export default function alterarUTCporZonaHoraria(
  date: Date | string,
  timeZone: string
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  };

  const formatter = new Intl.DateTimeFormat("en-CA", options);
  const parts = formatter.formatToParts(d);

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value.padStart(2, "0");

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  const minute = get("minute");
  const second = get("second");

  // Construye un string ISO "falso", como si esa hora fuera en UTC
  return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
}
