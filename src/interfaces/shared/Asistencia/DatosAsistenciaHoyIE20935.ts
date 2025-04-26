import { NivelEducativo } from "../NivelEducativo";

import {
  T_Auxiliares,
  T_Comunicados,
  T_Eventos,
  T_Personal_Administrativo,
  T_Profesores_Primaria,
  T_Profesores_Secundaria,
} from "@prisma/client";

export interface HorarioTomaAsistencia {
  Inicio: Date;
  Fin: Date;
}

export interface HorarioLaboral {
  Entrada: Date;
  Salida: Date;
}

export type PersonalAdministrativoParaTomaDeAsistencia = Pick<
  T_Personal_Administrativo,
  | "DNI_Personal_Administrativo"
  | "Genero"
  | "Nombres"
  | "Apellidos"
  | "Cargo"
  | "Google_Drive_Foto_ID"
  | "Horario_Laboral_Entrada"
  | "Horario_Laboral_Salida"
>;

export type ProfesoresPrimariaParaTomaDeAsistencia = Pick<
  T_Profesores_Primaria,
  | "DNI_Profesor_Primaria"
  | "Genero"
  | "Nombres"
  | "Apellidos"
  | "Google_Drive_Foto_ID"
>;

export type ProfesorTutorSecundariaParaTomaDeAsistencia = Pick<
  T_Profesores_Secundaria,
  | "DNI_Profesor_Secundaria"
  | "Nombres"
  | "Apellidos"
  | "Genero"
  | "Google_Drive_Foto_ID"
> & {
  Hora_Entrada_Dia_Actual: Date;
  Hora_Salida_Dia_Actual: Date;
};

export type AuxiliaresParaTomaDeAsistencia = Pick<
  T_Auxiliares,
  "DNI_Auxiliar" | "Nombres" | "Apellidos" | "Genero" | "Google_Drive_Foto_ID"
>;

export interface RangoFechas {
  Inicio: Date;
  Fin: Date;
}

export interface DatosAsistenciaHoyIE20935 {
  DiaEvento: false | T_Eventos;
  FechaUTC: Date;
  FechaLocalPeru: Date;

  FueraAñoEscolar: false | RangoFechas;
  DentroVacionesMedioAño: false | RangoFechas;

  ComunicadosParaMostrarHoy: T_Comunicados[];

  ListaDePersonalesAdministrativos: PersonalAdministrativoParaTomaDeAsistencia[];

  ListaDeProfesoresPrimaria: ProfesoresPrimariaParaTomaDeAsistencia[];

  ListaDeProfesoresSecundaria: ProfesorTutorSecundariaParaTomaDeAsistencia[];

  ListaDeAuxiliares: AuxiliaresParaTomaDeAsistencia[];

  HorariosLaboraresGenerales: {
    TomaAsistenciaRangoTotalPersonales: HorarioTomaAsistencia;
    TomaAsistenciaProfesorPrimaria: HorarioTomaAsistencia;
    TomaAsistenciaAuxiliares: HorarioTomaAsistencia;
  };

  HorariosEscolares: Record<NivelEducativo, HorarioTomaAsistencia>;
}

// DATOS DE ASISTENCIA POR ROLES

// Base interface with common properties for all roles
export type BaseAsistenciaResponse = Pick<
  DatosAsistenciaHoyIE20935,
  | "DiaEvento"
  | "FechaUTC"
  | "FechaLocalPeru"
  | "FueraAñoEscolar"
  | "DentroVacionesMedioAño"
  | "ComunicadosParaMostrarHoy"
>;

// Directivo gets full access
export interface DirectivoAsistenciaResponse extends BaseAsistenciaResponse {
  ListaDePersonalesAdministrativos: PersonalAdministrativoParaTomaDeAsistencia[];
  ListaDeProfesoresPrimaria: ProfesoresPrimariaParaTomaDeAsistencia[];
  ListaDeProfesoresSecundaria: ProfesorTutorSecundariaParaTomaDeAsistencia[];
  ListaDeAuxiliares: AuxiliaresParaTomaDeAsistencia[];
  HorariosLaboraresGenerales: {
    TomaAsistenciaRangoTotalPersonales: HorarioTomaAsistencia;
    TomaAsistenciaProfesorPrimaria: HorarioTomaAsistencia;
    TomaAsistenciaAuxiliares: HorarioTomaAsistencia;
  };
  HorariosEscolares: Record<NivelEducativo, HorarioTomaAsistencia>;
}

// ProfesorPrimaria gets their schedule and primary level student schedule
export interface ProfesorPrimariaAsistenciaResponse
  extends BaseAsistenciaResponse {
  HorarioTomaAsistenciaProfesorPrimaria: HorarioTomaAsistencia;
  HorarioEscolarPrimaria: HorarioTomaAsistencia;
}

// Auxiliar gets their schedule and secondary level student schedule
export interface AuxiliarAsistenciaResponse extends BaseAsistenciaResponse {
  HorarioTomaAsistenciaAuxiliares: HorarioTomaAsistencia;
  HorarioEscolarSecundaria: HorarioTomaAsistencia;
}

// ProfesorSecundaria and Tutor get their own schedule from the list and secondary schedule
export interface ProfesorTutorSecundariaAsistenciaResponse
  extends BaseAsistenciaResponse {
  HorarioProfesor?:
    | {
        Hora_Entrada_Dia_Actual: Date;
        Hora_Salida_Dia_Actual: Date;
      }
    | false;
  HorarioEscolarSecundaria: HorarioTomaAsistencia;
}

// Responsable gets both primary and secondary schedules
export interface ResponsableAsistenciaResponse extends BaseAsistenciaResponse {
  HorariosEscolares: Record<NivelEducativo, HorarioTomaAsistencia>;
}

// PersonalAdministrativo gets only their own schedule
export interface PersonalAdministrativoAsistenciaResponse
  extends BaseAsistenciaResponse {
  HorarioPersonal:
    | {
        Horario_Laboral_Entrada: Date;
        Horario_Laboral_Salida: Date;
      }
    | false;
}
