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

/**
 * ✅ ACTUALIZADO: Resultado individual de asistencia diaria
 * Ahora usa ID_o_DNI para soportar tanto IDs de directivos como DNIs de otros roles
 */
export interface AsistenciaDiariaResultado {
  ID_o_DNI: string; // ✅ ACTUALIZADO: Era "DNI", ahora soporta ID (directivos) o DNI (otros)
  AsistenciaMarcada: boolean;
  Detalles: {
    // Para estudiantes
    Estado?: EstadosAsistencia;
    // Para personal
    Timestamp?: number;
    DesfaseSegundos?: number;
  };
}

/**
 * ✅ ACTUALIZADO: Respuesta del endpoint de consulta de asistencias diarias
 */
export interface ConsultarAsistenciasTomadasPorActorEnRedisResponseBody {
  Actor: ActoresSistema;
  Dia: number;
  Mes: Meses;
  ModoRegistro: ModoRegistro;
  TipoAsistencia: TipoAsistencia; // ✅ AGREGADO: Para mayor claridad en la respuesta
  Resultados: AsistenciaDiariaResultado[] | AsistenciaDiariaResultado | null; // Array para múltiples, objeto/null para unitario
}

/**
 * ✅ NUEVAS: Interfaces específicas para diferentes tipos de consulta desde el frontend
 */

// Para consulta propia (solo requiere ModoRegistro)
export interface ConsultaAsistenciaPropia {
  ModoRegistro: ModoRegistro;
  // Actor y TipoAsistencia se determinan automáticamente del token
}

// Para consulta de personal específico
export interface ConsultaAsistenciaPersonal extends ConsultaAsistenciaPropia {
  Actor: Exclude<ActoresSistema, ActoresSistema.Estudiante>;
  TipoAsistencia: TipoAsistencia.ParaPersonal;
  ID_o_DNI: string; // ID para directivos, DNI para otros
}

// Para consulta de estudiantes específicos
export interface ConsultaAsistenciaEstudiante extends ConsultaAsistenciaPropia {
  Actor: ActoresSistema.Estudiante;
  TipoAsistencia:
    | TipoAsistencia.ParaEstudiantesPrimaria
    | TipoAsistencia.ParaEstudiantesSecundaria;
  ID_o_DNI?: string; // Opcional para consulta individual
  NivelEducativo?: string; // Requerido para consultas grupales o individuales
  Grado?: string; // Requerido para consultas grupales o individuales
  Seccion?: string; // Requerido para consultas grupales o individuales
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
  ID_o_Dni_Personal: string;
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
  ID_o_DNI: string;
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
