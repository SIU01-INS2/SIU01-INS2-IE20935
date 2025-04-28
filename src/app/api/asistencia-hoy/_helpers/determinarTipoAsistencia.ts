import { ActoresSistema } from "@/interfaces/shared/ActoresSistema";
import { TipoAsistencia } from "@/interfaces/shared/AsistenciaRequests";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";

// Función para determinar el tipo de asistencia según el actor
export const determinarTipoAsistencia = (
  actor: ActoresSistema | RolesSistema
): TipoAsistencia => {
  if (actor === ActoresSistema.Estudiante) {
    // No podemos determinar esto correctamente sin el nivel educativo
    // Por defecto, usamos secundaria y si no hay resultados, consultamos primaria
    return TipoAsistencia.ParaEstudiantesSecundaria;
  } else {
    // Todos los demás actores (profesores, auxiliares, etc.) usan el Redis para personal
    return TipoAsistencia.ParaPersonal;
  }
};
