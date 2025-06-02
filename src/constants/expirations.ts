import { RolesSistema } from "@/interfaces/shared/RolesSistema";

export const DIRECTIVO_SESSION_EXPIRATION_seg = 60 * 60 * 5; // 5 horas
export const PROFESOR_PRIMARIA_SESSION_EXPIRATION_seg = 60 * 60 * 5; // 5 horas
export const AUXILIAR_SESSION_EXPIRATION_seg = 60 * 60 * 5; // 5 horas
export const PROFESOR_SECUNDARIA_SESSION_EXPIRATION_seg = 60 * 60 * 5; // 5 horas
export const TUTOR_SESSION_EXPIRATION_seg = 60 * 60 * 5; // 5 horas
export const RESPONSABLE_SESSION_EXPIRATION_seg = 60 * 60 * 5; // 5 horas
export const PERSONAL_ADMINISTRATIVO_SESSION_EXPIRATION_seg = 60 * 60 * 5; // 5 horas

export const HORA_MAXIMA_EXPIRACION_PARA_REGISTROS_EN_REDIS = 23; // 11 PM


export function getExpirationSessionForRolInSeg(rol: RolesSistema) {
  switch (rol) {
    case RolesSistema.Directivo:
      return DIRECTIVO_SESSION_EXPIRATION_seg;
    case RolesSistema.ProfesorPrimaria:
      return PROFESOR_PRIMARIA_SESSION_EXPIRATION_seg;
    case RolesSistema.Auxiliar:
      return AUXILIAR_SESSION_EXPIRATION_seg;
    case RolesSistema.ProfesorSecundaria:
      return PROFESOR_SECUNDARIA_SESSION_EXPIRATION_seg;
    case RolesSistema.Tutor:
      return TUTOR_SESSION_EXPIRATION_seg;
    case RolesSistema.Responsable:
      return RESPONSABLE_SESSION_EXPIRATION_seg;
    case RolesSistema.PersonalAdministrativo:
      return PERSONAL_ADMINISTRATIVO_SESSION_EXPIRATION_seg;
  }
}
