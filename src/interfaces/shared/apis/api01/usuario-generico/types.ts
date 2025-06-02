import { GenericUser } from "../../../GenericUser";
import { SuccessResponseAPIBase } from "../../types";

export interface GetGenericUserSuccessResponse extends SuccessResponseAPIBase {
  data: GenericUser;
}
