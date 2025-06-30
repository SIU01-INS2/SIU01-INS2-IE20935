"use client";

import React, { useState } from "react";
import Link from "next/link";
import CreacionVacacionInterEscolar from "@/components/modals/programacion/gestion-fechas-escolares/CreacionVacacionInterEscolar";
import ModificarVacacionesInterescolares from "@/components/modals/programacion/gestion-fechas-escolares/ModificarVacacionesInterescolares";
import EliminarVacacionesInterescolares from "@/components/modals/programacion/gestion-fechas-escolares/EliminarVacacionesInterescolares";
import ModificarSemanaGestionEscolar from "@/components/modals/programacion/gestion-fechas-escolares/ModificarSemanaGestionEscolar";
import ModificarInicioFinAñoEscolar from "@/components/modals/programacion/gestion-fechas-escolares/ModificarInicioFinAñoEscolar";
import BotonConIcono from "@/components/buttons/BotonConIcono";
import BasureroIcon from "@/components/icons/BasureroIcon";
import LapizIcon from "@/components/icons/LapizIcon";
import AgregarIcon from "@/components/icons/AgregarIcon";
import VolverIcon from "@/components/icons/VolverIcon";

const GestionFechasEscolares = () => {
  const [
    showCreacionVacacionInterescolarModal,
    setShowCreacionVacacionInterescolarModal,
  ] = useState(false);

  const [
    showModificarVacacionesInterescolares,
    setShowModificarVacacionesInterescolares,
  ] = useState(false);

  const [
    showElimiarVacacionesInterescolares,
    setShowElimiarVacacionesInterescolares,
  ] = useState(false);

  const [
    showModificarSemanaGestionEscolar,
    setShowModificarSemanaGestionEscolar,
  ] = useState(false);

  const [
    showModificarInicioFinAñoEscolar,
    setShowModificarInicioFinAñoEscolar,
  ] = useState(false);

  const fechasVacaciones = [
    { inicio: "21/07/2025 (Lunes)", fin: "01/08/2025 (Viernes)" },
    { inicio: "21/07/2025 (Lunes)", fin: "01/08/2025 (Viernes)" },
  ];

  const fechasGestion = [
    { inicio: "22/12/2025 (Lunes)", fin: "26/12/2025 (Viernes)" },
  ];

  return (
    <>
      {showCreacionVacacionInterescolarModal && (
        <CreacionVacacionInterEscolar
          eliminateModal={() => {
            setShowCreacionVacacionInterescolarModal(false);
          }}
        />
      )}

      {showModificarVacacionesInterescolares && (
        <ModificarVacacionesInterescolares
          eliminateModal={() => {
            setShowModificarVacacionesInterescolares(false);
          }}
        />
      )}

      {showElimiarVacacionesInterescolares && (
        <EliminarVacacionesInterescolares
          eliminateModal={() => {
            setShowElimiarVacacionesInterescolares(false);
          }}
        />
      )}

      {showModificarSemanaGestionEscolar && (
        <ModificarSemanaGestionEscolar
          eliminateModal={() => {
            setShowModificarSemanaGestionEscolar(false);
          }}
        />
      )}

      {showModificarInicioFinAñoEscolar && (
        <ModificarInicioFinAñoEscolar
          eliminateModal={() => {
            setShowModificarInicioFinAñoEscolar(false);
          }}
        />
      )}

      <div className="w-full h-full flex flex-col">
        {/* Título con botón volver */}
        <div className="flex-shrink-0 px-6 sxs-only:px-4 xs-only:px-4 sm-only:px-5 md-only:px-5 lg-only:px-4 xl-only:px-5 pt-8 sxs-only:pt-6 xs-only:pt-6 sm-only:pt-7 md-only:pt-7 lg-only:pt-6 xl-only:pt-7 pb-6 sxs-only:pb-4 xs-only:pb-5 sm-only:pb-5 md-only:pb-5 lg-only:pb-4 xl-only:pb-5">
          <div className="flex flex-wrap justify-between items-center gap-4 sxs-only:gap-3 xs-only:gap-3 sm-only:gap-3 md-only:gap-3 lg-only:gap-3 xl-only:gap-3">
            <h1 className="text-4xl sxs-only:text-xl xs-only:text-2xl sm-only:text-3xl md-only:text-3xl lg-only:text-2xl xl-only:text-3xl text-negro font-bold">
              Gestión de Fechas Escolares
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
            {/* Vacaciones Interescolares */}
            <section className="mb-12 sxs-only:mb-8 xs-only:mb-9 sm-only:mb-10 md-only:mb-10 lg-only:mb-8 xl-only:mb-10">
              <div className="flex flex-wrap justify-between items-center mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2 gap-4 sxs-only:gap-3 xs-only:gap-3 sm-only:gap-3 md-only:gap-3 lg-only:gap-3 xl-only:gap-3">
                <h2 className="text-2xl sxs-only:text-lg xs-only:text-xl sm-only:text-xl md-only:text-xl lg-only:text-lg xl-only:text-xl font-semibold text-negro">
                  Inicio y Fin de Vacaciones Interescolares
                </h2>
                <BotonConIcono
                  texto="Agregar"
                  IconTSX={
                    <AgregarIcon className="w-4 sxs-only:w-3 xs-only:w-3 sm-only:w-3 md-only:w-3 lg-only:w-3 xl-only:w-3 ml-2" />
                  }
                  className="bg-green-600 hover:bg-green-700 text-white px-5 sxs-only:px-4 xs-only:px-4 sm-only:px-4 md-only:px-4 lg-only:px-3 xl-only:px-4 py-2.5 sxs-only:py-2 xs-only:py-2 sm-only:py-2 md-only:py-2 lg-only:py-1.5 xl-only:py-2 rounded-md font-bold text-base sxs-only:text-sm xs-only:text-sm sm-only:text-sm md-only:text-sm lg-only:text-xs xl-only:text-sm transition"
                  onClick={() => {
                    setShowCreacionVacacionInterescolarModal(true);
                  }}
                />
              </div>
              <hr className="mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2 border-black" />
              <p className="text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base mb-2 sxs-only:mb-1 xs-only:mb-1 sm-only:mb-1 md-only:mb-1 lg-only:mb-1 xl-only:mb-1 text-gray-800">
                Establece las fechas que determinan el período de vacaciones
                interescolares otorgado por la institución, el cual puede
                comprender una o varias semanas.
              </p>
              <p className="text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base mb-5 sxs-only:mb-4 xs-only:mb-4 sm-only:mb-4 md-only:mb-4 lg-only:mb-3 xl-only:mb-4 text-gray-800">
                <span className="font-bold">IMPORTANTE:</span> La fecha de
                inicio solo puede modificarse hasta antes del día establecido
                como inicio de vacaciones. Este período es crucial para el
                sistema, ya que durante estas fechas se suspende automáticamente
                el registro de asistencia, evitando registros incorrectos
                durante los días de descanso institucional.
              </p>

              {fechasVacaciones.map((fecha, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 sxs-only:gap-3 xs-only:gap-3 sm-only:gap-3 md-only:gap-3 lg-only:gap-2 xl-only:gap-3 mb-5 sxs-only:mb-4 xs-only:mb-4 sm-only:mb-4 md-only:mb-4 lg-only:mb-3 xl-only:mb-4"
                >
                  <div className="flex flex-col sm:flex-row font-semibold text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base text-negro">
                    <span className="mb-1 sm:mb-0">
                      <span className="italic">Inicio:</span> {fecha.inicio}
                    </span>
                    <span className="sm:ml-6 sxs-only:sm:ml-4 xs-only:sm:ml-4 sm-only:sm:ml-5 md-only:sm:ml-5 lg-only:sm:ml-4 xl-only:sm:ml-5">
                      <span className="italic">Fin:</span> {fecha.fin}
                    </span>
                  </div>
                  <div className="flex gap-2 sxs-only:gap-1 xs-only:gap-1 sm-only:gap-1 md-only:gap-1 lg-only:gap-1 xl-only:gap-1 self-start">
                    <BotonConIcono
                      texto="Modificar"
                      IconTSX={
                        <LapizIcon className="w-4 sxs-only:w-3 xs-only:w-3 sm-only:w-3 md-only:w-3 lg-only:w-3 xl-only:w-3 ml-2" />
                      }
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 sxs-only:px-3 xs-only:px-3 sm-only:px-3 md-only:px-3 lg-only:px-2 xl-only:px-3 py-2 sxs-only:py-1.5 xs-only:py-1.5 sm-only:py-1.5 md-only:py-1.5 lg-only:py-1 xl-only:py-1.5 rounded-md flex items-center text-base sxs-only:text-sm xs-only:text-sm sm-only:text-sm md-only:text-sm lg-only:text-xs xl-only:text-sm transition"
                      onClick={() => {
                        setShowModificarVacacionesInterescolares(true);
                      }}
                    />
                    <BotonConIcono
                      texto="Eliminar"
                      IconTSX={
                        <BasureroIcon className="w-4 sxs-only:w-3 xs-only:w-3 sm-only:w-3 md-only:w-3 lg-only:w-3 xl-only:w-3 ml-2" />
                      }
                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 sxs-only:px-3 xs-only:px-3 sm-only:px-3 md-only:px-3 lg-only:px-2 xl-only:px-3 py-2 sxs-only:py-1.5 xs-only:py-1.5 sm-only:py-1.5 md-only:py-1.5 lg-only:py-1 xl-only:py-1.5 rounded-md text-base sxs-only:text-sm xs-only:text-sm sm-only:text-sm md-only:text-sm lg-only:text-xs xl-only:text-sm transition"
                      onClick={() => {
                        setShowElimiarVacacionesInterescolares(true);
                      }}
                    />
                  </div>
                </div>
              ))}
            </section>

            {/* Semana de Gestión Escolar */}
            <section className="mb-12 sxs-only:mb-8 xs-only:mb-9 sm-only:mb-10 md-only:mb-10 lg-only:mb-8 xl-only:mb-10">
              <h2 className="text-2xl sxs-only:text-lg xs-only:text-xl sm-only:text-xl md-only:text-xl lg-only:text-lg xl-only:text-xl font-semibold text-negro mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2">
                Inicio y Fin de Semana de Gestión Escolar
              </h2>
              <hr className="mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2 border-black" />
              <p className="text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base mb-2 sxs-only:mb-1 xs-only:mb-1 sm-only:mb-1 md-only:mb-1 lg-only:mb-1 xl-only:mb-1 text-gray-800">
                Establece las fechas correspondientes a la semana de gestión
                escolar, que se lleva a cabo una vez finalizado el año lectivo.
              </p>
              <p className="text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base mb-5 sxs-only:mb-4 xs-only:mb-4 sm-only:mb-4 md-only:mb-4 lg-only:mb-3 xl-only:mb-4 text-gray-800">
                <span className="font-bold">IMPORTANTE:</span> La fecha de
                inicio solo puede modificarse hasta antes del día establecido
                como comienzo de la semana de gestión. Este período es relevante
                para el sistema, ya que permite ejecutar tareas administrativas,
                de planificación y cierre sin afectar el registro de asistencia
                regular.
              </p>

              {fechasGestion.map((fecha, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 sxs-only:gap-3 xs-only:gap-3 sm-only:gap-3 md-only:gap-3 lg-only:gap-2 xl-only:gap-3 mb-5 sxs-only:mb-4 xs-only:mb-4 sm-only:mb-4 md-only:mb-4 lg-only:mb-3 xl-only:mb-4"
                >
                  <div className="flex flex-col sm:flex-row font-semibold text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base text-negro">
                    <span className="mb-1 sm:mb-0">
                      <span className="italic">Inicio:</span> {fecha.inicio}
                    </span>
                    <span className="sm:ml-6 sxs-only:sm:ml-4 xs-only:sm:ml-4 sm-only:sm:ml-5 md-only:sm:ml-5 lg-only:sm:ml-4 xl-only:sm:ml-5">
                      <span className="italic">Fin:</span> {fecha.fin}
                    </span>
                  </div>
                  <div className="self-start">
                    <BotonConIcono
                      texto="Modificar"
                      IconTSX={
                        <LapizIcon className="w-4 sxs-only:w-3 xs-only:w-3 sm-only:w-3 md-only:w-3 lg-only:w-3 xl-only:w-3 ml-2" />
                      }
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 sxs-only:px-3 xs-only:px-3 sm-only:px-3 md-only:px-3 lg-only:px-2 xl-only:px-3 py-2 sxs-only:py-1.5 xs-only:py-1.5 sm-only:py-1.5 md-only:py-1.5 lg-only:py-1 xl-only:py-1.5 rounded-md flex items-center text-base sxs-only:text-sm xs-only:text-sm sm-only:text-sm md-only:text-sm lg-only:text-xs xl-only:text-sm transition"
                      onClick={() => {
                        setShowModificarSemanaGestionEscolar(true);
                      }}
                    />
                  </div>
                </div>
              ))}
            </section>

            {/* Inicio y Fin de Año Escolar */}
            <section className="mb-12 sxs-only:mb-8 xs-only:mb-9 sm-only:mb-10 md-only:mb-10 lg-only:mb-8 xl-only:mb-10">
              <h2 className="text-2xl sxs-only:text-lg xs-only:text-xl sm-only:text-xl md-only:text-xl lg-only:text-lg xl-only:text-xl font-semibold text-negro mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2">
                Inicio y Fin de Año Escolar{" "}
              </h2>
              <hr className="mb-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2 border-black" />
              <p className="text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base mb-2 sxs-only:mb-1 xs-only:mb-1 sm-only:mb-1 md-only:mb-1 lg-only:mb-1 xl-only:mb-1 text-gray-800">
                Establece las fechas que determinan el período oficial de inicio
                y culminación del año escolar.h
              </p>
              <p className="text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base mb-5 sxs-only:mb-4 xs-only:mb-4 sm-only:mb-4 md-only:mb-4 lg-only:mb-3 xl-only:mb-4 text-gray-800">
                <span className="font-bold">IMPORTANTE:</span> La fecha de
                inicio solo puede modificarse hasta antes del día establecido
                como inicio de clases. Estas fechas son fundamentales para el
                sistema, ya que delimitan el periodo en el cual se habilita el
                registro de asistencia y otras funciones académicas dentro de la
                plataforma.
              </p>

              {fechasGestion.map((fecha, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 sxs-only:gap-3 xs-only:gap-3 sm-only:gap-3 md-only:gap-3 lg-only:gap-2 xl-only:gap-3 mb-5 sxs-only:mb-4 xs-only:mb-4 sm-only:mb-4 md-only:mb-4 lg-only:mb-3 xl-only:mb-4"
                >
                  <div className="flex flex-col sm:flex-row font-semibold text-lg sxs-only:text-sm xs-only:text-base sm-only:text-base md-only:text-base lg-only:text-sm xl-only:text-base text-negro">
                    <span className="mb-1 sm:mb-0">
                      <span className="italic">Inicio:</span> {fecha.inicio}
                    </span>
                    <span className="sm:ml-6 sxs-only:sm:ml-4 xs-only:sm:ml-4 sm-only:sm:ml-5 md-only:sm:ml-5 lg-only:sm:ml-4 xl-only:sm:ml-5">
                      <span className="italic">Fin:</span> {fecha.fin}
                    </span>
                  </div>
                  <div className="self-start">
                    <BotonConIcono
                      texto="Modificar"
                      IconTSX={
                        <LapizIcon className="w-4 sxs-only:w-3 xs-only:w-3 sm-only:w-3 md-only:w-3 lg-only:w-3 xl-only:w-3 ml-2" />
                      }
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 sxs-only:px-3 xs-only:px-3 sm-only:px-3 md-only:px-3 lg-only:px-2 xl-only:px-3 py-2 sxs-only:py-1.5 xs-only:py-1.5 sm-only:py-1.5 md-only:py-1.5 lg-only:py-1 xl-only:py-1.5 rounded-md flex items-center text-base sxs-only:text-sm xs-only:text-sm sm-only:text-sm md-only:text-sm lg-only:text-xs xl-only:text-sm transition"
                      onClick={() => {
                        setShowModificarInicioFinAñoEscolar(true);
                      }}
                    />
                  </div>
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default GestionFechasEscolares;
