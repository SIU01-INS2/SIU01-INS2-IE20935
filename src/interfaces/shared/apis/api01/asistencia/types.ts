import { RolesSistema } from "../../../RolesSistema";
import { ActoresSistema } from "../../../ActoresSistema";
import { ModoRegistro } from "../../../ModoRegistroPersonal";
import { NivelEducativo } from "../../../NivelEducativo";
import { SuccessResponseAPIBase } from "../../types";
import { TipoAsistencia } from "@/interfaces/shared/AsistenciaRequests";

export interface RegistrarAsistenciaIndividualSuccessResponse
  extends SuccessResponseAPIBase {
  data: {
    timestamp: number;
    desfaseSegundos: number;
    esNuevoRegistro: boolean;
    esRegistroPropio: boolean;
    actorRegistrado: ActoresSistema;
    tipoAsistencia: TipoAsistencia;
  };
}

// ✅ Interface principal (flexible para todos los casos)
export interface RegistrarAsistenciaIndividualRequestBody {
  ID_o_DNI?: string; // ✅ Opcional para registro propio
  TipoAsistencia?: TipoAsistencia;
  Actor?: ActoresSistema | RolesSistema;
  ModoRegistro: ModoRegistro;
  FechaHoraEsperadaISO: string;
  NivelDelEstudiante?: NivelEducativo;
  Grado?: number;
  Seccion?: string;
}

// ✅ Interfaces específicas para TypeScript
export interface RegistroPropio {
  ModoRegistro: ModoRegistro;
  FechaHoraEsperadaISO: string;
}

export interface RegistroPersonal extends RegistroPropio {
  ID_o_DNI: string;
  TipoAsistencia: TipoAsistencia.ParaPersonal;
  Actor: Exclude<ActoresSistema, ActoresSistema.Estudiante>;
}

export interface RegistroEstudiante extends RegistroPropio {
  ID_o_DNI: string;
  TipoAsistencia:
    | TipoAsistencia.ParaEstudiantesPrimaria
    | TipoAsistencia.ParaEstudiantesSecundaria;
  Actor: ActoresSistema.Estudiante;
  NivelDelEstudiante: NivelEducativo;
  Grado: number;
  Seccion: string;
}
