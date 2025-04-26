import { SuccessResponseAPIBase } from "../../../types";

export interface CambiarCorreoRequestBody {
  nuevoCorreo: string;
}

export interface CambiarCorreoRequestBody {
  nuevoCorreo: string;
}

export interface ConfirmarCorreoRequestBody {
  codigo: string;
  nuevoCorreo: string;
}

export interface CambiarCorreoSuccessResponse extends SuccessResponseAPIBase {
  otpExpireTime: number; // tiempo en segundos hasta que expire el OTP
}
