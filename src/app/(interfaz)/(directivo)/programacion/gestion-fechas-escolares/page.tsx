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
        <div className="flex-shrink-0 px-6 pt-8 pb-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h1 className="text-4xl sxs-only:text-2xl xs-only:text-3xl sm-only:text-3xl md-only:text-4xl text-negro font-bold">
              Gestión de Fechas Escolares
            </h1>
            <Link href="/programacion">
              <button className="bg-negro text-white px-5 py-2.5 rounded-md flex items-center hover:opacity-90 transition text-[1rem] font-medium">
                <span className="mr-2">←</span> Volver
              </button>
            </Link>
          </div>
        </div>

        {/* Contenido alineado a la izquierda */}
        <div className="flex-1 flex justify-start px-6 py-4 overflow-y-auto">
          <div className="w-full max-w-5xl">
            {/* Vacaciones Interescolares */}
            <section className="mb-12">
              <div className="flex flex-wrap justify-between items-center mb-3 gap-4">
                <h2 className="text-2xl font-semibold text-negro">
                  Inicio y Fin de Vacaciones Interescolares
                </h2>
                <BotonConIcono
                  texto="Agregar"
                  IconTSX={<AgregarIcon className="w-[1rem] ml-2" />}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-md font-bold text-[1rem] transition"
                  onClick={() => {
                    setShowCreacionVacacionInterescolarModal(true);
                  }}
                />
              </div>
              <hr className="mb-3 border-black" />
              <p className="text-[1.05rem] mb-2 text-gray-800">
                Establece las fechas que determinan el período de vacaciones
                interescolares otorgado por la institución, el cual puede
                comprender una o varias semanas.
              </p>
              <p className="text-[1.05rem] mb-5 text-gray-800">
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
                  className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 mb-5"
                >
                  <div className="flex flex-col sm:flex-row font-semibold text-[1.05rem] text-negro">
                    <span className="mb-1 sm:mb-0">
                      <span className="italic">Inicio:</span> {fecha.inicio}
                    </span>
                    <span className="sm:ml-6">
                      <span className="italic">Fin:</span> {fecha.fin}
                    </span>
                  </div>
                  <div className="flex gap-2 self-start">
                    <BotonConIcono
                      texto="Modificar"
                      IconTSX={<LapizIcon className="w-[1rem] ml-2" />}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 py-2 rounded-md flex items-center text-[0.95rem] transition"
                      onClick={() => {
                        setShowModificarVacacionesInterescolares(true);
                      }}
                    />
                    <BotonConIcono
                      texto="Eliminar"
                      IconTSX={<BasureroIcon className="w-[1rem] ml-2" />}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-md text-[0.95rem] transition"
                      onClick={() => {
                        setShowElimiarVacacionesInterescolares(true);
                      }}
                    />
                  </div>
                </div>
              ))}
            </section>

            {/* Semana de Gestión Escolar */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-negro mb-3">
                Inicio y Fin de Semana de Gestión Escolar
              </h2>
              <hr className="mb-3 border-black" />
              <p className="text-[1.05rem] mb-2 text-gray-800">
                Establece las fechas correspondientes a la semana de gestión
                escolar, que se lleva a cabo una vez finalizado el año lectivo.
              </p>
              <p className="text-[1.05rem] mb-5 text-gray-800">
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
                  className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 mb-5"
                >
                  <div className="flex flex-col sm:flex-row font-semibold text-[1.05rem] text-negro">
                    <span className="mb-1 sm:mb-0">
                      <span className="italic">Inicio:</span> {fecha.inicio}
                    </span>
                    <span className="sm:ml-6">
                      <span className="italic">Fin:</span> {fecha.fin}
                    </span>
                  </div>
                  <div className="self-start">
                  <BotonConIcono
                      texto="Modificar"
                      IconTSX={<LapizIcon className="w-[1rem] ml-2" />}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 py-2 rounded-md flex items-center text-[0.95rem] transition"
                      onClick={() => {
                        setShowModificarSemanaGestionEscolar(true);
                      }}
                    />
                  </div>
                </div>
              ))}
            </section>

            {/* Inicio y Fin de Año Escolar */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-negro mb-3">
                Inicio y Fin de Año Escolar{" "}
              </h2>
              <hr className="mb-3 border-black" />
              <p className="text-[1.05rem] mb-2 text-gray-800">
                Establece las fechas que determinan el período oficial de inicio
                y culminación del año escolar.h
              </p>
              <p className="text-[1.05rem] mb-5 text-gray-800">
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
                  className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 mb-5"
                >
                  <div className="flex flex-col sm:flex-row font-semibold text-[1.05rem] text-negro">
                    <span className="mb-1 sm:mb-0">
                      <span className="italic">Inicio:</span> {fecha.inicio}
                    </span>
                    <span className="sm:ml-6">
                      <span className="italic">Fin:</span> {fecha.fin}
                    </span>
                    </div>
                  <div className="self-start">
                  <BotonConIcono
                      texto="Modificar"
                      IconTSX={<LapizIcon className="w-[1rem] ml-2" />}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 py-2 rounded-md flex items-center text-[0.95rem] transition"
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
