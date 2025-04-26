/**
 * Convierte una fecha ISO en formato UTC (con Z) a la misma representación
 * numérica pero tratada como hora peruana.
 *
 * Ejemplo:
 * "2025-04-07T03:16:00.000Z" (3:16 AM UTC) →
 * "2025-04-07T03:16:00.000-05:00" (3:16 AM hora peruana, que sería 8:16 AM UTC)
 *
 * @param fechaUTC Fecha en formato ISO con Z al final
 * @returns La misma fecha pero con indicador -05:00 en lugar de Z
 */
export function alterarUTCaZonaPeruana(fechaUTC: string): string {
  // Verificar si la fecha tiene 'Z' al final
  if (!fechaUTC.endsWith("Z")) {
    // Si no tiene 'Z', asumimos que ya está en formato local
    return fechaUTC;
  }

  // Quitar la 'Z' y agregar el offset de Perú (-05:00)
  return fechaUTC.replace("Z", "-05:00");
}

/**
 * Función alternativa que crea una nueva fecha usando los mismos valores numéricos
 * pero interpretados como hora peruana
 *
 * @param fechaUTC Fecha en formato ISO con Z al final
 * @returns Un nuevo objeto Date con la hora peruana
 */
export function crearFechaHoraPeruanaDeUTC(fechaUTC: string): Date {
  // Verificar si la fecha tiene 'Z' al final
  if (!fechaUTC.endsWith("Z")) {
    // Si no tiene 'Z', simplemente parsear la fecha
    return new Date(fechaUTC);
  }

  // Extraer componentes de la fecha UTC
  const fechaObj = new Date(fechaUTC);
  const year = fechaObj.getUTCFullYear();
  const month = fechaObj.getUTCMonth();
  const day = fechaObj.getUTCDate();
  const hours = fechaObj.getUTCHours();
  const minutes = fechaObj.getUTCMinutes();
  const seconds = fechaObj.getUTCSeconds();
  const milliseconds = fechaObj.getUTCMilliseconds();

  // Crear una nueva fecha usando esos mismos valores pero como locales
  // (interpretados como hora peruana)
  return new Date(year, month, day, hours, minutes, seconds, milliseconds);
}

/**
 * Ejemplo de uso:
 *
 * // Usando la primera función (retorna string)
 * const fechaPeruanaStr = convertirAHoraPeruana("2025-04-07T03:16:00.000Z");
 * console.log(fechaPeruanaStr); // "2025-04-07T03:16:00.000-05:00"
 *
 * // Usando la segunda función (retorna Date)
 * const fechaPeruanaObj = crearFechaHoraPeruana("2025-04-07T03:16:00.000Z");
 * console.log(fechaPeruanaObj.toISOString()); // Nueva fecha en ISO
 */
