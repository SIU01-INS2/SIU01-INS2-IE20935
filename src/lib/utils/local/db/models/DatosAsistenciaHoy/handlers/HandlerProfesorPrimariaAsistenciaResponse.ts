import {
  ProfesorPrimariaAsistenciaResponse,
  HorarioTomaAsistencia,
} from "@/interfaces/shared/Asistencia/DatosAsistenciaHoyIE20935";
import { HandlerAsistenciaBase } from "./HandlerDatosAsistenciaBase";

export class HandlerProfesorPrimariaAsistenciaResponse extends HandlerAsistenciaBase {
  private profesorPrimariaData: ProfesorPrimariaAsistenciaResponse;

  constructor(asistenciaData: ProfesorPrimariaAsistenciaResponse) {
    super(asistenciaData);
    this.profesorPrimariaData = asistenciaData;
  }

  public getMiHorarioTomaAsistencia(): HorarioTomaAsistencia {
    return this.profesorPrimariaData.HorarioTomaAsistenciaProfesorPrimaria;
  }

  public getHorarioEscolarPrimaria(): HorarioTomaAsistencia {
    return this.profesorPrimariaData.HorarioEscolarPrimaria;
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

  public estaActivoHorarioEscolarPrimaria(): boolean {
    return this.estaHorarioActivo(this.getHorarioEscolarPrimaria());
  }

  public getDatosCompletosProfesorPrimaria(): ProfesorPrimariaAsistenciaResponse {
    return this.profesorPrimariaData;
  }
}
