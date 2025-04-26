// =========================================
// RUTA: /api/login
// =========================================

import { Genero } from "../../../Genero";
import { RolesSistema } from "../../../RolesSistema";
import { ApiResponseBase } from "../../types";

/**
 * Body para la petición de login
 */
export interface LoginBody {
  Nombre_Usuario: string;
  Contraseña: string;
}

/**
 * Datos retornados en login exitoso
 */
export interface SuccessLoginData {
  Nombres: string;
  Apellidos: string;
  Genero?: Genero;
  Rol: RolesSistema;
  token: string;
  Google_Drive_Foto_ID: string | null;
}

export type ResponseSuccessLogin = ApiResponseBase & {
  data: SuccessLoginData;
};
