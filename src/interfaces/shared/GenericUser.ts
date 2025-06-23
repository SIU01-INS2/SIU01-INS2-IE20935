import {
  T_Auxiliares,
  T_Directivos,
  T_Personal_Administrativo,
  T_Profesores_Primaria,
  T_Profesores_Secundaria,
  T_Responsables,
} from "@prisma/client";
import { Genero } from "./Genero";
import { RolesSistema } from "./RolesSistema";

export type DirectivoGenerico = Pick<
  T_Directivos,
  | "Id_Directivo"
  | "DNI"
  | "Nombres"
  | "Apellidos"
  | "Genero"
  | "Google_Drive_Foto_ID"
>;

export type AuxiliarGenerico = Pick<
  T_Auxiliares,
  "DNI_Auxiliar" | "Nombres" | "Apellidos" | "Genero" | "Google_Drive_Foto_ID"
>;

export type ProfesorPrimariaGenerico = Pick<
  T_Profesores_Primaria,
  | "DNI_Profesor_Primaria"
  | "Nombres"
  | "Apellidos"
  | "Genero"
  | "Google_Drive_Foto_ID"
>;

export type ProfesorSecundariaGenerico = Pick<
  T_Profesores_Secundaria,
  | "DNI_Profesor_Secundaria"
  | "Nombres"
  | "Apellidos"
  | "Genero"
  | "Google_Drive_Foto_ID"
>;

export type ResponsableGenerico = Pick<
  T_Responsables,
  "DNI_Responsable" | "Nombres" | "Apellidos" | "Google_Drive_Foto_ID"
>;

export type TutorGenerico = Pick<
  T_Profesores_Secundaria,
  "DNI_Profesor_Secundaria" | "Nombres" | "Apellidos" | "Genero"
>;

export type PersonalAdministrativoGenerico = Pick<
  T_Personal_Administrativo,
  "DNI_Personal_Administrativo" | "Nombres" | "Apellidos" | "Genero"
>;



export interface GenericUser {
  ID_O_DNI_Usuario: string;
  Rol: RolesSistema;
  Nombres: string;
  Apellidos: string;
  Genero?: Genero;
  DNI_Directivo?: string;
  Google_Drive_Foto_ID: string | null;
}
