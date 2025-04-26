import { SuccessResponseAPIBase } from "../../types";
import { PersonalAdministrativoSinContraseña } from "../../shared/others/types";

export type PersonalAdministrativoDataNecesariaParaCambioEstado = Pick<
  PersonalAdministrativoSinContraseña,
  "DNI_Personal_Administrativo" | "Nombres" | "Apellidos" | "Estado"
>;

export interface GetPersonalAdministrativoSuccessResponse
  extends SuccessResponseAPIBase {
  data: PersonalAdministrativoSinContraseña[];
}

export interface GetPersonalAdministrativoUnicoSuccessResponse
  extends SuccessResponseAPIBase {
  data: PersonalAdministrativoSinContraseña;
}

export interface SwitchEstadoPersonalAdministrativoSuccessResponse
  extends SuccessResponseAPIBase {
  data: PersonalAdministrativoDataNecesariaParaCambioEstado;
}
