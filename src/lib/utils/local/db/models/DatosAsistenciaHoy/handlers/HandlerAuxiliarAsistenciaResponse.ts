import {
  AuxiliarAsistenciaResponse,
  HorarioTomaAsistencia,
} from "@/interfaces/shared/Asistencia/DatosAsistenciaHoyIE20935";
import { HandlerAsistenciaBase } from "./HandlerDatosAsistenciaBase";

export class HandlerAuxiliarAsistenciaResponse extends HandlerAsistenciaBase {
  private auxiliarData: AuxiliarAsistenciaResponse;

  constructor(asistenciaData: AuxiliarAsistenciaResponse) {
    super(asistenciaData);
    this.auxiliarData = asistenciaData;
  }

  public getMiHorarioTomaAsistencia(): HorarioTomaAsistencia {
    return this.auxiliarData.HorarioTomaAsistenciaAuxiliares;
  }

  public getHorarioEscolarSecundaria(): HorarioTomaAsistencia {
    return this.auxiliarData.HorarioEscolarSecundaria;
  }

  public estaHorarioActivo(horario: HorarioTomaAsistencia): boolean {
    const ahora = this.getFechaHoraRedux();
    if (!ahora) return false;

    const inicio = new Date(horario.Inicio);
    const fin = new Date(horario.Fin);

    return ahora >= inicio && ahora <= fin;
  }

  public estaActivaTomaAsistencia(): boolean {
    return this.estaHorarioActivo(this.getMiHorarioTomaAsistencia());
  }

  public estaActivoHorarioEscolarSecundaria(): boolean {
    return this.estaHorarioActivo(this.getHorarioEscolarSecundaria());
  }

  public getDatosCompletosAuxiliar(): AuxiliarAsistenciaResponse {
    return this.auxiliarData;
  }
}
