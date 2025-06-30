"use client";
import React, { useState } from "react";
import Link from "next/link";
import BotonConIcono from "@/components/buttons/BotonConIcono";
import LapizIcon from "@/components/icons/LapizIcon";
import ModificarRegistroAsistencia from "@/components/modals/programacion/gestion-horarios-laborales/ModificarRegistroAsistencia";
import ModificarProfesoresPrimaria from "@/components/modals/programacion/gestion-horarios-laborales/ModificarProfesoresPrimaria";
import ModificarProfesoresSecundaria from "@/components/modals/programacion/gestion-horarios-laborales/ModificarProfesoresSecundaria";
import ModificarHorarioAuxiliar from "@/components/modals/programacion/gestion-horarios-laborales/ModificarHorarioAuxiliar";
import ModificarPersonalVacaciones from "@/components/modals/programacion/gestion-horarios-laborales/ModificarPersonalVacaciones";
import ModificarPersonalSemanaGestion from "@/components/modals/programacion/gestion-horarios-laborales/ModificarPersonalSemanaGestion";
import VolverIcon from "@/components/icons/VolverIcon";

const GestionHorariosLaborales = () => {
  const horarioGestion = [{ inicio: "7:45am", fin: "8:30am" }];

  const [showModificarRegistroAsistencia, setShowModificarRegistroAsistencia] =
    useState(false);

  const [showModificarProfesoresPrimaria, setShowModificarProfesoresPrimaria] =
    useState(false);

  const [
    showModificarProfesoresSecundaria,
    setShowModificarProfesoresSecundaria,
  ] = useState(false);

  const [showModificarHorarioAuxiliar, setShowModificarHorarioAuxiliar] =
    useState(false);

  const [showModificarPersonalVacaciones, setShowModificarPersonalVacaciones] =
    useState(false);

  const [
    showModificarPersonalSemanaGestion,
    setShowModificarPersonalSemanaGestion,
  ] = useState(false);

  return (
    <>
      {showModificarRegistroAsistencia && (
        <ModificarRegistroAsistencia
          eliminateModal={() => {
            setShowModificarRegistroAsistencia(false);
          }}
        />
      )}

      {showModificarProfesoresPrimaria && (
        <ModificarProfesoresPrimaria
          eliminateModal={() => {
            setShowModificarProfesoresPrimaria(false);
          }}
        />
      )}

      {showModificarProfesoresSecundaria && (
        <ModificarProfesoresSecundaria
          eliminateModal={() => {
            setShowModificarProfesoresSecundaria(false);
          }}
        />
      )}

      {showModificarHorarioAuxiliar && (
        <ModificarHorarioAuxiliar
          eliminateModal={() => {
            setShowModificarHorarioAuxiliar(false);
          }}
        />
      )}

      {showModificarPersonalVacaciones && (
        <ModificarPersonalVacaciones
          eliminateModal={() => {
            setShowModificarPersonalVacaciones(false);
          }}
        />
      )}

      {showModificarPersonalSemanaGestion && (
        <ModificarPersonalSemanaGestion
          eliminateModal={() => {
            setShowModificarPersonalSemanaGestion(false);
          }}
        />
      )}

      <div className="w-full h-full flex flex-col">
        {/* Título con botón volver */}
        <div className="flex-shrink-0 px-6 sxs-only:px-4 xs-only:px-4 sm-only:px-5 md-only:px-5 lg-only:px-4 xl-only:px-5 pt-8 sxs-only:pt-6 xs-only:pt-6 sm-only:pt-7 md-only:pt-7 lg-only:pt-6 xl-only:pt-7 pb-6 sxs-only:pb-4 xs-only:pb-5 sm-only:pb-5 md-only:pb-5 lg-only:pb-4 xl-only:pb-5">
          <div className="flex flex-wrap justify-between items-center gap-4 sxs-only:gap-3 xs-only:gap-3 sm-only:gap-3 md-only:gap-3 lg-only:gap-3 xl-only:gap-3">
            <h1 className="text-4xl sxs-only:text-xl xs-only:text-2xl sm-only:text-3xl md-only:text-3xl lg-only:text-2xl xl-only:text-3xl text-negro font-bold">
              Gestión de Horarios Laborales
            </h1>
            <Link href="/programacion">
              <button className="bg-negro text-white px-5 sxs-only:px-4 xs-only:px-4 sm-only:px-4 md-only:px-4 lg-only:px-3 xl-only:px-4 py-2.5 sxs-only:py-2 xs-only:py-2 sm-only:py-2 md-only:py-2 lg-only:py-1.5 xl-only:py-2 rounded-md flex items-center hover:opacity-90 transition text-base sxs-only:text-sm xs-only:text-sm sm-only:text-sm md-only:text-sm lg-only:text-xs xl-only:text-sm font-medium gap-2">
                <VolverIcon className="w-5 sxs-only:w-4 xs-only:w-4 sm-only:w-4 md-only:w-4 lg-only:w-3 xl-only:w-4" />{" "}
                Volver
              </button>
            </Link>
          </div>
        </div>

        {/* Contenido alineado a la izquierda */}
        <div className="flex-1 flex justify-start px-6 sxs-only:px-4 xs-only:px-4 sm-only:px-5 md-only:px-5 lg-only:px-4 xl-only:px-5 py-4 sxs-only:py-3 xs-only:py-3 sm-only:py-3 md-only:py-3 lg-only:py-3 xl-only:py-3 overflow-y-auto">
          <div className="w-full max-w-5xl">
            {/*Registro Asistencia*/}
            <section className="mb-12 sxs-only:mb-8 xs-only:mb-9 sm-only:mb-10 md-only:mb-10 lg-only:mb-8 xl-only:mb-10">
              <h2 className="text-2xl sxs-only:text-lg xs-only:text-xl sm-only:text-xl md-only:text-xl lg-only:text-lg xl-only:text-xl font-semibold text-negro mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2">
                Horario Total de Registro de Asistencia
              </h2>
              <hr className="mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2 border-black" />
              <p className="text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base mb-2 sxs-only:mb-1 xs-only:mb-1 sm-only:mb-1 md-only:mb-1 lg-only:mb-1 xl-only:mb-1 text-gray-800">
                Configura el inicio y fin del periodo en el que se habilita la
                toma de asistencia dentro del sistema. Este horario determina el
                tiempo durante el cual los usuarios autorizados pueden registrar
                la asistencia de los estudiantes en la plataforma.
              </p>
              <br className="sxs-only:hidden xs-only:hidden sm-only:hidden md-only:hidden lg-only:hidden xl-only:block"></br>

              {horarioGestion.map((horario, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-4 sxs-only:gap-3 xs-only:gap-3 sm-only:gap-3 md-only:gap-3 lg-only:gap-2 xl-only:gap-3 mb-5 sxs-only:mb-4 xs-only:mb-4 sm-only:mb-4 md-only:mb-4 lg-only:mb-3 xl-only:mb-4"
                >
                  <p className="font-semibold text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base text-negro">
                    <span className="italic">Inicio:</span> {horario.inicio}
                    <span className="italic ml-6 sxs-only:ml-4 xs-only:ml-4 sm-only:ml-5 md-only:ml-5 lg-only:ml-4 xl-only:ml-5">
                      Fin:
                    </span>{" "}
                    {horario.fin}
                  </p>
                  <BotonConIcono
                    texto="Modificar"
                    IconTSX={
                      <LapizIcon className="w-4 sxs-only:w-3 xs-only:w-3 sm-only:w-3 md-only:w-3 lg-only:w-3 xl-only:w-3 ml-2" />
                    }
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 sxs-only:px-3 xs-only:px-3 sm-only:px-3 md-only:px-3 lg-only:px-2 xl-only:px-3 py-2 sxs-only:py-1.5 xs-only:py-1.5 sm-only:py-1.5 md-only:py-1.5 lg-only:py-1 xl-only:py-1.5 rounded-md flex items-center text-base sxs-only:text-sm xs-only:text-sm sm-only:text-sm md-only:text-sm lg-only:text-xs xl-only:text-sm transition"
                    onClick={() => {
                      setShowModificarRegistroAsistencia(true);
                    }}
                  />
                </div>
              ))}
            </section>

            {/*Profesores de Primaria*/}
            <section className="mb-12 sxs-only:mb-8 xs-only:mb-9 sm-only:mb-10 md-only:mb-10 lg-only:mb-8 xl-only:mb-10">
              <h2 className="text-2xl sxs-only:text-lg xs-only:text-xl sm-only:text-xl md-only:text-xl lg-only:text-lg xl-only:text-xl font-semibold text-negro mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2">
                Horario Laboral de los Profesores de Primaria
              </h2>
              <hr className="mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2 border-black" />
              <p className="text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base mb-2 sxs-only:mb-1 xs-only:mb-1 sm-only:mb-1 md-only:mb-1 lg-only:mb-1 xl-only:mb-1 text-gray-800">
                Configura el inicio y fin de la jornada laboral de los
                profesores de nivel Secundaria durante los días escolares (lunes
                a viernes). Este horario define el tiempo en el que los docentes
                deben cumplir con sus actividades dentro de la institución
                educativa.
              </p>
              <br className="sxs-only:hidden xs-only:hidden sm-only:hidden md-only:hidden lg-only:hidden xl-only:block"></br>
              {horarioGestion.map((horario, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-4 sxs-only:gap-3 xs-only:gap-3 sm-only:gap-3 md-only:gap-3 lg-only:gap-2 xl-only:gap-3 mb-5 sxs-only:mb-4 xs-only:mb-4 sm-only:mb-4 md-only:mb-4 lg-only:mb-3 xl-only:mb-4"
                >
                  <p className="font-semibold text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base text-negro">
                    <span className="italic">Inicio:</span> {horario.inicio}
                    <span className="italic ml-6 sxs-only:ml-4 xs-only:ml-4 sm-only:ml-5 md-only:ml-5 lg-only:ml-4 xl-only:ml-5">
                      Fin:
                    </span>{" "}
                    {horario.fin}
                  </p>
                  <BotonConIcono
                    texto="Modificar"
                    IconTSX={
                      <LapizIcon className="w-4 sxs-only:w-3 xs-only:w-3 sm-only:w-3 md-only:w-3 lg-only:w-3 xl-only:w-3 ml-2" />
                    }
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 sxs-only:px-3 xs-only:px-3 sm-only:px-3 md-only:px-3 lg-only:px-2 xl-only:px-3 py-2 sxs-only:py-1.5 xs-only:py-1.5 sm-only:py-1.5 md-only:py-1.5 lg-only:py-1 xl-only:py-1.5 rounded-md flex items-center text-base sxs-only:text-sm xs-only:text-sm sm-only:text-sm md-only:text-sm lg-only:text-xs xl-only:text-sm transition"
                    onClick={() => {
                      setShowModificarProfesoresPrimaria(true);
                    }}
                  />
                </div>
              ))}
            </section>

            {/*Profesores de Secundaria*/}
            <section className="mb-12 sxs-only:mb-8 xs-only:mb-9 sm-only:mb-10 md-only:mb-10 lg-only:mb-8 xl-only:mb-10">
              <h2 className="text-2xl sxs-only:text-lg xs-only:text-xl sm-only:text-xl md-only:text-xl lg-only:text-lg xl-only:text-xl font-semibold text-negro mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2">
                Horario Laboral de los Profesores de Secundaria
              </h2>
              <hr className="mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2 border-black" />
              <p className="text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base mb-2 sxs-only:mb-1 xs-only:mb-1 sm-only:mb-1 md-only:mb-1 lg-only:mb-1 xl-only:mb-1 text-gray-800">
                Configura el inicio y fin de la jornada laboral de los
                profesores de nivel Secundaria durante los días escolares (lunes
                a viernes). Este horario define el tiempo en el que los docentes
                deben cumplir con sus actividades dentro de la institución
                educativa.
              </p>
              <br className="sxs-only:hidden xs-only:hidden sm-only:hidden md-only:hidden lg-only:hidden xl-only:block"></br>

              {horarioGestion.map((horario, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-4 sxs-only:gap-3 xs-only:gap-3 sm-only:gap-3 md-only:gap-3 lg-only:gap-2 xl-only:gap-3 mb-5 sxs-only:mb-4 xs-only:mb-4 sm-only:mb-4 md-only:mb-4 lg-only:mb-3 xl-only:mb-4"
                >
                  <p className="font-semibold text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base text-negro">
                    <span className="italic">Inicio:</span> {horario.inicio}
                    <span className="italic ml-6 sxs-only:ml-4 xs-only:ml-4 sm-only:ml-5 md-only:ml-5 lg-only:ml-4 xl-only:ml-5">
                      Fin:
                    </span>{" "}
                    {horario.fin}
                  </p>
                  <BotonConIcono
                    texto="Modificar"
                    IconTSX={
                      <LapizIcon className="w-4 sxs-only:w-3 xs-only:w-3 sm-only:w-3 md-only:w-3 lg-only:w-3 xl-only:w-3 ml-2" />
                    }
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 sxs-only:px-3 xs-only:px-3 sm-only:px-3 md-only:px-3 lg-only:px-2 xl-only:px-3 py-2 sxs-only:py-1.5 xs-only:py-1.5 sm-only:py-1.5 md-only:py-1.5 lg-only:py-1 xl-only:py-1.5 rounded-md flex items-center text-base sxs-only:text-sm xs-only:text-sm sm-only:text-sm md-only:text-sm lg-only:text-xs xl-only:text-sm transition"
                    onClick={() => {
                      setShowModificarProfesoresSecundaria(true);
                    }}
                  />
                </div>
              ))}
            </section>

            {/*Auxiliares*/}
            <section className="mb-12 sxs-only:mb-8 xs-only:mb-9 sm-only:mb-10 md-only:mb-10 lg-only:mb-8 xl-only:mb-10">
              <h2 className="text-2xl sxs-only:text-lg xs-only:text-xl sm-only:text-xl md-only:text-xl lg-only:text-lg xl-only:text-xl font-semibold text-negro mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2">
                Horario Laboral de los Auxiliares
              </h2>
              <hr className="mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2 border-black" />
              <p className="text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base mb-2 sxs-only:mb-1 xs-only:mb-1 sm-only:mb-1 md-only:mb-1 lg-only:mb-1 xl-only:mb-1 text-gray-800">
                Configura el inicio y fin de la jornada laboral del auxiliar
                durante los días escolares (lunes a viernes). Este horario
                define el tiempo en el que el auxiliar debe cumplir con sus
                funciones dentro de la institución educativa.
              </p>
              <br className="sxs-only:hidden xs-only:hidden sm-only:hidden md-only:hidden lg-only:hidden xl-only:block"></br>

              {horarioGestion.map((horario, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-4 sxs-only:gap-3 xs-only:gap-3 sm-only:gap-3 md-only:gap-3 lg-only:gap-2 xl-only:gap-3 mb-5 sxs-only:mb-4 xs-only:mb-4 sm-only:mb-4 md-only:mb-4 lg-only:mb-3 xl-only:mb-4"
                >
                  <p className="font-semibold text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base text-negro">
                    <span className="italic">Inicio:</span> {horario.inicio}
                    <span className="italic ml-6 sxs-only:ml-4 xs-only:ml-4 sm-only:ml-5 md-only:ml-5 lg-only:ml-4 xl-only:ml-5">
                      Fin:
                    </span>{" "}
                    {horario.fin}
                  </p>
                  <BotonConIcono
                    texto="Modificar"
                    IconTSX={
                      <LapizIcon className="w-4 sxs-only:w-3 xs-only:w-3 sm-only:w-3 md-only:w-3 lg-only:w-3 xl-only:w-3 ml-2" />
                    }
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 sxs-only:px-3 xs-only:px-3 sm-only:px-3 md-only:px-3 lg-only:px-2 xl-only:px-3 py-2 sxs-only:py-1.5 xs-only:py-1.5 sm-only:py-1.5 md-only:py-1.5 lg-only:py-1 xl-only:py-1.5 rounded-md flex items-center text-base sxs-only:text-sm xs-only:text-sm sm-only:text-sm md-only:text-sm lg-only:text-xs xl-only:text-sm transition"
                    onClick={() => {
                      setShowModificarHorarioAuxiliar(true);
                    }}
                  />
                </div>
              ))}
            </section>

            {/*Vacaciones Interescolares*/}
            <section className="mb-12 sxs-only:mb-8 xs-only:mb-9 sm-only:mb-10 md-only:mb-10 lg-only:mb-8 xl-only:mb-10">
              <h2 className="text-2xl sxs-only:text-lg xs-only:text-xl sm-only:text-xl md-only:text-xl lg-only:text-lg xl-only:text-xl font-semibold text-negro mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2">
                Horario Laboral para el Personal durante Vacaciones
                Interescolares
              </h2>
              <hr className="mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2 border-black" />
              <p className="text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base mb-2 sxs-only:mb-1 xs-only:mb-1 sm-only:mb-1 md-only:mb-1 lg-only:mb-1 xl-only:mb-1 text-gray-800">
                Configura el inicio y fin de la jornada laboral del personal
                durante las semanas de vacaciones interescuelares establecidas
                por la institución. Este horario define el tiempo reducido o
                ajustado en el que el personal debe cumplir con sus funciones
                dentro del colegio durante este periodo especial.
              </p>
              <br className="sxs-only:hidden xs-only:hidden sm-only:hidden md-only:hidden lg-only:hidden xl-only:block"></br>

              {horarioGestion.map((horario, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-4 sxs-only:gap-3 xs-only:gap-3 sm-only:gap-3 md-only:gap-3 lg-only:gap-2 xl-only:gap-3 mb-5 sxs-only:mb-4 xs-only:mb-4 sm-only:mb-4 md-only:mb-4 lg-only:mb-3 xl-only:mb-4"
                >
                  <p className="font-semibold text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base text-negro">
                    <span className="italic">Inicio:</span> {horario.inicio}
                    <span className="italic ml-6 sxs-only:ml-4 xs-only:ml-4 sm-only:ml-5 md-only:ml-5 lg-only:ml-4 xl-only:ml-5">
                      Fin:
                    </span>{" "}
                    {horario.fin}
                  </p>
                  <BotonConIcono
                    texto="Modificar"
                    IconTSX={
                      <LapizIcon className="w-4 sxs-only:w-3 xs-only:w-3 sm-only:w-3 md-only:w-3 lg-only:w-3 xl-only:w-3 ml-2" />
                    }
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 sxs-only:px-3 xs-only:px-3 sm-only:px-3 md-only:px-3 lg-only:px-2 xl-only:px-3 py-2 sxs-only:py-1.5 xs-only:py-1.5 sm-only:py-1.5 md-only:py-1.5 lg-only:py-1 xl-only:py-1.5 rounded-md flex items-center text-base sxs-only:text-sm xs-only:text-sm sm-only:text-sm md-only:text-sm lg-only:text-xs xl-only:text-sm transition"
                    onClick={() => {
                      setShowModificarPersonalVacaciones(true);
                    }}
                  />
                </div>
              ))}
            </section>

            {/*Semana de Gestión*/}
            <section className="mb-12 sxs-only:mb-8 xs-only:mb-9 sm-only:mb-10 md-only:mb-10 lg-only:mb-8 xl-only:mb-10">
              <h2 className="text-2xl sxs-only:text-lg xs-only:text-xl sm-only:text-xl md-only:text-xl lg-only:text-lg xl-only:text-xl font-semibold text-negro mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2">
                Horario Laboral para el Personal durante la Semana de Gestión
              </h2>
              <hr className="mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2 border-black" />
              <p className="text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base mb-2 sxs-only:mb-1 xs-only:mb-1 sm-only:mb-1 md-only:mb-1 lg-only:mb-1 xl-only:mb-1 text-gray-800">
                Configura el inicio y fin de la jornada laboral del personal
                durante la semana de gestión, que se realiza después del cierre
                del año lectivo. Este horario permite organizar las actividades
                administrativas, de planificación o cierre de año, según lo
                establecido por la institución educativa.
              </p>
              <br className="sxs-only:hidden xs-only:hidden sm-only:hidden md-only:hidden lg-only:hidden xl-only:block"></br>

              {horarioGestion.map((horario, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-4 sxs-only:gap-3 xs-only:gap-3 sm-only:gap-3 md-only:gap-3 lg-only:gap-2 xl-only:gap-3 mb-5 sxs-only:mb-4 xs-only:mb-4 sm-only:mb-4 md-only:mb-4 lg-only:mb-3 xl-only:mb-4"
                >
                  <p className="font-semibold text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base text-negro">
                    <span className="italic">Inicio:</span> {horario.inicio}
                    <span className="italic ml-6 sxs-only:ml-4 xs-only:ml-4 sm-only:ml-5 md-only:ml-5 lg-only:ml-4 xl-only:ml-5">
                      Fin:
                    </span>{" "}
                    {horario.fin}
                  </p>
                  <BotonConIcono
                    texto="Modificar"
                    IconTSX={
                      <LapizIcon className="w-4 sxs-only:w-3 xs-only:w-3 sm-only:w-3 md-only:w-3 lg-only:w-3 xl-only:w-3 ml-2" />
                    }
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 sxs-only:px-3 xs-only:px-3 sm-only:px-3 md-only:px-3 lg-only:px-2 xl-only:px-3 py-2 sxs-only:py-1.5 xs-only:py-1.5 sm-only:py-1.5 md-only:py-1.5 lg-only:py-1 xl-only:py-1.5 rounded-md flex items-center text-base sxs-only:text-sm xs-only:text-sm sm-only:text-sm md-only:text-sm lg-only:text-xs xl-only:text-sm transition"
                    onClick={() => {
                      setShowModificarPersonalSemanaGestion(true);
                    }}
                  />
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default GestionHorariosLaborales;
