import store from "@/global/store";
import {
  BaseAsistenciaResponse,
  RangoFechas,
} from "@/interfaces/shared/Asistencia/DatosAsistenciaHoyIE20935";
import { alterarUTCaZonaPeruana } from "@/lib/helpers/alteradores/alterarUTCaZonaPeruana";
import { T_Comunicados, T_Eventos } from "@prisma/client";

export class HandlerAsistenciaBase {
  protected data: BaseAsistenciaResponse;

  constructor(asistenciaData: BaseAsistenciaResponse) {
    this.data = asistenciaData;
  }

  public esHoyDiaDeEvento(): false | T_Eventos {
    return this.data.DiaEvento;
  }

  public esSemanaDeGestion(): false | RangoFechas {
    return this.data.Semana_De_Gestion;
  }

  public estaFueraDeAnioEscolar(): false | RangoFechas {
    return this.data.FueraAñoEscolar;
  }

  public getFechaUTC(): Date {
    return new Date(alterarUTCaZonaPeruana(String(this.data.FechaUTC)));
  }

  public getFechaLocalPeru(): Date {
    return new Date(alterarUTCaZonaPeruana(String(this.data.FechaLocalPeru)));
  }

  public getComunicados(): T_Comunicados[] {
    return this.data.ComunicadosParaMostrarHoy || [];
  }

  public hayComunicados(): boolean {
    return this.getComunicados().length > 0;
  }

  public getFechaHoraRedux(): Date | null {
    const fechaHoraRedux =
      store.getState().others.fechaHoraActualReal.fechaHora;
    if (fechaHoraRedux) {
      return new Date(fechaHoraRedux);
    }
    return null;
  }

  public getDatosCompletos(): BaseAsistenciaResponse {
    return this.data;
  }
}
