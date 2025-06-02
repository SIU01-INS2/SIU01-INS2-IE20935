import {
  ProfesorTutorSecundariaAsistenciaResponse,
  HorarioTomaAsistencia,
} from "@/interfaces/shared/Asistencia/DatosAsistenciaHoyIE20935";
import { HandlerAsistenciaBase } from "./HandlerDatosAsistenciaBase";

export class HandlerProfesorTutorSecundariaAsistenciaResponse extends HandlerAsistenciaBase {
  private profesorSecundariaData: ProfesorTutorSecundariaAsistenciaResponse;

  constructor(asistenciaData: ProfesorTutorSecundariaAsistenciaResponse) {
    super(asistenciaData);
    this.profesorSecundariaData = asistenciaData;
  }

  public getMiHorarioTomaAsistencia():
    | { Hora_Entrada_Dia_Actual: Date; Hora_Salida_Dia_Actual: Date }
    | false
    | undefined {
    return this.profesorSecundariaData.HorarioProfesor;
  }

  public getHorarioEscolarSecundaria(): HorarioTomaAsistencia {
    return this.profesorSecundariaData.HorarioEscolarSecundaria;
  }

  public estaHorarioActivo(horario: {
    Hora_Entrada_Dia_Actual: Date;
    Hora_Salida_Dia_Actual: Date;
  }): boolean {
    const ahora = this.getFechaHoraRedux();
    if (!ahora) return false;

    const inicio = new Date(horario.Hora_Entrada_Dia_Actual);
    const fin = new Date(horario.Hora_Salida_Dia_Actual);

    return ahora >= inicio && ahora <= fin;
  }

  public estaActivoMiHorario(): boolean {
    const horario = this.getMiHorarioTomaAsistencia();
    if (
      !horario ||
      typeof horario === "boolean" ||
      typeof horario === "undefined"
    )
      return false;

    return this.estaHorarioActivo(horario);
  }

  public estaActivoHorarioEscolarSecundaria(): boolean {
    const horarioEscolar = this.getHorarioEscolarSecundaria();
    const ahora = this.getFechaHoraRedux();
    if (!ahora) return false;

    if (!horarioEscolar) return false;

    const inicio = new Date(horarioEscolar.Inicio);
    const fin = new Date(horarioEscolar.Fin);

    return ahora >= inicio && ahora <= fin;
  }

  public getDatosCompletosProfesorSecundaria(): ProfesorTutorSecundariaAsistenciaResponse {
    return this.profesorSecundariaData;
  }
}
