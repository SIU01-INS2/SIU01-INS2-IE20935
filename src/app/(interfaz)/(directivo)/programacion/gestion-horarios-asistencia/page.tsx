"use client";
import React, { useState } from "react";
import Link from "next/link";
import BotonConIcono from "@/components/buttons/BotonConIcono";
import LapizIcon from "@/components/icons/LapizIcon";
import ModificarRegistroPrimaria from "@/components/modals/programacion/gestion-horarios-asistencia/ModificarRegistroPrimaria";
import ModificarRegistroSecundaria from "@/components/modals/programacion/gestion-horarios-asistencia/ModificarRegistroSecundaria";
import VolverIcon from "@/components/icons/VolverIcon";

const GestionHorariosAsistenciaEscolares = () => {
  const horarioGestion = [{ inicio: "7:45am", fin: "8:30am" }];

  const [showModificarRegistroPrimaria, setShowModificarRegistroPrimaria] =
    useState(false);

  const [showModificarRegistroSecundaria, setShowModificarRegistroSecundaria] =
    useState(false);

  return (
    <>
      {showModificarRegistroPrimaria && (
        <ModificarRegistroPrimaria
          eliminateModal={() => {
            setShowModificarRegistroPrimaria(false);
          }}
        />
      )}

      {showModificarRegistroSecundaria && (
        <ModificarRegistroSecundaria
          eliminateModal={() => {
            setShowModificarRegistroSecundaria(false);
          }}
        />
      )}

      <div className="w-full h-full flex flex-col">
        {/* Título con botón volver */}
        <div className="flex-shrink-0 px-6 sxs-only:px-4 xs-only:px-4 sm-only:px-5 md-only:px-5 lg-only:px-4 xl-only:px-5 pt-8 sxs-only:pt-6 xs-only:pt-6 sm-only:pt-7 md-only:pt-7 lg-only:pt-6 xl-only:pt-7 pb-6 sxs-only:pb-4 xs-only:pb-5 sm-only:pb-5 md-only:pb-5 lg-only:pb-4 xl-only:pb-5">
          <div className="flex flex-wrap justify-between items-center gap-4 sxs-only:gap-3 xs-only:gap-3 sm-only:gap-3 md-only:gap-3 lg-only:gap-3 xl-only:gap-3">
            <h1 className="text-4xl sxs-only:text-xl xs-only:text-2xl sm-only:text-3xl md-only:text-3xl lg-only:text-2xl xl-only:text-3xl text-negro font-bold">
              Gestión de Horarios de Asistencia
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
            {/* Asistencia Primaria */}
            <section className="mb-12 sxs-only:mb-8 xs-only:mb-9 sm-only:mb-10 md-only:mb-10 lg-only:mb-8 xl-only:mb-10">
              <h2 className="text-2xl sxs-only:text-lg xs-only:text-xl sm-only:text-xl md-only:text-xl lg-only:text-lg xl-only:text-xl font-semibold text-negro mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2">
                Horario de Registro de Asistencia de Estudiantes de Primaria
              </h2>
              <hr className="mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2 border-black" />
              <p className="text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base mb-2 sxs-only:mb-1 xs-only:mb-1 sm-only:mb-1 md-only:mb-1 lg-only:mb-1 xl-only:mb-1 text-gray-800">
                Configura las horas que delimitan el periodo diario para el
                registro de asistencia en nivel Primaria durante los días
                escolares (lunes a viernes). Durante este periodo, los
                profesores podrán registrar la asistencia únicamente de los
                estudiantes de sus aulas asignadas. Fuera de este horario, los
                registros de asistencia no podrán ser modificados.
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
                      setShowModificarRegistroPrimaria(true);
                    }}
                  />
                </div>
              ))}
            </section>

            {/* Asistencia Secundaria*/}
            <section className="mb-12 sxs-only:mb-8 xs-only:mb-9 sm-only:mb-10 md-only:mb-10 lg-only:mb-8 xl-only:mb-10">
              <h2 className="text-2xl sxs-only:text-lg xs-only:text-xl sm-only:text-xl md-only:text-xl lg-only:text-lg xl-only:text-xl font-semibold text-negro mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2">
                Horario de Registro de Asistencia de Estudiantes de Secundaria
              </h2>
              <hr className="mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2 border-black" />
              <p className="text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base mb-2 sxs-only:mb-1 xs-only:mb-1 sm-only:mb-1 md-only:mb-1 lg-only:mb-1 xl-only:mb-1 text-gray-800">
                Configura las horas que delimitan el periodo diario para el
                registro de asistencia en nivel Secundaria durante los días
                escolares (lunes a viernes). Durante este periodo, los
                profesores podrán registrar la asistencia únicamente de los
                estudiantes de sus aulas asignadas. Fuera de este horario, los
                registros de asistencia no podrán ser modificados.
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
                      setShowModificarRegistroSecundaria(true);
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

export default GestionHorariosAsistenciaEscolares;
