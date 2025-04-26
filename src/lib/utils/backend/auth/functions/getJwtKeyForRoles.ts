import { RolesSistema } from "@/interfaces/shared/RolesSistema";

export function getJwtKeyForRole(rol: RolesSistema): string | undefined {
  const keys = {
    [RolesSistema.Directivo]: process.env.JWT_KEY_DIRECTIVOS,
    [RolesSistema.ProfesorPrimaria]: process.env.JWT_KEY_PROFESORES_PRIMARIA,
    [RolesSistema.Auxiliar]: process.env.JWT_KEY_AUXILIARES,
    [RolesSistema.ProfesorSecundaria]:
      process.env.JWT_KEY_PROFESORES_SECUNDARIA,
    [RolesSistema.Tutor]: process.env.JWT_KEY_TUTORES,
    [RolesSistema.Responsable]: process.env.JWT_KEY_RESPONSABLES,
    [RolesSistema.PersonalAdministrativo]:
      process.env.JWT_KEY_PERSONAL_ADMINISTRATIVO,
  };

  return keys[rol];
}
