import { SuccessResponseAPIBase } from "../../types";
import { Meses } from "../../../Meses";
import { GenericUser } from "../../../GenericUser";

export interface AsistenciaCompletaMensualDePersonal extends GenericUser {
  Entradas: string;
  Id_Registro_Mensual_Entrada: number;
  Id_Registro_Mensual_Salida: number;
  Salidas: string;
  Mes: Meses;
}

export interface GetAsistenciaMensualDePersonalSuccessResponse
  extends SuccessResponseAPIBase {
  data: AsistenciaCompletaMensualDePersonal;
}
