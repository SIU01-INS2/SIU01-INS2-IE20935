import { PersonalAdministrativoAsistenciaResponse } from "@/interfaces/shared/Asistencia/DatosAsistenciaHoyIE20935";
import { HandlerAsistenciaBase } from "./HandlerDatosAsistenciaBase";

export class HandlerPersonalAdministrativoAsistenciaResponse extends HandlerAsistenciaBase {
  private personalAdministrativoData: PersonalAdministrativoAsistenciaResponse;

  constructor(asistenciaData: PersonalAdministrativoAsistenciaResponse) {
    super(asistenciaData);
    this.personalAdministrativoData = asistenciaData;
  }

  public getHorarioPersonal():
    | { Horario_Laboral_Entrada: Date; Horario_Laboral_Salida: Date }
    | false {
    return this.personalAdministrativoData.HorarioPersonal;
  }

  public estaHorarioActivo(horario: {
    Horario_Laboral_Entrada: Date;
    Horario_Laboral_Salida: Date;
  }): boolean {
    const ahora = this.getFechaHoraRedux();
    if (
      !ahora ||
      !horario ||
      !horario.Horario_Laboral_Entrada ||
      !horario.Horario_Laboral_Salida
    )
      return false;

    const inicio = new Date(horario.Horario_Laboral_Entrada);
    const fin = new Date(horario.Horario_Laboral_Salida);

    return ahora >= inicio && ahora <= fin;
  }

  public estaActivoHorarioPersonal(): boolean {
    const horario = this.getHorarioPersonal();
    if (!horario || typeof horario === "boolean") return false;

    return this.estaHorarioActivo(horario);
  }

  public getDatosCompletosPersonalAdministrativo(): PersonalAdministrativoAsistenciaResponse {
    return this.personalAdministrativoData;
  }
}
