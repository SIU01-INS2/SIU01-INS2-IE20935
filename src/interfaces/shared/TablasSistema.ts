/**
 * Enum que contiene los nombres de las tablas en la base de datos remota.
 * Permite referenciar las tablas del servidor de manera más intuitiva en el código.
 */
export enum TablasRemoto {
  // Usuarios y roles
  Tabla_Directivos = "T_Directivos",
  Tabla_Auxiliares = "T_Auxiliares",
  Tabla_Profesores_Primaria = "T_Profesores_Primaria",
  Tabla_Profesores_Secundaria = "T_Profesores_Secundaria",
  Tabla_Personal_Administrativo = "T_Personal_Administrativo",
  Tabla_Responsables = "T_Responsables",

  // Estudiantes y asistencia
  Tabla_Estudiantes = "T_Estudiantes",
  Tabla_Relaciones_E_R = "T_Relaciones_E_R",

  // Tablas de asistencia primaria
  Tabla_Asistencia_Primaria_1 = "T_A_E_P_1",
  Tabla_Asistencia_Primaria_2 = "T_A_E_P_2",
  Tabla_Asistencia_Primaria_3 = "T_A_E_P_3",
  Tabla_Asistencia_Primaria_4 = "T_A_E_P_4",
  Tabla_Asistencia_Primaria_5 = "T_A_E_P_5",
  Tabla_Asistencia_Primaria_6 = "T_A_E_P_6",

  // Tablas de asistencia secundaria
  Tabla_Asistencia_Secundaria_1 = "T_A_E_S_1",
  Tabla_Asistencia_Secundaria_2 = "T_A_E_S_2",
  Tabla_Asistencia_Secundaria_3 = "T_A_E_S_3",
  Tabla_Asistencia_Secundaria_4 = "T_A_E_S_4",
  Tabla_Asistencia_Secundaria_5 = "T_A_E_S_5",

  // Estructura escolar
  Tabla_Aulas = "T_Aulas",
  Tabla_Cursos_Horario = "T_Cursos_Horario",
  Tabla_Eventos = "T_Eventos",
  Tabla_Comunicados = "T_Comunicados",

  // Control de asistencia personal
  Tabla_Control_Entrada_Profesores_Primaria = "T_Control_Entrada_Mensual_Profesores_Primaria",
  Tabla_Control_Salida_Profesores_Primaria = "T_Control_Salida_Mensual_Profesores_Primaria",
  Tabla_Control_Entrada_Profesores_Secundaria = "T_Control_Entrada_Mensual_Profesores_Secundaria",
  Tabla_Control_Salida_Profesores_Secundaria = "T_Control_Salida_Mensual_Profesores_Secundaria",
  Tabla_Control_Entrada_Auxiliar = "T_Control_Entrada_Mensual_Auxiliar",
  Tabla_Control_Salida_Auxiliar = "T_Control_Salida_Mensual_Auxiliar",
  Tabla_Control_Entrada_Personal_Administrativo = "T_Control_Entrada_Mensual_Personal_Administrativo",
  Tabla_Control_Salida_Personal_Administrativo = "T_Control_Salida_Mensual_Personal_Administrativo",

  // Configuración y sistema
  Tabla_Fechas_Importantes = "T_Fechas_Importantes",
  Tabla_Horarios_Asistencia = "T_Horarios_Asistencia",
  Tabla_Ajustes_Sistema = "T_Ajustes_Generales_Sistema",
  Tabla_Bloqueo_Roles = "T_Bloqueo_Roles",
  Tabla_Registro_Fallos = "T_Registro_Fallos_Sistema",
  Tabla_Codigos_OTP = "T_Codigos_OTP",

  // Control de cambios
  Tabla_Ultima_Modificacion = "T_Ultima_Modificacion_Tablas",
}

/**
 * Enum que contiene los nombres de las tablas en la base de datos local (IndexedDB).
 * Permite referenciar las tablas locales de manera más intuitiva en el código.
 */
export enum TablasLocal {
  // Usuarios y roles
  // Nota: Directivos solo existe en remoto, no tiene equivalente local
  Tabla_Auxiliares = "auxiliares",
  Tabla_Profesores_Primaria = "profesores_primaria",
  Tabla_Profesores_Secundaria = "profesores_secundaria",
  Tabla_Personal_Administrativo = "personal_administrativo",
  Tabla_Responsables = "responsables",

  // Estudiantes y asistencia
  Tabla_Estudiantes = "estudiantes",
  Tabla_Relaciones_E_R = "relaciones_e_r",

  // Tablas de asistencia primaria
  Tabla_Asistencia_Primaria_1 = "asistencias_e_p_1",
  Tabla_Asistencia_Primaria_2 = "asistencias_e_p_2",
  Tabla_Asistencia_Primaria_3 = "asistencias_e_p_3",
  Tabla_Asistencia_Primaria_4 = "asistencias_e_p_4",
  Tabla_Asistencia_Primaria_5 = "asistencias_e_p_5",
  Tabla_Asistencia_Primaria_6 = "asistencias_e_p_6",

  // Tablas de asistencia secundaria
  Tabla_Asistencia_Secundaria_1 = "asistencias_e_s_1",
  Tabla_Asistencia_Secundaria_2 = "asistencias_e_s_2",
  Tabla_Asistencia_Secundaria_3 = "asistencias_e_s_3",
  Tabla_Asistencia_Secundaria_4 = "asistencias_e_s_4",
  Tabla_Asistencia_Secundaria_5 = "asistencias_e_s_5",

  // Estructura escolar
  Tabla_Aulas = "aulas",
  Tabla_Cursos_Horario = "cursos_horario",
  Tabla_Eventos = "eventos",
  Tabla_Comunicados = "comunicados",

  // Control de asistencia personal
  Tabla_Control_Entrada_Profesores_Primaria = "control_entrada_profesores_primaria",
  Tabla_Control_Salida_Profesores_Primaria = "control_salida_profesores_primaria",
  Tabla_Control_Entrada_Profesores_Secundaria = "control_entrada_profesores_secundaria",
  Tabla_Control_Salida_Profesores_Secundaria = "control_salida_profesores_secundaria",
  Tabla_Control_Entrada_Auxiliar = "control_entrada_auxiliar",
  Tabla_Control_Salida_Auxiliar = "control_salida_auxiliar",
  Tabla_Control_Entrada_Personal_Administrativo = "control_entrada_personal_administrativo",
  Tabla_Control_Salida_Personal_Administrativo = "control_salida_personal_administrativo",

  // Configuración y sistema
  Tabla_Fechas_Importantes = "fechas_importantes",
  Tabla_Horarios_Asistencia = "horarios_asistencia",
  Tabla_Ajustes_Sistema = "ajustes_generales_sistema",
  Tabla_Bloqueo_Roles = "bloqueo_roles",
  Tabla_Registro_Fallos = "registro_fallos_sistema",
  Tabla_Codigos_OTP = "codigos_otp", // Podría no existir realmente en local

  // Control de cambios
  Tabla_Ultima_Modificacion = "ultima_modificacion_tablas",
  Tabla_Ultima_Actualizacion = "ultima_actualizacion_tablas_locales",

  // Tablas exclusivas de IndexedDB
  Tabla_Datos_Usuario = "user_data",
  Tabla_Solicitudes_Offline = "offline_requests",
  Tabla_Metadatos_Sistema = "system_meta",
}

/**
 * Interfaz que define la estructura de la información de una tabla
 */
export interface ITablaInfo {
  /** Nombre de la tabla en la base de datos remota (PostgreSQL/MySQL) */
  nombreRemoto?: TablasRemoto;

  /** Nombre de la tabla en la base de datos local (IndexedDB) */
  nombreLocal?: TablasLocal;

  /** Descripción de la tabla */
  descripcion: string;

  /** Indica si la tabla es sincronizable entre local y remoto */
  sincronizable: boolean;
}

/**
 * Mapeo completo entre las tablas del sistema remoto y local
 * Contiene la información de todas las tablas incluyendo su nombre en la BD remota y en IndexedDB
 */
export const TablasSistema = {
  // Usuarios y roles
  DIRECTIVOS: {
    nombreRemoto: TablasRemoto.Tabla_Directivos,
    // No tiene equivalente en local
    descripcion: "Directores y subdirectores de la institución",
    sincronizable: false,
  },
  AUXILIARES: {
    nombreRemoto: TablasRemoto.Tabla_Auxiliares,
    nombreLocal: TablasLocal.Tabla_Auxiliares,
    descripcion: "Personal auxiliar de la institución",
    sincronizable: true,
  },
  PROFESORES_PRIMARIA: {
    nombreRemoto: TablasRemoto.Tabla_Profesores_Primaria,
    nombreLocal: TablasLocal.Tabla_Profesores_Primaria,
    descripcion: "Profesores del nivel primaria",
    sincronizable: true,
  },
  PROFESORES_SECUNDARIA: {
    nombreRemoto: TablasRemoto.Tabla_Profesores_Secundaria,
    nombreLocal: TablasLocal.Tabla_Profesores_Secundaria,
    descripcion: "Profesores del nivel secundaria",
    sincronizable: true,
  },
  PERSONAL_ADMINISTRATIVO: {
    nombreRemoto: TablasRemoto.Tabla_Personal_Administrativo,
    nombreLocal: TablasLocal.Tabla_Personal_Administrativo,
    descripcion: "Personal administrativo de la institución",
    sincronizable: true,
  },
  RESPONSABLES: {
    nombreRemoto: TablasRemoto.Tabla_Responsables,
    nombreLocal: TablasLocal.Tabla_Responsables,
    descripcion: "Padres de familia o apoderados",
    sincronizable: true,
  },

  // Estudiantes y relaciones
  ESTUDIANTES: {
    nombreRemoto: TablasRemoto.Tabla_Estudiantes,
    nombreLocal: TablasLocal.Tabla_Estudiantes,
    descripcion: "Estudiantes de la institución",
    sincronizable: true,
  },
  RELACIONES_E_R: {
    nombreRemoto: TablasRemoto.Tabla_Relaciones_E_R,
    nombreLocal: TablasLocal.Tabla_Relaciones_E_R,
    descripcion: "Relaciones entre estudiantes y responsables",
    sincronizable: true,
  },

  // Asistencia primaria
  ASISTENCIA_P_1: {
    nombreRemoto: TablasRemoto.Tabla_Asistencia_Primaria_1,
    nombreLocal: TablasLocal.Tabla_Asistencia_Primaria_1,
    descripcion: "Asistencia de estudiantes de 1° de primaria",
    sincronizable: true,
  },
  ASISTENCIA_P_2: {
    nombreRemoto: TablasRemoto.Tabla_Asistencia_Primaria_2,
    nombreLocal: TablasLocal.Tabla_Asistencia_Primaria_2,
    descripcion: "Asistencia de estudiantes de 2° de primaria",
    sincronizable: true,
  },
  ASISTENCIA_P_3: {
    nombreRemoto: TablasRemoto.Tabla_Asistencia_Primaria_3,
    nombreLocal: TablasLocal.Tabla_Asistencia_Primaria_3,
    descripcion: "Asistencia de estudiantes de 3° de primaria",
    sincronizable: true,
  },
  ASISTENCIA_P_4: {
    nombreRemoto: TablasRemoto.Tabla_Asistencia_Primaria_4,
    nombreLocal: TablasLocal.Tabla_Asistencia_Primaria_4,
    descripcion: "Asistencia de estudiantes de 4° de primaria",
    sincronizable: true,
  },
  ASISTENCIA_P_5: {
    nombreRemoto: TablasRemoto.Tabla_Asistencia_Primaria_5,
    nombreLocal: TablasLocal.Tabla_Asistencia_Primaria_5,
    descripcion: "Asistencia de estudiantes de 5° de primaria",
    sincronizable: true,
  },
  ASISTENCIA_P_6: {
    nombreRemoto: TablasRemoto.Tabla_Asistencia_Primaria_6,
    nombreLocal: TablasLocal.Tabla_Asistencia_Primaria_6,
    descripcion: "Asistencia de estudiantes de 6° de primaria",
    sincronizable: true,
  },

  // Asistencia secundaria
  ASISTENCIA_S_1: {
    nombreRemoto: TablasRemoto.Tabla_Asistencia_Secundaria_1,
    nombreLocal: TablasLocal.Tabla_Asistencia_Secundaria_1,
    descripcion: "Asistencia de estudiantes de 1° de secundaria",
    sincronizable: true,
  },
  ASISTENCIA_S_2: {
    nombreRemoto: TablasRemoto.Tabla_Asistencia_Secundaria_2,
    nombreLocal: TablasLocal.Tabla_Asistencia_Secundaria_2,
    descripcion: "Asistencia de estudiantes de 2° de secundaria",
    sincronizable: true,
  },
  ASISTENCIA_S_3: {
    nombreRemoto: TablasRemoto.Tabla_Asistencia_Secundaria_3,
    nombreLocal: TablasLocal.Tabla_Asistencia_Secundaria_3,
    descripcion: "Asistencia de estudiantes de 3° de secundaria",
    sincronizable: true,
  },
  ASISTENCIA_S_4: {
    nombreRemoto: TablasRemoto.Tabla_Asistencia_Secundaria_4,
    nombreLocal: TablasLocal.Tabla_Asistencia_Secundaria_4,
    descripcion: "Asistencia de estudiantes de 4° de secundaria",
    sincronizable: true,
  },
  ASISTENCIA_S_5: {
    nombreRemoto: TablasRemoto.Tabla_Asistencia_Secundaria_5,
    nombreLocal: TablasLocal.Tabla_Asistencia_Secundaria_5,
    descripcion: "Asistencia de estudiantes de 5° de secundaria",
    sincronizable: true,
  },

  // Estructura escolar
  AULAS: {
    nombreRemoto: TablasRemoto.Tabla_Aulas,
    nombreLocal: TablasLocal.Tabla_Aulas,
    descripcion: "Aulas o secciones de la institución",
    sincronizable: true,
  },
  CURSOS_HORARIO: {
    nombreRemoto: TablasRemoto.Tabla_Cursos_Horario,
    nombreLocal: TablasLocal.Tabla_Cursos_Horario,
    descripcion: "Horarios de cursos",
    sincronizable: true,
  },
  EVENTOS: {
    nombreRemoto: TablasRemoto.Tabla_Eventos,
    nombreLocal: TablasLocal.Tabla_Eventos,
    descripcion: "Eventos y celebraciones del calendario escolar",
    sincronizable: true,
  },
  COMUNICADOS: {
    nombreRemoto: TablasRemoto.Tabla_Comunicados,
    nombreLocal: TablasLocal.Tabla_Comunicados,
    descripcion: "Comunicados institucionales",
    sincronizable: true,
  },

  // Control de asistencia personal
  CONTROL_ENTRADA_PROF_PRIMARIA: {
    nombreRemoto: TablasRemoto.Tabla_Control_Entrada_Profesores_Primaria,
    nombreLocal: TablasLocal.Tabla_Control_Entrada_Profesores_Primaria,
    descripcion: "Control de entrada de profesores de primaria",
    sincronizable: true,
  },
  CONTROL_SALIDA_PROF_PRIMARIA: {
    nombreRemoto: TablasRemoto.Tabla_Control_Salida_Profesores_Primaria,
    nombreLocal: TablasLocal.Tabla_Control_Salida_Profesores_Primaria,
    descripcion: "Control de salida de profesores de primaria",
    sincronizable: true,
  },
  CONTROL_ENTRADA_PROF_SECUNDARIA: {
    nombreRemoto: TablasRemoto.Tabla_Control_Entrada_Profesores_Secundaria,
    nombreLocal: TablasLocal.Tabla_Control_Entrada_Profesores_Secundaria,
    descripcion: "Control de entrada de profesores de secundaria",
    sincronizable: true,
  },
  CONTROL_SALIDA_PROF_SECUNDARIA: {
    nombreRemoto: TablasRemoto.Tabla_Control_Salida_Profesores_Secundaria,
    nombreLocal: TablasLocal.Tabla_Control_Salida_Profesores_Secundaria,
    descripcion: "Control de salida de profesores de secundaria",
    sincronizable: true,
  },
  CONTROL_ENTRADA_AUXILIAR: {
    nombreRemoto: TablasRemoto.Tabla_Control_Entrada_Auxiliar,
    nombreLocal: TablasLocal.Tabla_Control_Entrada_Auxiliar,
    descripcion: "Control de entrada de auxiliares",
    sincronizable: true,
  },
  CONTROL_SALIDA_AUXILIAR: {
    nombreRemoto: TablasRemoto.Tabla_Control_Salida_Auxiliar,
    nombreLocal: TablasLocal.Tabla_Control_Salida_Auxiliar,
    descripcion: "Control de salida de auxiliares",
    sincronizable: true,
  },
  CONTROL_ENTRADA_ADMIN: {
    nombreRemoto: TablasRemoto.Tabla_Control_Entrada_Personal_Administrativo,
    nombreLocal: TablasLocal.Tabla_Control_Entrada_Personal_Administrativo,
    descripcion: "Control de entrada de personal administrativo",
    sincronizable: true,
  },
  CONTROL_SALIDA_ADMIN: {
    nombreRemoto: TablasRemoto.Tabla_Control_Salida_Personal_Administrativo,
    nombreLocal: TablasLocal.Tabla_Control_Salida_Personal_Administrativo,
    descripcion: "Control de salida de personal administrativo",
    sincronizable: true,
  },

  // Configuración y sistema
  FECHAS_IMPORTANTES: {
    nombreRemoto: TablasRemoto.Tabla_Fechas_Importantes,
    nombreLocal: TablasLocal.Tabla_Fechas_Importantes,
    descripcion: "Fechas importantes del año escolar",
    sincronizable: true,
  },
  HORARIOS_ASISTENCIA: {
    nombreRemoto: TablasRemoto.Tabla_Horarios_Asistencia,
    nombreLocal: TablasLocal.Tabla_Horarios_Asistencia,
    descripcion: "Configuración de horarios para toma de asistencia",
    sincronizable: true,
  },
  AJUSTES_SISTEMA: {
    nombreRemoto: TablasRemoto.Tabla_Ajustes_Sistema,
    nombreLocal: TablasLocal.Tabla_Ajustes_Sistema,
    descripcion: "Ajustes generales del sistema",
    sincronizable: true,
  },
  BLOQUEO_ROLES: {
    nombreRemoto: TablasRemoto.Tabla_Bloqueo_Roles,
    nombreLocal: TablasLocal.Tabla_Bloqueo_Roles,
    descripcion: "Bloqueo temporal de roles en el sistema",
    sincronizable: true,
  },
  REGISTRO_FALLOS: {
    nombreRemoto: TablasRemoto.Tabla_Registro_Fallos,
    nombreLocal: TablasLocal.Tabla_Registro_Fallos,
    descripcion: "Registro de errores y fallos del sistema",
    sincronizable: false, // Generalmente no se sincronizan los errores locales
  },
  CODIGOS_OTP: {
    nombreRemoto: TablasRemoto.Tabla_Codigos_OTP,
    nombreLocal: TablasLocal.Tabla_Codigos_OTP,
    descripcion: "Códigos de verificación de un solo uso",
    sincronizable: false, // Los OTP no se suelen sincronizar por seguridad
  },
  ULTIMA_MODIFICACION: {
    nombreRemoto: TablasRemoto.Tabla_Ultima_Modificacion,
    nombreLocal: TablasLocal.Tabla_Ultima_Modificacion,
    descripcion: "Registro de últimas modificaciones de cada tabla",
    sincronizable: true,
  },

  ULTIMA_ACTUALIZACION_LOCAL: {
    nombreLocal: TablasLocal.Tabla_Ultima_Actualizacion,
    descripcion: "Registro de última actualización de tablas locales",
    sincronizable: false,
  },
  // Tablas exclusivas de IndexedDB
  DATOS_USUARIO: {
    nombreLocal: TablasLocal.Tabla_Datos_Usuario,
    descripcion: "Datos de sesión del usuario actual",
    sincronizable: false,
  },
  SOLICITUDES_OFFLINE: {
    nombreLocal: TablasLocal.Tabla_Solicitudes_Offline,
    descripcion: "Cola de solicitudes pendientes en modo offline",
    sincronizable: false,
  },
  METADATOS_SISTEMA: {
    nombreLocal: TablasLocal.Tabla_Metadatos_Sistema,
    descripcion: "Metadatos y configuraciones del sistema local",
    sincronizable: false,
  },
};

export default TablasSistema;
