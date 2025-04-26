// =========================================
// RUTA: /api/mis-datos
// =========================================

import {
  T_Aulas,
  T_Auxiliares,
  T_Directivos,
  T_Personal_Administrativo,
  T_Profesores_Primaria,
  T_Profesores_Secundaria,
  // T_Responsables,
} from "@prisma/client";
import { ErrorResponseAPIBase, SuccessResponseAPIBase } from "../../types";
import { Genero } from "../../../Genero";
import {
  AuxiliarSinContraseña,
  DirectivoSinContraseña,
  PersonalAdministrativoSinContraseña,
  ProfesorPrimariaSinContraseña,
  ProfesorSecundariaSinContraseña,
} from "../../shared/others/types";

// -----------------------------------------
//                METODO GET
// -----------------------------------------

/**
 * Datos de Directivo
 */
export type MisDatosDirectivo = DirectivoSinContraseña & {
  Genero: Genero;
};

/**
 * Datos de Profesor Primaria con aula opcional
 */
export type MisDatosProfesorPrimaria = ProfesorPrimariaSinContraseña & {
  Genero: Genero;
  Aula: Omit<
    T_Aulas,
    "DNI_Profesor_Primaria" | "DNI_Profesor_Secundaria"
  > | null;
};

/**
 * Datos de Auxiliar
 */
export type MisDatosAuxiliar = AuxiliarSinContraseña & {
  Genero: Genero;
};

/**
 * Datos de Profesor Secundaria
 */
export type MisDatosProfesorSecundaria = ProfesorSecundariaSinContraseña & {
  Genero: Genero;
};

/**
 * Datos de Tutor (Profesor secundaria con aula)
 */
export type MisDatosTutor = ProfesorSecundariaSinContraseña & {
  Genero: Genero;
  Aula: Omit<T_Aulas, "DNI_Profesor_Primaria" | "DNI_Profesor_Secundaria">;
};

/**
 * Datos de Personal Administrativo
 */
export type MisDatosPersonalAdministrativo =
  PersonalAdministrativoSinContraseña & { Genero: Genero };

export type ObtenerMisDatosSuccessAPI01Data =
  | MisDatosDirectivo
  | MisDatosProfesorPrimaria
  | MisDatosAuxiliar
  | MisDatosProfesorSecundaria
  | MisDatosTutor
  | MisDatosPersonalAdministrativo;

export interface MisDatosSuccessResponseAPI01 extends SuccessResponseAPIBase {
  data: ObtenerMisDatosSuccessAPI01Data;
}

export type MisDatosErrorResponseAPI01 = ErrorResponseAPIBase;

// -----------------------------------------
//                METODO PUT
// -----------------------------------------

export type ActualizarMisDatosDirectivoRequestBody = Partial<
  Pick<T_Directivos, "DNI" | "Nombres" | "Apellidos" | "Genero" | "Celular">
> & { Genero: Genero };

export type ActualizarMisDatosProfesorPrimariaRequestBody = Partial<
  Pick<T_Profesores_Primaria, "Correo_Electronico" | "Celular">
>;

export type ActualizarMisDatosAuxiliarRequestBody = Partial<
  Pick<T_Auxiliares, "Correo_Electronico" | "Celular">
>;

export type ActualizarMisDatosProfesorSecundariaRequestBody = Partial<
  Pick<T_Profesores_Secundaria, "Correo_Electronico" | "Celular">
>;

export type ActualizarMisDatosTutorRequestBody = Partial<
  Pick<T_Profesores_Secundaria, "Celular">
>;

export type ActualizarMisDatosPersonalAdministrativoRequestBody = Partial<
  Pick<T_Personal_Administrativo, "Celular">
>;

export type ActualizarMisDatoUsuarioRequestBodyAPI01 =
  | ActualizarMisDatosDirectivoRequestBody
  | ActualizarMisDatosProfesorPrimariaRequestBody
  | ActualizarMisDatosAuxiliarRequestBody
  | ActualizarMisDatosProfesorSecundariaRequestBody
  | ActualizarMisDatosTutorRequestBody
  | ActualizarMisDatosPersonalAdministrativoRequestBody;

// Interfaz para la respuesta exitosa
export interface ActualizarUsuarioSuccessResponseAPI01
  extends SuccessResponseAPIBase {
  success: true;
  message: string;
  data: ActualizarMisDatoUsuarioRequestBodyAPI01; // Los datos que se actualizaron
}
