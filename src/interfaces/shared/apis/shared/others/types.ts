import {
  T_Auxiliares,
  T_Directivos,
  T_Personal_Administrativo,
  T_Profesores_Primaria,
  T_Profesores_Secundaria,
  T_Responsables,
} from "@prisma/client";

// USUARIOS SIN CONTRASEÑA ==============================================================

export type DirectivoSinContraseña = Omit<T_Directivos, "Contraseña">;

export type ProfesorPrimariaSinContraseña = Omit<
  T_Profesores_Primaria,
  "Contraseña"
>;

export type AuxiliarSinContraseña = Omit<T_Auxiliares, "Contraseña">;

export type ProfesorSecundariaSinContraseña = Omit<
  T_Profesores_Secundaria,
  "Contraseña"
>;

export type ResponsableSinContraseña = Omit<T_Responsables, "Contraseña">;

export type PersonalAdministrativoSinContraseña = Omit<
  T_Personal_Administrativo,
  "Contraseña"
> ;

// =========================================================================================


// Cambios Adicionales en alguno tipos de algunos atributos

