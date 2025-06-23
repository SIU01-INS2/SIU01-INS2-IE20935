import { GenericUser } from "../../../GenericUser";
import { SuccessResponseAPIBase } from "../../types";

export interface GetGenericUsersSuccessResponse extends SuccessResponseAPIBase {
  data: GenericUser[];
  total: number;
}
