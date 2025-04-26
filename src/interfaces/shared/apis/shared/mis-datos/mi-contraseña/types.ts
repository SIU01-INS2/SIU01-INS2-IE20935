import { SuccessResponseAPIBase } from "../../../types";

// Importar o definir interfaces para la respuesta
export interface CambiarContraseñaRequestBody {
  contraseñaActual: string;
  nuevaContraseña: string;
}

export interface CambiarContraseñaSuccessResponse
  extends SuccessResponseAPIBase {
  success: true;
  message: string;
}
