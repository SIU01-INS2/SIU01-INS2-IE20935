import { ModoRegistro } from "./ModoRegistroPersonal";
import { RolesSistema } from "./RolesSistema";
import { Meses } from "./Meses";
import { ActoresSistema } from "./ActoresSistema";
import { EstadosAsistenciaPersonal } from "./EstadosAsistenciaPersonal";
import { EstadosAsistencia } from "./EstadosAsistenciaEstudiantes";

export interface RegistroAsistenciaUnitariaPersonal {
  ModoRegistro: ModoRegistro;
  DNI: string;
  Rol: RolesSistema | ActoresSistema;
  Dia: number;
  Detalles:
    | DetallesAsistenciaUnitariaPersonal
    | DetallesAsistenciaUnitariaEstudiantes
    | null;
  esNuevoRegistro: boolean;
}

export interface DetallesAsistenciaUnitariaEstudiantes {
  Estado: EstadosAsistencia;
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

export interface AsistenciaDiariaResultado {
  DNI: string;
  AsistenciaMarcada: boolean;
  Detalles:
    | DetallesAsistenciaUnitariaPersonal
    | DetallesAsistenciaUnitariaEstudiantes
    | null;
}

export interface ConsultarAsistenciasTomadasPorActorEnRedisResponseBody {
  Actor: ActoresSistema;
  ModoRegistro: ModoRegistro;
  Resultados: AsistenciaDiariaResultado | AsistenciaDiariaResultado[];
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

// Interfaces para asistencia mensual
export interface AsistenciaMensualPersonal {
  Id_Registro_Mensual: number;
  mes: Meses;
  Dni_Personal: string;
  registros: Record<string, RegistroEntradaSalida>;
}

// Interfaces para los registros de entrada/salida
export interface RegistroEntradaSalida {
  timestamp: number;
  desfaseSegundos: number;
  estado: EstadosAsistenciaPersonal;
}

export interface RegistroEntradaSalidaPersonal {
  timestamp: number;
  desfaseSegundos: number;
  estado: EstadosAsistenciaPersonal;
}

// Interface para el request body
export interface EliminarAsistenciaRequestBody {
  DNI: string;
  Actor: ActoresSistema;
  ModoRegistro: ModoRegistro;
  TipoAsistencia: TipoAsistencia;
  // Para estudiantes (opcionales si no se especifican, se busca por patrón)
  NivelEducativo?: string;
  Grado?: number;
  Seccion?: string;
  // Fecha específica (opcional, por defecto usa fecha actual)
  Fecha?: string; // Formato YYYY-MM-DD
}

// Interface para la respuesta exitosa
export interface EliminarAsistenciaSuccessResponse {
  success: true;
  message: string;
  data: {
    asistenciaEliminada: boolean;
    claveEliminada: string | null;
    fecha: string;
  };
}
