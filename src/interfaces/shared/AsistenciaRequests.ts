import { ModoRegistro } from "./ModoRegistroPersonal";
import { RolesSistema } from "./RolesSistema";
import { Meses } from "./Meses";
import { ActoresSistema } from "./ActoresSistema";
import { EstadosAsistencia } from "./EstadosAsistenciaEstudiantes";

export interface RegistroAsistenciaUnitariaPersonal {
  ModoRegistro: ModoRegistro;
  DNI: string;
  Rol: RolesSistema | ActoresSistema;
  Dia: number;
  Detalles: DetallesAsistenciaUnitariaPersonal | null;
  esNuevoRegistro: boolean;
}

export type RegistroAsistenciaMensualPersonal = Pick<
  RegistroAsistenciaUnitariaPersonal,
  "DNI" | "Rol" | "ModoRegistro"
> & {
  Mes: Meses;
  RegistrosDelMes: Record<number, DetallesAsistenciaUnitariaPersonal | null>;
};

export interface DetallesAsistenciaUnitariaPersonal {
  Timestamp: number;
  DesfaseSegundos: number;
}

export interface DetallesAsistenciaUnitariaEstudiante {
  Estado: EstadosAsistencia;
}

export interface AsistenciaDiariaResultado {
  DNI: string;
  AsistenciaMarcada: boolean;
  Detalles:
    | DetallesAsistenciaUnitariaPersonal
    | DetallesAsistenciaUnitariaEstudiante
    | null;
}

export interface ConsultarAsistenciasDiariasPorActorEnRedisResponseBody {
  Actor: ActoresSistema;
  ModoRegistro: ModoRegistro;
  Resultados: AsistenciaDiariaResultado[];
  Mes: Meses;
  Dia: number;
}

export enum TipoAsistencia {
  ParaPersonal = "personal",
  ParaEstudiantesSecundaria = "secundaria",
  ParaEstudiantesPrimaria = "primaria",
}

export interface EstadoTomaAsistenciaResponseBody {
  TipoAsistencia: TipoAsistencia;
  Dia: number;
  Mes: Meses;
  Anio: number;
  AsistenciaIniciada: boolean;
}

export interface IniciarTomaAsistenciaRequestBody {
  TipoAsistencia: TipoAsistencia;
}
