import userStorage from "@/lib/utils/local/db/models/UserStorage";

/**
 * Comprueba si debe realizarse una sincronización basado en un intervalo de tiempo aleatorio
 * @param minSegundos Tiempo mínimo en segundos que debe pasar antes de sincronizar (por defecto 180 - 3 minutos)
 * @param maxSegundos Tiempo máximo en segundos que debe pasar antes de sincronizar (por defecto 360 - 6 minutos)
 * @param forzarSincronizacion Si es true, devuelve true sin importar el tiempo transcurrido
 * @returns Promise que se resuelve con true si se debe sincronizar, false en caso contrario
 */
export const comprobarSincronizacion = async (
  minSegundos: number = 180,
  maxSegundos: number = 360,
  forzarSincronizacion: boolean = false
): Promise<boolean> => {
  try {
    // Si se debe forzar la sincronización, simplemente regresamos true
    if (forzarSincronizacion) {
      // Actualizamos la marca de tiempo antes de retornar
      await userStorage.guardarUltimaSincronizacion(Date.now());
      return true;
    }

    // Obtener última sincronización almacenada
    const ultimaSincronizacion =
      await userStorage.obtenerUltimaSincronizacion();

    // Si no hay registro previo, debemos sincronizar
    if (!ultimaSincronizacion) {
      // Guardamos la hora actual como última sincronización
      await userStorage.guardarUltimaSincronizacion(Date.now());
      return true;
    }

    // Convertir segundos a milisegundos
    const minInterval = minSegundos * 1000;
    const maxInterval = maxSegundos * 1000;

    // Calcular un intervalo aleatorio entre minInterval y maxInterval
    const randomInterval =
      Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;

    // Calcular si ya pasó el tiempo necesario
    const tiempoTranscurrido = Date.now() - ultimaSincronizacion;
    const debeSincronizar = tiempoTranscurrido >= randomInterval;

    // Si debe sincronizar, actualizamos la última hora de sincronización
    if (debeSincronizar) {
      await userStorage.guardarUltimaSincronizacion(Date.now());
    }

    return debeSincronizar;
  } catch (error) {
    console.error("Error al comprobar si se debe sincronizar:", error);
    return false; // En caso de error, no sincronizamos
  }
};

export default comprobarSincronizacion;
