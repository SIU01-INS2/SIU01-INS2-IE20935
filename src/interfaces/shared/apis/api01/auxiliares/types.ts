import { SuccessResponseAPIBase } from "../../types";
import { AuxiliarSinContraseña } from "../../shared/others/types";

export type AuxiliarDataNecesariaParaCambioEstado = Pick<
  AuxiliarSinContraseña,
  "DNI_Auxiliar" | "Nombres" | "Apellidos" | "Estado"
>;

// Interfaces para los endpoints
export interface GetAuxiliaresSuccessResponse extends SuccessResponseAPIBase {
  data: AuxiliarSinContraseña[];
}

export interface GetAuxiliarSuccessResponse extends SuccessResponseAPIBase {
  data: AuxiliarSinContraseña;
}

export interface UpdateAuxiliarRequestBody {
  Nombres?: string;
  Apellidos?: string;
  Genero?: string;
  Celular?: string;
  Correo_Electronico?: string | null;
}

export interface UpdateAuxiliarSuccessResponse extends SuccessResponseAPIBase {
  data: {
    DNI_Auxiliar: string;
    Nombres: string;
    Apellidos: string;
    Genero: string;
    Estado: boolean;
    Celular: string;
    Correo_Electronico: string | null;
  };
}

export interface SwitchEstadoAuxiliarSuccessResponse
  extends SuccessResponseAPIBase {
  data: AuxiliarDataNecesariaParaCambioEstado;
}
