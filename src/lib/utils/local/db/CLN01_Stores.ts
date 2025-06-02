export const CLN01_Stores = {
  user_data: {
    keyPath: null,
    autoIncrement: false,
    indexes: [],
  },
  datos_asistencia_hoy: {
    keyPath: null,
    autoIncrement: false,
    indexes: [],
  },
  estudiantes: {
    keyPath: "DNI_Estudiante",
    autoIncrement: false,
    indexes: [
      { name: "por_nombres", keyPath: "Nombres", options: { unique: false } },
      {
        name: "por_apellidos",
        keyPath: "Apellidos",
        options: { unique: false },
      },
      { name: "por_aula", keyPath: "Id_Aula", options: { unique: false } },
      { name: "por_estado", keyPath: "Estado", options: { unique: false } },
    ],
  },
  responsables: {
    keyPath: "DNI_Responsable",
    autoIncrement: false,
    indexes: [
      {
        name: "por_nombre_usuario",
        keyPath: "Nombre_Usuario",
        options: { unique: true },
      },
      { name: "por_nombres", keyPath: "Nombres", options: { unique: false } },
      {
        name: "por_apellidos",
        keyPath: "Apellidos",
        options: { unique: false },
      },
    ],
  },
  relaciones_e_r: {
    keyPath: "Id_Relacion",
    autoIncrement: true,
    indexes: [
      {
        name: "por_responsable",
        keyPath: "DNI_Responsable",
        options: { unique: false },
      },
      {
        name: "por_estudiante",
        keyPath: "DNI_Estudiante",
        options: { unique: false },
      },
      { name: "por_tipo", keyPath: "Tipo", options: { unique: false } },
    ],
  },
  profesores_primaria: {
    keyPath: "DNI_Profesor_Primaria",
    autoIncrement: false,
    indexes: [
      {
        name: "por_nombre_usuario",
        keyPath: "Nombre_Usuario",
        options: { unique: true },
      },
      { name: "por_nombres", keyPath: "Nombres", options: { unique: false } },
      {
        name: "por_apellidos",
        keyPath: "Apellidos",
        options: { unique: false },
      },
      { name: "por_estado", keyPath: "Estado", options: { unique: false } },
    ],
  },
  profesores_secundaria: {
    keyPath: "DNI_Profesor_Secundaria",
    autoIncrement: false,
    indexes: [
      {
        name: "por_nombre_usuario",
        keyPath: "Nombre_Usuario",
        options: { unique: true },
      },
      { name: "por_nombres", keyPath: "Nombres", options: { unique: false } },
      {
        name: "por_apellidos",
        keyPath: "Apellidos",
        options: { unique: false },
      },
      { name: "por_estado", keyPath: "Estado", options: { unique: false } },
    ],
  },
  aulas: {
    keyPath: "Id_Aula",
    autoIncrement: true,
    indexes: [
      { name: "por_nivel", keyPath: "Nivel", options: { unique: false } },
      { name: "por_grado", keyPath: "Grado", options: { unique: false } },
      { name: "por_seccion", keyPath: "Seccion", options: { unique: false } },
      {
        name: "por_nivel_grado_seccion",
        keyPath: ["Nivel", "Grado", "Seccion"],
        options: { unique: true },
      },
      {
        name: "por_profesor_primaria",
        keyPath: "DNI_Profesor_Primaria",
        options: { unique: false },
      },
      {
        name: "por_profesor_secundaria",
        keyPath: "DNI_Profesor_Secundaria",
        options: { unique: false },
      },
    ],
  },
  cursos_horario: {
    keyPath: "Id_Curso_Horario",
    autoIncrement: true,
    indexes: [
      { name: "por_dia", keyPath: "Dia_Semana", options: { unique: false } },
      {
        name: "por_profesor",
        keyPath: "DNI_Profesor_Secundaria",
        options: { unique: false },
      },
      {
        name: "por_aula",
        keyPath: "Id_Aula_Secundaria",
        options: { unique: false },
      },
    ],
  },
  asistencias_e_p_1: {
    keyPath: "Id_Asistencia_Escolar_Mensual",
    autoIncrement: false,
    indexes: [
      {
        name: "por_estudiante",
        keyPath: "DNI_Estudiante",
        options: { unique: false },
      },
      { name: "por_mes", keyPath: "Mes", options: { unique: false } },
      {
        name: "por_estudiante_mes",
        keyPath: ["DNI_Estudiante", "Mes"],
        options: { unique: true },
      },
    ],
  },
  asistencias_e_p_2: {
    keyPath: "Id_Asistencia_Escolar_Mensual",
    autoIncrement: false,
    indexes: [
      {
        name: "por_estudiante",
        keyPath: "DNI_Estudiante",
        options: { unique: false },
      },
      { name: "por_mes", keyPath: "Mes", options: { unique: false } },
      {
        name: "por_estudiante_mes",
        keyPath: ["DNI_Estudiante", "Mes"],
        options: { unique: true },
      },
    ],
  },
  asistencias_e_p_3: {
    keyPath: "Id_Asistencia_Escolar_Mensual",
    autoIncrement: false,
    indexes: [
      {
        name: "por_estudiante",
        keyPath: "DNI_Estudiante",
        options: { unique: false },
      },
      { name: "por_mes", keyPath: "Mes", options: { unique: false } },
      {
        name: "por_estudiante_mes",
        keyPath: ["DNI_Estudiante", "Mes"],
        options: { unique: true },
      },
    ],
  },
  asistencias_e_p_4: {
    keyPath: "Id_Asistencia_Escolar_Mensual",
    autoIncrement: false,
    indexes: [
      {
        name: "por_estudiante",
        keyPath: "DNI_Estudiante",
        options: { unique: false },
      },
      { name: "por_mes", keyPath: "Mes", options: { unique: false } },
      {
        name: "por_estudiante_mes",
        keyPath: ["DNI_Estudiante", "Mes"],
        options: { unique: true },
      },
    ],
  },
  asistencias_e_p_5: {
    keyPath: "Id_Asistencia_Escolar_Mensual",
    autoIncrement: false,
    indexes: [
      {
        name: "por_estudiante",
        keyPath: "DNI_Estudiante",
        options: { unique: false },
      },
      { name: "por_mes", keyPath: "Mes", options: { unique: false } },
      {
        name: "por_estudiante_mes",
        keyPath: ["DNI_Estudiante", "Mes"],
        options: { unique: true },
      },
    ],
  },
  asistencias_e_p_6: {
    keyPath: "Id_Asistencia_Escolar_Mensual",
    autoIncrement: false,
    indexes: [
      {
        name: "por_estudiante",
        keyPath: "DNI_Estudiante",
        options: { unique: false },
      },
      { name: "por_mes", keyPath: "Mes", options: { unique: false } },
      {
        name: "por_estudiante_mes",
        keyPath: ["DNI_Estudiante", "Mes"],
        options: { unique: true },
      },
    ],
  },
  asistencias_e_s_1: {
    keyPath: "Id_Asistencia_Escolar_Mensual",
    autoIncrement: false,
    indexes: [
      {
        name: "por_estudiante",
        keyPath: "DNI_Estudiante",
        options: { unique: false },
      },
      { name: "por_mes", keyPath: "Mes", options: { unique: false } },
      {
        name: "por_estudiante_mes",
        keyPath: ["DNI_Estudiante", "Mes"],
        options: { unique: true },
      },
    ],
  },
  asistencias_e_s_2: {
    keyPath: "Id_Asistencia_Escolar_Mensual",
    autoIncrement: false,
    indexes: [
      {
        name: "por_estudiante",
        keyPath: "DNI_Estudiante",
        options: { unique: false },
      },
      { name: "por_mes", keyPath: "Mes", options: { unique: false } },
      {
        name: "por_estudiante_mes",
        keyPath: ["DNI_Estudiante", "Mes"],
        options: { unique: true },
      },
    ],
  },
  asistencias_e_s_3: {
    keyPath: "Id_Asistencia_Escolar_Mensual",
    autoIncrement: false,
    indexes: [
      {
        name: "por_estudiante",
        keyPath: "DNI_Estudiante",
        options: { unique: false },
      },
      { name: "por_mes", keyPath: "Mes", options: { unique: false } },
      {
        name: "por_estudiante_mes",
        keyPath: ["DNI_Estudiante", "Mes"],
        options: { unique: true },
      },
    ],
  },
  asistencias_e_s_4: {
    keyPath: "Id_Asistencia_Escolar_Mensual",
    autoIncrement: false,
    indexes: [
      {
        name: "por_estudiante",
        keyPath: "DNI_Estudiante",
        options: { unique: false },
      },
      { name: "por_mes", keyPath: "Mes", options: { unique: false } },
      {
        name: "por_estudiante_mes",
        keyPath: ["DNI_Estudiante", "Mes"],
        options: { unique: true },
      },
    ],
  },
  asistencias_e_s_5: {
    keyPath: "Id_Asistencia_Escolar_Mensual",
    autoIncrement: false,
    indexes: [
      {
        name: "por_estudiante",
        keyPath: "DNI_Estudiante",
        options: { unique: false },
      },
      { name: "por_mes", keyPath: "Mes", options: { unique: false } },
      {
        name: "por_estudiante_mes",
        keyPath: ["DNI_Estudiante", "Mes"],
        options: { unique: true },
      },
    ],
  },
  auxiliares: {
    keyPath: "DNI_Auxiliar",
    autoIncrement: false,
    indexes: [
      {
        name: "por_nombre_usuario",
        keyPath: "Nombre_Usuario",
        options: { unique: true },
      },
      { name: "por_nombres", keyPath: "Nombres", options: { unique: false } },
      {
        name: "por_apellidos",
        keyPath: "Apellidos",
        options: { unique: false },
      },
      { name: "por_estado", keyPath: "Estado", options: { unique: false } },
    ],
  },
  control_entrada_auxiliar: {
    keyPath: "Id_C_E_M_P_Auxiliar",
    autoIncrement: false,
    indexes: [
      {
        name: "por_auxiliar",
        keyPath: "DNI_Auxiliar",
        options: { unique: false },
      },
      { name: "por_mes", keyPath: "Mes", options: { unique: false } },
      {
        name: "por_auxiliar_mes",
        keyPath: ["DNI_Auxiliar", "Mes"],
        options: { unique: true },
      },
    ],
  },
  control_salida_auxiliar: {
    keyPath: "Id_C_S_M_P_Auxiliar",
    autoIncrement: false,
    indexes: [
      {
        name: "por_auxiliar",
        keyPath: "DNI_Auxiliar",
        options: { unique: false },
      },
      { name: "por_mes", keyPath: "Mes", options: { unique: false } },
      {
        name: "por_auxiliar_mes",
        keyPath: ["DNI_Auxiliar", "Mes"],
        options: { unique: true },
      },
    ],
  },
  control_entrada_profesores_primaria: {
    keyPath: "Id_C_E_M_P_Profesores_Primaria",
    autoIncrement: false,
    indexes: [
      {
        name: "por_profesor",
        keyPath: "DNI_Profesor_Primaria",
        options: { unique: false },
      },
      { name: "por_mes", keyPath: "Mes", options: { unique: false } },
      {
        name: "por_profesor_mes",
        keyPath: ["DNI_Profesor_Primaria", "Mes"],
        options: { unique: true },
      },
    ],
  },
  control_salida_profesores_primaria: {
    keyPath: "Id_C_S_M_P_Profesores_Primaria",
    autoIncrement: false,
    indexes: [
      {
        name: "por_profesor",
        keyPath: "DNI_Profesor_Primaria",
        options: { unique: false },
      },
      { name: "por_mes", keyPath: "Mes", options: { unique: false } },
      {
        name: "por_profesor_mes",
        keyPath: ["DNI_Profesor_Primaria", "Mes"],
        options: { unique: true },
      },
    ],
  },
  control_entrada_profesores_secundaria: {
    keyPath: "Id_C_E_M_P_Profesores_Secundaria",
    autoIncrement: false,
    indexes: [
      {
        name: "por_profesor",
        keyPath: "DNI_Profesor_Secundaria",
        options: { unique: false },
      },
      { name: "por_mes", keyPath: "Mes", options: { unique: false } },
      {
        name: "por_profesor_mes",
        keyPath: ["DNI_Profesor_Secundaria", "Mes"],
        options: { unique: true },
      },
    ],
  },
  control_salida_profesores_secundaria: {
    keyPath: "Id_C_S_M_P_Profesores_Secundaria",
    autoIncrement: false,
    indexes: [
      {
        name: "por_profesor",
        keyPath: "DNI_Profesor_Secundaria",
        options: { unique: false },
      },
      { name: "por_mes", keyPath: "Mes", options: { unique: false } },
      {
        name: "por_profesor_mes",
        keyPath: ["DNI_Profesor_Secundaria", "Mes"],
        options: { unique: true },
      },
    ],
  },
  personal_administrativo: {
    keyPath: "DNI_Personal_Administrativo",
    autoIncrement: false,
    indexes: [
      {
        name: "por_nombre_usuario",
        keyPath: "Nombre_Usuario",
        options: { unique: true },
      },
      { name: "por_nombres", keyPath: "Nombres", options: { unique: false } },
      {
        name: "por_apellidos",
        keyPath: "Apellidos",
        options: { unique: false },
      },
      { name: "por_estado", keyPath: "Estado", options: { unique: false } },
      { name: "por_cargo", keyPath: "Cargo", options: { unique: false } },
    ],
  },
  control_entrada_personal_administrativo: {
    keyPath: "Id_C_E_M_P_Administrativo",
    autoIncrement: false,
    indexes: [
      {
        name: "por_administrativo",
        keyPath: "DNI_Personal_Administrativo",
        options: { unique: false },
      },
      { name: "por_mes", keyPath: "Mes", options: { unique: false } },
      {
        name: "por_administrativo_mes",
        keyPath: ["DNI_Personal_Administrativo", "Mes"],
        options: { unique: true },
      },
    ],
  },
  control_salida_personal_administrativo: {
    keyPath: "Id_C_S_M_P_Administrativo",
    autoIncrement: false,
    indexes: [
      {
        name: "por_administrativo",
        keyPath: "DNI_Personal_Administrativo",
        options: { unique: false },
      },
      { name: "por_mes", keyPath: "Mes", options: { unique: false } },
      {
        name: "por_administrativo_mes",
        keyPath: ["DNI_Personal_Administrativo", "Mes"],
        options: { unique: true },
      },
    ],
  },
  bloqueo_roles: {
    keyPath: "Id_Bloqueo_Rol",
    autoIncrement: true,
    indexes: [{ name: "por_rol", keyPath: "Rol", options: { unique: true } }],
  },
  ajustes_generales_sistema: {
    keyPath: "Id_Constante",
    autoIncrement: true,
    indexes: [
      { name: "por_nombre", keyPath: "Nombre", options: { unique: true } },
    ],
  },
  horarios_asistencia: {
    keyPath: "Id_Horario",
    autoIncrement: true,
    indexes: [
      { name: "por_nombre", keyPath: "Nombre", options: { unique: true } },
    ],
  },
  eventos: {
    keyPath: "Id_Evento",
    autoIncrement: true,
    indexes: [
      {
        name: "por_fecha_inicio",
        keyPath: "Fecha_Inicio",
        options: { unique: false },
      },
      {
        name: "por_fecha_conclusion",
        keyPath: "Fecha_Conclusion",
        options: { unique: false },
      },
    ],
  },
  registro_fallos_sistema: {
    keyPath: "Id_Registro_Fallo_Sistema",
    autoIncrement: true,
    indexes: [
      { name: "por_fecha", keyPath: "Fecha", options: { unique: false } },
      {
        name: "por_componente",
        keyPath: "Componente",
        options: { unique: false },
      },
    ],
  },
  comunicados: {
    keyPath: "Id_Comunicado",
    autoIncrement: true,
    indexes: [
      {
        name: "por_fecha_inicio",
        keyPath: "Fecha_Inicio",
        options: { unique: false },
      },
      {
        name: "por_fecha_conclusion",
        keyPath: "Fecha_Conclusion",
        options: { unique: false },
      },
    ],
  },
  offline_requests: {
    keyPath: "id",
    autoIncrement: true,
    indexes: [
      {
        name: "por_created_at",
        keyPath: "created_at",
        options: { unique: false },
      },
      {
        name: "por_attempts",
        keyPath: "attempts",
        options: { unique: false },
      },
    ],
  },
  system_meta: {
    keyPath: "key",
    autoIncrement: false,
    indexes: [],
  },
  ultima_modificacion_tablas: {
    keyPath: "Nombre_Tabla",
    autoIncrement: false,
    indexes: [
      {
        name: "por_operacion",
        keyPath: "Operacion",
        options: { unique: false },
      },
      {
        name: "por_fecha",
        keyPath: "Fecha_Modificacion",
        options: { unique: false },
      },
      {
        name: "por_usuario",
        keyPath: "Usuario_Modificacion",
        options: { unique: false },
      },
    ],
  },
  fechas_importantes: {
    keyPath: "Id_Fecha_Importante",
    autoIncrement: true,
    indexes: [
      { name: "por_nombre", keyPath: "Nombre", options: { unique: true } },
      { name: "por_valor", keyPath: "Valor", options: { unique: false } },
      {
        name: "por_ultima_modificacion",
        keyPath: "Ultima_Modificacion",
        options: { unique: false },
      },
    ],
  },
  ultima_actualizacion_tablas_locales: {
    keyPath: "Nombre_Tabla",
    autoIncrement: false,
    indexes: [
      {
        name: "por_operacion",
        keyPath: "Operacion",
        options: { unique: false },
      },
      {
        name: "por_fecha",
        keyPath: "Fecha_Actualizacion",
        options: { unique: false },
      },
    ],
  },
  // ✅ NUEVA TABLA: Cache de asistencias consultadas desde Redis
  asistencias_tomadas_hoy: {
    keyPath: "clave", // La clave será el identificador único (fecha:modo:actor:dni)
    autoIncrement: false,
    indexes: [
      // Índice por DNI para consultas rápidas por usuario
      {
        name: "por_dni",
        keyPath: "dni",
        options: { unique: false },
      },
      // Índice por fecha para limpiezas por día
      {
        name: "por_fecha",
        keyPath: "fecha",
        options: { unique: false },
      },
      // Índice por actor para consultas por tipo de usuario
      {
        name: "por_actor",
        keyPath: "actor",
        options: { unique: false },
      },
      // Índice por modo de registro (Entrada/Salida)
      {
        name: "por_modo_registro",
        keyPath: "modoRegistro",
        options: { unique: false },
      },
      // Índice por tipo de asistencia (Personal/Estudiantes)
      {
        name: "por_tipo_asistencia",
        keyPath: "tipoAsistencia",
        options: { unique: false },
      },
      // Índice por timestamp de consulta para limpieza de expirados
      {
        name: "por_timestamp_consulta",
        keyPath: "timestampConsulta",
        options: { unique: false },
      },
      // Índice compuesto por DNI y modo de registro para consultas específicas
      {
        name: "por_dni_modo",
        keyPath: ["dni", "modoRegistro"],
        options: { unique: false },
      },
      // Índice compuesto por actor y tipo de asistencia
      {
        name: "por_actor_tipo",
        keyPath: ["actor", "tipoAsistencia"],
        options: { unique: false },
      },
      // Índice compuesto por fecha y DNI para consultas por día específico
      {
        name: "por_fecha_dni",
        keyPath: ["fecha", "dni"],
        options: { unique: false },
      },
    ],
  },
};
