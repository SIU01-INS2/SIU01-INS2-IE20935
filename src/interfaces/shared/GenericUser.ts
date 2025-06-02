import { Genero } from "./Genero";
import { RolesSistema } from "./RolesSistema";

export interface DirectivoGenerico {
  DNI: string;
  Nombres: string;
  Apellidos: string;
  Genero: string;
}

export interface AuxiliarGenerico {
  DNI_Auxiliar: string;
  Nombres: string;
  Apellidos: string;
  Genero: string;
}

export interface ProfesorPrimariaGenerico {
  DNI_Profesor_Primaria: string;
  Nombres: string;
  Apellidos: string;
  Genero: string;
}

export interface ProfesorSecundariaGenerico {
  DNI_Profesor_Secundaria: string;
  Nombres: string;
  Apellidos: string;
  Genero: string;
}

export interface GenericUser {
  DNI_Usuario: string;
  Rol: RolesSistema;
  Nombres: string;
  Apellidos: string;
  Genero?: Genero;
}
