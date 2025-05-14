-- CreateTable
CREATE TABLE "T_Directivos" (
    "Id_Directivo" SERIAL NOT NULL,
    "Nombres" VARCHAR(60) NOT NULL,
    "Apellidos" VARCHAR(60) NOT NULL,
    "Genero" VARCHAR(1) NOT NULL,
    "DNI" VARCHAR(8) NOT NULL,
    "Nombre_Usuario" VARCHAR(40) NOT NULL,
    "Correo_Electronico" VARCHAR(70) NOT NULL,
    "Celular" VARCHAR(9) NOT NULL,
    "Contraseña" TEXT NOT NULL,
    "Google_Drive_Foto_ID" TEXT,

    CONSTRAINT "T_Directivos_pkey" PRIMARY KEY ("Id_Directivo")
);

-- CreateTable
CREATE TABLE "T_Estudiantes" (
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Nombres" VARCHAR(60) NOT NULL,
    "Apellidos" VARCHAR(60) NOT NULL,
    "Estado" BOOLEAN NOT NULL,
    "Google_Drive_Foto_ID" TEXT,
    "Id_Aula" INTEGER,

    CONSTRAINT "T_Estudiantes_pkey" PRIMARY KEY ("DNI_Estudiante")
);

-- CreateTable
CREATE TABLE "T_Responsables" (
    "DNI_Responsable" VARCHAR(8) NOT NULL,
    "Nombres" VARCHAR(60) NOT NULL,
    "Apellidos" VARCHAR(60) NOT NULL,
    "Nombre_Usuario" VARCHAR(40) NOT NULL,
    "Celular" VARCHAR(9),
    "Contraseña" TEXT NOT NULL,
    "Google_Drive_Foto_ID" TEXT,

    CONSTRAINT "T_Responsables_pkey" PRIMARY KEY ("DNI_Responsable")
);

-- CreateTable
CREATE TABLE "T_Relaciones_E_R" (
    "Id_Relacion" SERIAL NOT NULL,
    "Tipo" VARCHAR(1) NOT NULL,
    "DNI_Responsable" VARCHAR(8) NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,

    CONSTRAINT "T_Relaciones_E_R_pkey" PRIMARY KEY ("Id_Relacion")
);

-- CreateTable
CREATE TABLE "T_Profesores_Primaria" (
    "DNI_Profesor_Primaria" VARCHAR(8) NOT NULL,
    "Nombres" VARCHAR(60) NOT NULL,
    "Apellidos" VARCHAR(60) NOT NULL,
    "Genero" VARCHAR(1) NOT NULL,
    "Nombre_Usuario" VARCHAR(40) NOT NULL,
    "Estado" BOOLEAN NOT NULL,
    "Correo_Electronico" VARCHAR(70),
    "Celular" VARCHAR(9) NOT NULL,
    "Contraseña" TEXT NOT NULL,
    "Google_Drive_Foto_ID" TEXT,

    CONSTRAINT "T_Profesores_Primaria_pkey" PRIMARY KEY ("DNI_Profesor_Primaria")
);

-- CreateTable
CREATE TABLE "T_Profesores_Secundaria" (
    "DNI_Profesor_Secundaria" VARCHAR(8) NOT NULL,
    "Nombres" VARCHAR(60) NOT NULL,
    "Apellidos" VARCHAR(60) NOT NULL,
    "Genero" VARCHAR(1) NOT NULL,
    "Nombre_Usuario" VARCHAR(40) NOT NULL,
    "Estado" BOOLEAN NOT NULL,
    "Correo_Electronico" VARCHAR(70),
    "Celular" VARCHAR(9) NOT NULL,
    "Contraseña" TEXT NOT NULL,
    "Google_Drive_Foto_ID" TEXT,

    CONSTRAINT "T_Profesores_Secundaria_pkey" PRIMARY KEY ("DNI_Profesor_Secundaria")
);

-- CreateTable
CREATE TABLE "T_Aulas" (
    "Id_Aula" SERIAL NOT NULL,
    "Nivel" VARCHAR(10) NOT NULL,
    "Grado" INTEGER NOT NULL,
    "Seccion" VARCHAR(2) NOT NULL,
    "Color" VARCHAR(15) NOT NULL,
    "DNI_Profesor_Primaria" VARCHAR(8),
    "DNI_Profesor_Secundaria" VARCHAR(8),

    CONSTRAINT "T_Aulas_pkey" PRIMARY KEY ("Id_Aula")
);

-- CreateTable
CREATE TABLE "T_Cursos_Horario" (
    "Id_Curso_Horario" SERIAL NOT NULL,
    "Nombre_Curso" VARCHAR(75) NOT NULL,
    "Dia_Semana" INTEGER NOT NULL,
    "Indice_Hora_Academica_Inicio" INTEGER NOT NULL,
    "Cant_Hora_Academicas" INTEGER NOT NULL,
    "DNI_Profesor_Secundaria" VARCHAR(8) NOT NULL,
    "Id_Aula_Secundaria" INTEGER NOT NULL,

    CONSTRAINT "T_Cursos_Horario_pkey" PRIMARY KEY ("Id_Curso_Horario")
);

-- CreateTable
CREATE TABLE "T_Control_Entrada_Mensual_Profesores_Primaria" (
    "Id_C_E_M_P_Profesores_Primaria" SERIAL NOT NULL,
    "Mes" INTEGER NOT NULL,
    "Entradas" JSONB NOT NULL,
    "DNI_Profesor_Primaria" VARCHAR(8) NOT NULL,

    CONSTRAINT "T_Control_Entrada_Mensual_Profesores_Primaria_pkey" PRIMARY KEY ("Id_C_E_M_P_Profesores_Primaria")
);

-- CreateTable
CREATE TABLE "T_Control_Salida_Mensual_Profesores_Primaria" (
    "Id_C_E_M_P_Profesores_Primaria" SERIAL NOT NULL,
    "Mes" INTEGER NOT NULL,
    "Salidas" JSONB NOT NULL,
    "DNI_Profesor_Primaria" VARCHAR(8) NOT NULL,

    CONSTRAINT "T_Control_Salida_Mensual_Profesores_Primaria_pkey" PRIMARY KEY ("Id_C_E_M_P_Profesores_Primaria")
);

-- CreateTable
CREATE TABLE "T_Control_Entrada_Mensual_Profesores_Secundaria" (
    "Id_C_E_M_P_Profesores_Secundaria" SERIAL NOT NULL,
    "Mes" INTEGER NOT NULL,
    "Entradas" JSONB NOT NULL,
    "DNI_Profesor_Secundaria" VARCHAR(8) NOT NULL,

    CONSTRAINT "T_Control_Entrada_Mensual_Profesores_Secundaria_pkey" PRIMARY KEY ("Id_C_E_M_P_Profesores_Secundaria")
);

-- CreateTable
CREATE TABLE "T_Control_Salida_Mensual_Profesores_Secundaria" (
    "Id_C_E_M_P_Profesores_Secundaria" SERIAL NOT NULL,
    "Mes" INTEGER NOT NULL,
    "Salidas" JSONB NOT NULL,
    "DNI_Profesor_Secundaria" VARCHAR(8) NOT NULL,

    CONSTRAINT "T_Control_Salida_Mensual_Profesores_Secundaria_pkey" PRIMARY KEY ("Id_C_E_M_P_Profesores_Secundaria")
);

-- CreateTable
CREATE TABLE "T_Auxiliares" (
    "DNI_Auxiliar" VARCHAR(8) NOT NULL,
    "Nombres" VARCHAR(60) NOT NULL,
    "Apellidos" VARCHAR(60) NOT NULL,
    "Genero" VARCHAR(1) NOT NULL,
    "Nombre_Usuario" VARCHAR(40) NOT NULL,
    "Estado" BOOLEAN NOT NULL,
    "Correo_Electronico" VARCHAR(70),
    "Celular" VARCHAR(9) NOT NULL,
    "Contraseña" TEXT NOT NULL,
    "Google_Drive_Foto_ID" TEXT,

    CONSTRAINT "T_Auxiliares_pkey" PRIMARY KEY ("DNI_Auxiliar")
);

-- CreateTable
CREATE TABLE "T_Control_Entrada_Mensual_Auxiliar" (
    "Id_C_E_M_P_Auxiliar" SERIAL NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Entradas" JSONB NOT NULL,
    "DNI_Auxiliar" VARCHAR(8) NOT NULL,

    CONSTRAINT "T_Control_Entrada_Mensual_Auxiliar_pkey" PRIMARY KEY ("Id_C_E_M_P_Auxiliar")
);

-- CreateTable
CREATE TABLE "T_Control_Salida_Mensual_Auxiliar" (
    "Id_C_E_M_P_Auxiliar" SERIAL NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Salidas" JSONB NOT NULL,
    "DNI_Auxiliar" VARCHAR(8) NOT NULL,

    CONSTRAINT "T_Control_Salida_Mensual_Auxiliar_pkey" PRIMARY KEY ("Id_C_E_M_P_Auxiliar")
);

-- CreateTable
CREATE TABLE "T_Personal_Administrativo" (
    "DNI_Personal_Administrativo" VARCHAR(8) NOT NULL,
    "Nombres" VARCHAR(60) NOT NULL,
    "Apellidos" VARCHAR(60) NOT NULL,
    "Genero" VARCHAR(1) NOT NULL,
    "Nombre_Usuario" VARCHAR(40) NOT NULL,
    "Estado" BOOLEAN NOT NULL,
    "Celular" VARCHAR(9) NOT NULL,
    "Contraseña" TEXT NOT NULL,
    "Google_Drive_Foto_ID" TEXT,
    "Horario_Laboral_Entrada" TIME NOT NULL,
    "Horario_Laboral_Salida" TIME NOT NULL,
    "Cargo" VARCHAR(75) NOT NULL,

    CONSTRAINT "T_Personal_Administrativo_pkey" PRIMARY KEY ("DNI_Personal_Administrativo")
);

-- CreateTable
CREATE TABLE "T_Control_Entrada_Mensual_Personal_Administrativo" (
    "Id_C_E_M_P_Administrativo" SERIAL NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Entradas" JSONB NOT NULL,
    "DNI_Personal_Administrativo" VARCHAR(8) NOT NULL,

    CONSTRAINT "T_Control_Entrada_Mensual_Personal_Administrativo_pkey" PRIMARY KEY ("Id_C_E_M_P_Administrativo")
);

-- CreateTable
CREATE TABLE "T_Control_Salida_Mensual_Personal_Administrativo" (
    "Id_C_E_M_P_Administrativo" SERIAL NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Salidas" JSONB NOT NULL,
    "DNI_Personal_Administrativo" VARCHAR(8) NOT NULL,

    CONSTRAINT "T_Control_Salida_Mensual_Personal_Administrativo_pkey" PRIMARY KEY ("Id_C_E_M_P_Administrativo")
);

-- CreateTable
CREATE TABLE "T_Bloqueo_Roles" (
    "Id_Bloqueo_Rol" SERIAL NOT NULL,
    "Rol" VARCHAR(2) NOT NULL,
    "Bloqueo_Total" BOOLEAN NOT NULL,
    "Timestamp_Desbloqueo" BIGINT NOT NULL,

    CONSTRAINT "T_Bloqueo_Roles_pkey" PRIMARY KEY ("Id_Bloqueo_Rol")
);

-- CreateTable
CREATE TABLE "T_Ajustes_Generales_Sistema" (
    "Id_Constante" SERIAL NOT NULL,
    "Nombre" VARCHAR(100) NOT NULL,
    "Valor" VARCHAR(30) NOT NULL,
    "Descripcion" TEXT NOT NULL,
    "Ultima_Modificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "T_Ajustes_Generales_Sistema_pkey" PRIMARY KEY ("Id_Constante")
);

-- CreateTable
CREATE TABLE "T_Horarios_Asistencia" (
    "Id_Horario" SERIAL NOT NULL,
    "Nombre" VARCHAR(100) NOT NULL,
    "Valor" TIME NOT NULL,
    "Descripcion" TEXT NOT NULL,
    "Ultima_Modificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "T_Horarios_Asistencia_pkey" PRIMARY KEY ("Id_Horario")
);

-- CreateTable
CREATE TABLE "T_Eventos" (
    "Id_Evento" SERIAL NOT NULL,
    "Nombre" VARCHAR(150) NOT NULL,
    "Fecha_Inicio" DATE NOT NULL,
    "Fecha_Conclusion" DATE NOT NULL,

    CONSTRAINT "T_Eventos_pkey" PRIMARY KEY ("Id_Evento")
);

-- CreateTable
CREATE TABLE "T_Registro_Fallos_Sistema" (
    "Id_Registro_Fallo_Sistema" SERIAL NOT NULL,
    "Fecha" DATE NOT NULL,
    "Componente" VARCHAR(50) NOT NULL,
    "Detalles" TEXT,

    CONSTRAINT "T_Registro_Fallos_Sistema_pkey" PRIMARY KEY ("Id_Registro_Fallo_Sistema")
);

-- CreateTable
CREATE TABLE "T_Codigos_OTP" (
    "Id_Codigo_OTP" SERIAL NOT NULL,
    "Codigo" VARCHAR(6) NOT NULL,
    "Fecha_Creacion" BIGINT NOT NULL,
    "Fecha_Expiracion" BIGINT NOT NULL,
    "Correo_Destino" VARCHAR(70) NOT NULL,
    "Rol_Usuario" VARCHAR(2) NOT NULL,
    "Id_Usuario" VARCHAR(20) NOT NULL,

    CONSTRAINT "T_Codigos_OTP_pkey" PRIMARY KEY ("Id_Codigo_OTP")
);

-- CreateTable
CREATE TABLE "T_A_E_P_1" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_P_1_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_A_E_P_2" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_P_2_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_A_E_P_3" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_P_3_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_A_E_P_4" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_P_4_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_A_E_P_5" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_P_5_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_A_E_P_6" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_P_6_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_A_E_S_1" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_S_1_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_A_E_S_2" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_S_2_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_A_E_S_3" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_S_3_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_A_E_S_4" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_S_4_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_A_E_S_5" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_S_5_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_Comunicados" (
    "Id_Comunicado" SERIAL NOT NULL,
    "Titulo" VARCHAR(150) NOT NULL,
    "Contenido" TEXT NOT NULL,
    "Fecha_Inicio" DATE NOT NULL,
    "Fecha_Conclusion" DATE NOT NULL,
    "Google_Drive_Imagen_ID" TEXT,

    CONSTRAINT "T_Comunicados_pkey" PRIMARY KEY ("Id_Comunicado")
);

-- CreateTable
CREATE TABLE "T_Ultima_Modificacion_Tablas" (
    "Nombre_Tabla" VARCHAR(100) NOT NULL,
    "Operacion" VARCHAR(20) NOT NULL,
    "Fecha_Modificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Usuario_Modificacion" VARCHAR(100),
    "Cantidad_Filas" INTEGER,

    CONSTRAINT "T_Ultima_Modificacion_Tablas_pkey" PRIMARY KEY ("Nombre_Tabla")
);

-- CreateTable
CREATE TABLE "T_Fechas_Importantes" (
    "Id_Fecha_Importante" SERIAL NOT NULL,
    "Nombre" VARCHAR(100) NOT NULL,
    "Valor" DATE NOT NULL,
    "Descripcion" TEXT,
    "Ultima_Modificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "T_Fechas_Importantes_pkey" PRIMARY KEY ("Id_Fecha_Importante")
);

-- CreateTable
CREATE TABLE "T_Archivos_Respaldo_Google_Drive" (
    "Id_Archivo_Respaldo" SERIAL NOT NULL,
    "Nombre_Archivo" VARCHAR(255) NOT NULL,
    "Google_Drive_Id" TEXT NOT NULL,
    "Descripcion" TEXT,
    "Ultima_Modificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "T_Archivos_Respaldo_Google_Drive_pkey" PRIMARY KEY ("Id_Archivo_Respaldo")
);

-- CreateTable
CREATE TABLE "T_Vacaciones_Interescolares" (
    "Id_Vacacion_Interescolar" SERIAL NOT NULL,
    "Fecha_Inicio" DATE NOT NULL,
    "Fecha_Conclusion" DATE NOT NULL,

    CONSTRAINT "T_Vacaciones_Interescolares_pkey" PRIMARY KEY ("Id_Vacacion_Interescolar")
);

-- CreateIndex
CREATE UNIQUE INDEX "T_Directivos_Nombre_Usuario_key" ON "T_Directivos"("Nombre_Usuario");

-- CreateIndex
CREATE UNIQUE INDEX "T_Responsables_Nombre_Usuario_key" ON "T_Responsables"("Nombre_Usuario");

-- CreateIndex
CREATE UNIQUE INDEX "T_Profesores_Primaria_Nombre_Usuario_key" ON "T_Profesores_Primaria"("Nombre_Usuario");

-- CreateIndex
CREATE UNIQUE INDEX "T_Profesores_Secundaria_Nombre_Usuario_key" ON "T_Profesores_Secundaria"("Nombre_Usuario");

-- CreateIndex
CREATE UNIQUE INDEX "T_Auxiliares_Nombre_Usuario_key" ON "T_Auxiliares"("Nombre_Usuario");

-- CreateIndex
CREATE UNIQUE INDEX "T_Personal_Administrativo_Nombre_Usuario_key" ON "T_Personal_Administrativo"("Nombre_Usuario");

-- CreateIndex
CREATE UNIQUE INDEX "T_Ajustes_Generales_Sistema_Nombre_key" ON "T_Ajustes_Generales_Sistema"("Nombre");

-- CreateIndex
CREATE UNIQUE INDEX "T_Horarios_Asistencia_Nombre_key" ON "T_Horarios_Asistencia"("Nombre");

-- CreateIndex
CREATE INDEX "T_A_E_P_1_DNI_Estudiante_idx" ON "T_A_E_P_1"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_P_1_Mes_idx" ON "T_A_E_P_1"("Mes");

-- CreateIndex
CREATE INDEX "T_A_E_P_2_DNI_Estudiante_idx" ON "T_A_E_P_2"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_P_2_Mes_idx" ON "T_A_E_P_2"("Mes");

-- CreateIndex
CREATE INDEX "T_A_E_P_3_DNI_Estudiante_idx" ON "T_A_E_P_3"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_P_3_Mes_idx" ON "T_A_E_P_3"("Mes");

-- CreateIndex
CREATE INDEX "T_A_E_P_4_DNI_Estudiante_idx" ON "T_A_E_P_4"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_P_4_Mes_idx" ON "T_A_E_P_4"("Mes");

-- CreateIndex
CREATE INDEX "T_A_E_P_5_DNI_Estudiante_idx" ON "T_A_E_P_5"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_P_5_Mes_idx" ON "T_A_E_P_5"("Mes");

-- CreateIndex
CREATE INDEX "T_A_E_P_6_DNI_Estudiante_idx" ON "T_A_E_P_6"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_P_6_Mes_idx" ON "T_A_E_P_6"("Mes");

-- CreateIndex
CREATE INDEX "T_A_E_S_1_DNI_Estudiante_idx" ON "T_A_E_S_1"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_S_1_Mes_idx" ON "T_A_E_S_1"("Mes");

-- CreateIndex
CREATE INDEX "T_A_E_S_2_DNI_Estudiante_idx" ON "T_A_E_S_2"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_S_2_Mes_idx" ON "T_A_E_S_2"("Mes");

-- CreateIndex
CREATE INDEX "T_A_E_S_3_DNI_Estudiante_idx" ON "T_A_E_S_3"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_S_3_Mes_idx" ON "T_A_E_S_3"("Mes");

-- CreateIndex
CREATE INDEX "T_A_E_S_4_DNI_Estudiante_idx" ON "T_A_E_S_4"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_S_4_Mes_idx" ON "T_A_E_S_4"("Mes");

-- CreateIndex
CREATE INDEX "T_A_E_S_5_DNI_Estudiante_idx" ON "T_A_E_S_5"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_S_5_Mes_idx" ON "T_A_E_S_5"("Mes");

-- CreateIndex
CREATE UNIQUE INDEX "T_Archivos_Respaldo_Google_Drive_Nombre_Archivo_key" ON "T_Archivos_Respaldo_Google_Drive"("Nombre_Archivo");

-- CreateIndex
CREATE UNIQUE INDEX "T_Archivos_Respaldo_Google_Drive_Google_Drive_Id_key" ON "T_Archivos_Respaldo_Google_Drive"("Google_Drive_Id");

-- AddForeignKey
ALTER TABLE "T_Estudiantes" ADD CONSTRAINT "T_Estudiantes_Id_Aula_fkey" FOREIGN KEY ("Id_Aula") REFERENCES "T_Aulas"("Id_Aula") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Relaciones_E_R" ADD CONSTRAINT "T_Relaciones_E_R_DNI_Responsable_fkey" FOREIGN KEY ("DNI_Responsable") REFERENCES "T_Responsables"("DNI_Responsable") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Relaciones_E_R" ADD CONSTRAINT "T_Relaciones_E_R_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Aulas" ADD CONSTRAINT "T_Aulas_DNI_Profesor_Primaria_fkey" FOREIGN KEY ("DNI_Profesor_Primaria") REFERENCES "T_Profesores_Primaria"("DNI_Profesor_Primaria") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Aulas" ADD CONSTRAINT "T_Aulas_DNI_Profesor_Secundaria_fkey" FOREIGN KEY ("DNI_Profesor_Secundaria") REFERENCES "T_Profesores_Secundaria"("DNI_Profesor_Secundaria") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Cursos_Horario" ADD CONSTRAINT "T_Cursos_Horario_DNI_Profesor_Secundaria_fkey" FOREIGN KEY ("DNI_Profesor_Secundaria") REFERENCES "T_Profesores_Secundaria"("DNI_Profesor_Secundaria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Cursos_Horario" ADD CONSTRAINT "T_Cursos_Horario_Id_Aula_Secundaria_fkey" FOREIGN KEY ("Id_Aula_Secundaria") REFERENCES "T_Aulas"("Id_Aula") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Control_Entrada_Mensual_Profesores_Primaria" ADD CONSTRAINT "T_Control_Entrada_Mensual_Profesores_Primaria_DNI_Profesor_fkey" FOREIGN KEY ("DNI_Profesor_Primaria") REFERENCES "T_Profesores_Primaria"("DNI_Profesor_Primaria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Control_Salida_Mensual_Profesores_Primaria" ADD CONSTRAINT "T_Control_Salida_Mensual_Profesores_Primaria_DNI_Profesor__fkey" FOREIGN KEY ("DNI_Profesor_Primaria") REFERENCES "T_Profesores_Primaria"("DNI_Profesor_Primaria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Control_Entrada_Mensual_Profesores_Secundaria" ADD CONSTRAINT "T_Control_Entrada_Mensual_Profesores_Secundaria_DNI_Profes_fkey" FOREIGN KEY ("DNI_Profesor_Secundaria") REFERENCES "T_Profesores_Secundaria"("DNI_Profesor_Secundaria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Control_Salida_Mensual_Profesores_Secundaria" ADD CONSTRAINT "T_Control_Salida_Mensual_Profesores_Secundaria_DNI_Profeso_fkey" FOREIGN KEY ("DNI_Profesor_Secundaria") REFERENCES "T_Profesores_Secundaria"("DNI_Profesor_Secundaria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Control_Entrada_Mensual_Auxiliar" ADD CONSTRAINT "T_Control_Entrada_Mensual_Auxiliar_DNI_Auxiliar_fkey" FOREIGN KEY ("DNI_Auxiliar") REFERENCES "T_Auxiliares"("DNI_Auxiliar") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Control_Salida_Mensual_Auxiliar" ADD CONSTRAINT "T_Control_Salida_Mensual_Auxiliar_DNI_Auxiliar_fkey" FOREIGN KEY ("DNI_Auxiliar") REFERENCES "T_Auxiliares"("DNI_Auxiliar") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Control_Entrada_Mensual_Personal_Administrativo" ADD CONSTRAINT "T_Control_Entrada_Mensual_Personal_Administrativo_DNI_Pers_fkey" FOREIGN KEY ("DNI_Personal_Administrativo") REFERENCES "T_Personal_Administrativo"("DNI_Personal_Administrativo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Control_Salida_Mensual_Personal_Administrativo" ADD CONSTRAINT "T_Control_Salida_Mensual_Personal_Administrativo_DNI_Perso_fkey" FOREIGN KEY ("DNI_Personal_Administrativo") REFERENCES "T_Personal_Administrativo"("DNI_Personal_Administrativo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_A_E_P_1" ADD CONSTRAINT "T_A_E_P_1_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_A_E_P_2" ADD CONSTRAINT "T_A_E_P_2_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_A_E_P_3" ADD CONSTRAINT "T_A_E_P_3_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_A_E_P_4" ADD CONSTRAINT "T_A_E_P_4_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_A_E_P_5" ADD CONSTRAINT "T_A_E_P_5_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_A_E_P_6" ADD CONSTRAINT "T_A_E_P_6_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_A_E_S_1" ADD CONSTRAINT "T_A_E_S_1_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_A_E_S_2" ADD CONSTRAINT "T_A_E_S_2_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_A_E_S_3" ADD CONSTRAINT "T_A_E_S_3_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_A_E_S_4" ADD CONSTRAINT "T_A_E_S_4_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_A_E_S_5" ADD CONSTRAINT "T_A_E_S_5_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;
