import {
  ResponsableAsistenciaResponse,
  HorarioTomaAsistencia,
} from "@/interfaces/shared/Asistencia/DatosAsistenciaHoyIE20935";
import { NivelEducativo } from "@/interfaces/shared/NivelEducativo";
import { HandlerAsistenciaBase } from "./HandlerDatosAsistenciaBase";

export class HandlerResponsableAsistenciaResponse extends HandlerAsistenciaBase {
  private responsableData: ResponsableAsistenciaResponse;

  constructor(asistenciaData: ResponsableAsistenciaResponse) {
    super(asistenciaData);
    this.responsableData = asistenciaData;
  }

  public getHorarioEscolar(
    nivel: NivelEducativo
  ): HorarioTomaAsistencia | null {
    return this.responsableData.HorariosEscolares[nivel] || null;
  }

  public estaHorarioActivo(horario: HorarioTomaAsistencia): boolean {
    const ahora = this.getFechaHoraRedux();
    if (!ahora) return false;

    const inicio = new Date(horario.Inicio);
    const fin = new Date(horario.Fin);

    return ahora >= inicio && ahora <= fin;
  }

  public estaActivoHorarioEscolar(nivel: NivelEducativo): boolean {
    const horario = this.getHorarioEscolar(nivel);
    if (!horario) return false;

    return this.estaHorarioActivo(horario);
  }

  public getDatosCompletosResponsable(): ResponsableAsistenciaResponse {
    return this.responsableData;
  }
}
