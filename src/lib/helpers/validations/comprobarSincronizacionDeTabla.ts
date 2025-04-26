import ultimaActualizacionTablasLocalesIDB from "@/lib/utils/local/db/models/UltimaActualizacionTablasLocalesIDB";

import { ITablaInfo } from "@/interfaces/shared/TablasSistema";
import { SiasisAPIS } from "@/interfaces/shared/SiasisComponents";
import UltimaModificacionTablasIDB from "../../utils/local/db/models/UltimaModificacionTablasIDB";

/**
 * Comprueba si la fecha de actualización local es mayor que la fecha de modificación remota
 * para una tabla específica
 *
 * @param tablaInfo Información de la tabla a comprobar
 * @param siasisAPI API a utilizar para consultas remotas
 * @returns Promise que se resuelve con true si la actualización es más reciente que la modificación, false en caso contrario
 */
export const comprobarSincronizacionDeTabla = async (
  tablaInfo: ITablaInfo,
  siasisAPI: SiasisAPIS
): Promise<boolean> => {
  try {
    // Obtener la última actualización local
    const ultimaActualizacion =
      await ultimaActualizacionTablasLocalesIDB.getByTabla(
        tablaInfo.nombreLocal!
      );

    // Obtener la última modificación remota
    const ultimaModificacion = await new UltimaModificacionTablasIDB(
      siasisAPI
    ).getByTabla(tablaInfo.nombreRemoto!);

    // Si no hay actualización local, talvez aun no se ha hecho una peticion como tal a la BD
    if (!ultimaActualizacion) {
      return true;
    }

    // Si no hay modificación remota, consideramos que la actualización es más reciente
    if (!ultimaModificacion) {
      return true;
    }

    // Convertir la fecha de actualización local a timestamp
    // (Ya está en zona horaria local)
    const fechaActualizacionLocal =
      typeof ultimaActualizacion.Fecha_Actualizacion === "number"
        ? ultimaActualizacion.Fecha_Actualizacion
        : new Date(ultimaActualizacion.Fecha_Actualizacion).getTime();

    // Convertir la fecha de modificación remota (ISO string en UTC) a timestamp local
    // Primero creamos un objeto Date que automáticamente convertirá la fecha UTC a local
    const fechaModificacionUTC = new Date(
      ultimaModificacion.Fecha_Modificacion
    );

    // Luego obtenemos el timestamp local que ya tiene en cuenta la diferencia horaria
    const fechaModificacionRemota = fechaModificacionUTC.getTime();

    // Mostrar información para depuración
    console.log(
      "Fecha actualización local:",
      new Date(fechaActualizacionLocal).toLocaleString()
    );
    console.log(
      "Fecha modificación remota (convertida a local):",
      new Date(fechaModificacionRemota).toLocaleString()
    );

    // Si la fecha de actualizacion remota es mayor que la local, significa que la tabla remota ha sido modificada más recientemente
    // y por lo tanto la tabla local necesita ser actualizada
    return fechaActualizacionLocal < fechaModificacionRemota;
  } catch (error) {
    console.error(
      "Error al comparar fechas de actualización y modificación:",
      error
    );
    return false; // En caso de error, asumimos que la actualización no es más reciente
  }
};

export default comprobarSincronizacionDeTabla;
