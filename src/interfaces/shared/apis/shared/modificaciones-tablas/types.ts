// Define interfaces para las respuestas de éxito

import { T_Ultima_Modificacion_Tablas } from "@prisma/client";

export interface GetUltimasModificacionesSuccessResponse {
  success: true;
  message: string;
  data: T_Ultima_Modificacion_Tablas[];
}
