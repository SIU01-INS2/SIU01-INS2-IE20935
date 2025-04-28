import { RolesSistema } from "../../../RolesSistema";
import { ActoresSistema } from "../../../ActoresSistema";
import { ModoRegistro } from "../../../ModoRegistroPersonal";
import { NivelEducativo } from "../../../NivelEducativo";
import { SuccessResponseAPIBase } from "../../types";

export interface RegistrarAsistenciaIndividualRequestBody {
  DNI: string;
  Actor: ActoresSistema | RolesSistema;
  ModoRegistro: ModoRegistro;
  FechaHoraEsperadaISO: string;
  NivelDelEstudiante?: NivelEducativo;
  AulaDelEstudiante?: string;
}

export interface RegistrarAsistenciaIndividualSuccessResponse
  extends SuccessResponseAPIBase {
  data: {
    timestamp: number;
    desfaseSegundos: number;
    esNuevoRegistro: boolean;
  };
}
