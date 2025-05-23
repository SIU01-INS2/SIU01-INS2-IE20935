import { ReactElement } from "react";

import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { IconProps } from "@/interfaces/IconProps";
import AulaIcon from "@/components/icons/AulaIcon";
import EstudianteIcon from "@/components/icons/EstudianteIcon";
import ControlAsistenciaIcon from "@/components/icons/ControlAsistenciaIcon";
import ProfesoresIcon from "@/components/icons/ProfesoresIcon";
import ResponsableIcon from "@/components/icons/ResponsableIcon";
import AuxiliarIcon from "@/components/icons/AuxiliarIcon";
import RegistrosIcon from "@/components/icons/RegistrosIcon";
import ReportesIcon from "@/components/icons/ReportesIcon";
import { RankingsIcon } from "@/components/icons/RankingsIcon";
import ProgramacionIcon from "@/components/icons/ProgramacionIcon";
import EventosIcon from "@/components/icons/EventosIcon";
import ComunicadosIcon from "@/components/icons/ComunicadosIcon";
import ConfiguracionesIcon from "@/components/icons/ConfiguracionesIcon";
import PersonasGenericasIcon from "@/components/icons/PersonasGenericasIcon";
import LibretaConLapiz from "@/components/icons/LibretaConLapiz";
import PizarraAula from "@/components/icons/PizarraAula";
import PersonaLibro from "@/components/icons/PersonaLibro";
import EstudianteBirrete from "@/components/icons/Auxiliar";
import RelojTIempo from "@/components/icons/RelojTIempo";

export interface SiasisModule {
  etiquetaSuperior?: string;
  route: string;
  text: string;
  IconTSX: (props: IconProps) => ReactElement;
  allowedRoles: RolesSistema[]; // Propiedad para roles permitidos
}

const allSiasisModules: SiasisModule[] = [
  {
    route: "/aulas",
    text: "Aulas",
    IconTSX: (props: IconProps) => {
      return <AulaIcon {...props} />;
    },
    allowedRoles: [RolesSistema.Directivo],
  },
  {
    route: "/estudiantes",
    text: "Estudiantes",
    IconTSX: (props: IconProps) => {
      return <EstudianteIcon {...props} />;
    },
    allowedRoles: [RolesSistema.Directivo],
  },

  {
    route: "/responsables",
    text: "Responsables",
    IconTSX: (props: IconProps) => {
      return <ResponsableIcon {...props} />;
    },
    allowedRoles: [RolesSistema.Directivo],
  },
  {
    etiquetaSuperior: "Gestion de Personal",
    route: "/control-asistencia-personal",
    text: "Control Diario",
    IconTSX: (props: IconProps) => {
      return <ControlAsistenciaIcon {...props} />;
    },
    allowedRoles: [RolesSistema.Directivo],
  },
  {
    route: "/profesores",
    text: "Profesores",
    IconTSX: (props: IconProps) => {
      return <ProfesoresIcon {...props} />;
    },
    allowedRoles: [RolesSistema.Directivo],
  },
  {
    route: "/auxiliares",
    text: "Auxiliares",
    IconTSX: (props: IconProps) => {
      return <AuxiliarIcon {...props} />;
    },
    allowedRoles: [RolesSistema.Directivo],
  },
  {
    route: "/personal-administrativo",
    text: "Personal Administrativo",
    IconTSX: (props: IconProps) => {
      return <PersonasGenericasIcon {...props} />;
    },
    allowedRoles: [RolesSistema.Directivo],
  },
  {
    etiquetaSuperior: "Asistencias Escolares",
    route: "/registros-asistencias-escolares",
    text: "Registros",
    IconTSX: (props: IconProps) => {
      return <RegistrosIcon {...props} />;
    },
    allowedRoles: [RolesSistema.Directivo],
  },
  {
    route: "/reportes-asistencias-escolares",
    text: "Reportes",
    IconTSX: (props: IconProps) => {
      return <ReportesIcon {...props} />;
    },
    allowedRoles: [RolesSistema.Directivo],
  },
  {
    route: "/rankings-asistencias-escolares",
    text: "Rankings",
    IconTSX: (props: IconProps) => {
      return <RankingsIcon {...props} />;
    },
    allowedRoles: [RolesSistema.Directivo],
  },
  {
    etiquetaSuperior: " ",
    route: "/programacion",
    text: "Programación",
    IconTSX: (props: IconProps) => {
      return <ProgramacionIcon {...props} />;
    },
    allowedRoles: [RolesSistema.Directivo],
  },
  {
    route: "/eventos",
    text: "Eventos",
    IconTSX: (props: IconProps) => {
      return <EventosIcon {...props} />;
    },
    allowedRoles: [RolesSistema.Directivo],
  },
  {
    route: "/comunicados",
    text: "Comunicados",
    IconTSX: (props: IconProps) => {
      return <ComunicadosIcon {...props} />;
    },
    allowedRoles: [RolesSistema.Directivo],
  },
  {
    route: "/configuraciones",
    text: "Configuraciones",
    IconTSX: (props: IconProps) => {
      return <ConfiguracionesIcon {...props} />;
    },
    allowedRoles: [RolesSistema.Directivo],
  },
  {
    route: "/tomar-asistencia-primaria",
    text: "Tomar Asistencia",
    IconTSX: (props: IconProps) => {
      return <LibretaConLapiz {...props} />;
    },
    allowedRoles: [RolesSistema.ProfesorPrimaria],
  },
  {
    route: "/mi-aula",
    text: "Mi Aula",
    IconTSX: (props: IconProps) => {
      return <PizarraAula {...props} />;
    },
    allowedRoles: [RolesSistema.ProfesorPrimaria],
  },
  {
    route: "/tomar-asistencia-secundaria",
    text: "Tomar Asistencia",
    IconTSX: (props: IconProps) => {
      return <LibretaConLapiz {...props} />;
    },
    allowedRoles: [RolesSistema.Auxiliar],
  },
  {
    route: "/asistencias-escolares-secundaria",
    text: "Asistencias Escolares",
    IconTSX: (props: IconProps) => {
      return <EstudianteBirrete {...props} />;
    },
    allowedRoles: [RolesSistema.Auxiliar],
  },
  {
    route: "/aula-a-cargo",
    text: "Aula a Cargo",
    IconTSX: (props: IconProps) => {
      return <PizarraAula {...props} />;
    },
    allowedRoles: [RolesSistema.Tutor],
  },
  {
    route: "/mi-horario",
    text: "Mi Horario",
    IconTSX: (props: IconProps) => {
      return <RelojTIempo {...props} />;
    },
    allowedRoles: [RolesSistema.ProfesorSecundaria, RolesSistema.Tutor],
  },

  {
    route: "/mis-asistencias",
    text: "Mis Asistencias",
    IconTSX: (props: IconProps) => {
      return <PersonaLibro {...props} />;
    },
    allowedRoles: [
      RolesSistema.ProfesorPrimaria,
      RolesSistema.Auxiliar,
      RolesSistema.ProfesorSecundaria,
      RolesSistema.Tutor,
      RolesSistema.PersonalAdministrativo,
    ],
  },
  {
    route: "/estudiantes-vinculados",
    text: "Estudiantes Vinculados",
    IconTSX: (props: IconProps) => {
      return <EstudianteBirrete {...props} />;
    },
    allowedRoles: [RolesSistema.Responsable],
  },
];

export default allSiasisModules;
