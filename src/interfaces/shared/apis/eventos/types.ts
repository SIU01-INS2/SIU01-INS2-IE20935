import { T_Eventos } from "@prisma/client";
import { SuccessResponseAPIBase } from "../types";

export interface GetEventosSuccessResponse extends SuccessResponseAPIBase {
  data: T_Eventos[];
}
