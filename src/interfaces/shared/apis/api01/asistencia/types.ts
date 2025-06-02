import { RolesSistema } from "../../../RolesSistema";
import { ActoresSistema } from "../../../ActoresSistema";
import { ModoRegistro } from "../../../ModoRegistroPersonal";
import { NivelEducativo } from "../../../NivelEducativo";
import { SuccessResponseAPIBase } from "../../types";
import { TipoAsistencia } from "@/interfaces/shared/AsistenciaRequests";

export interface RegistrarAsistenciaIndividualRequestBody {
  DNI: string;
  TipoAsistencia: TipoAsistencia;
  Actor: ActoresSistema | RolesSistema;
  ModoRegistro: ModoRegistro;
  FechaHoraEsperadaISO: string;
  NivelDelEstudiante?: NivelEducativo;
  Grado?: number;
  Seccion?: string;
}

export interface RegistrarAsistenciaIndividualSuccessResponse
  extends SuccessResponseAPIBase {
  data: {
    timestamp: number;
    desfaseSegundos: number;
    esNuevoRegistro: boolean;
  };
}
