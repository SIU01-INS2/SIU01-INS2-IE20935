"use client";
import React, { useState } from "react";
import Link from "next/link";
import BotonConIcono from "@/components/buttons/BotonConIcono";
import LapizIcon from "@/components/icons/LapizIcon";
import ModificarRegistroPrimaria from "@/components/modals/programacion/gestion-horarios-asistencia/ModificarRegistroPrimaria";
import ModificarRegistroSecundaria from "@/components/modals/programacion/gestion-horarios-asistencia/ModificarRegistroSecundaria";

const GestionFechasEscolares = () => {
  const horarioGestion = [
    { inicio: "7:45am", fin: "8:30am" },
  ];

  const [
      showModificarRegistroPrimaria,
      setShowModificarRegistroPrimaria,
    ] = useState(false);
  
  const [
      showModificarRegistroSecundaria,
      setShowModificarRegistroSecundaria,
    ] = useState(false);

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
      <div className="flex-shrink-0 px-6 pt-8 pb-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-4xl sxs-only:text-2xl xs-only:text-3xl sm-only:text-3xl md-only:text-4xl text-negro font-bold">Gestión de Horarios de Asistencia</h1>
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

          {/* Asistencia Primaria */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-negro mb-3">Horario de Registro de Asistencia de Estudiantes de Primaria</h2>
            <hr className="mb-3 border-black" />
            <p className="text-[1.05rem] mb-2 text-gray-800">
              Configura las horas que delimitan el periodo diario para el registro de asistencia en nivel Primaria durante los días escolares (lunes a viernes). Durante este periodo, los profesores podrán registrar la asistencia únicamente de los estudiantes de sus aulas asignadas. Fuera de este horario, los registros de asistencia no podrán ser modificados.
            </p><br></br>

            {horarioGestion.map((horario, index) => (
              <div key={index} className="flex flex-wrap items-center gap-4 mb-5">
                <p className="font-semibold text-[1.05rem] text-negro">
                  <span className="italic">Inicio:</span> {horario.inicio}
                  <span className="italic ml-6">Fin:</span> {horario.fin}
                </p>
                <BotonConIcono
                      texto="Modificar"
                      IconTSX={<LapizIcon className="w-[1rem] ml-2" />}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 py-2 rounded-md flex items-center text-[0.95rem] transition"
                      onClick={() => {
                        setShowModificarRegistroPrimaria(true);
                      }}
                />
              </div>
            ))}
          </section>

          {/* Asistencia Secundaria*/}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-negro mb-3">Horario de Registro de Asistencia de Estudiantes de Secundaria</h2>
            <hr className="mb-3 border-black" />
            <p className="text-[1.05rem] mb-2 text-gray-800">
              Configura las horas que delimitan el periodo diario para el registro de asistencia en nivel Secundaria durante los días escolares (lunes a viernes). Durante este periodo, los profesores podrán registrar la asistencia únicamente de los estudiantes de sus aulas asignadas. Fuera de este horario, los registros de asistencia no podrán ser modificados.
            </p><br></br>
            {horarioGestion.map((horario, index) => (
              <div key={index} className="flex flex-wrap items-center gap-4 mb-5">
                <p className="font-semibold text-[1.05rem] text-negro">
                  <span className="italic">Inicio:</span> {horario.inicio}
                  <span className="italic ml-6">Fin:</span> {horario.fin}
                </p>
                <BotonConIcono
                      texto="Modificar"
                      IconTSX={<LapizIcon className="w-[1rem] ml-2" />}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 py-2 rounded-md flex items-center text-[0.95rem] transition"
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

export default GestionFechasEscolares;