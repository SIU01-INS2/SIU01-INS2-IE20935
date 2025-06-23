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

const GestionFechasEscolares = () => {
  const horarioGestion = [
    { inicio: "7:45am", fin: "8:30am" },
  ];

  const [
        showModificarRegistroAsistencia,
        setShowModificarRegistroAsistencia,
      ] = useState(false);
    
  const [
        showModificarProfesoresPrimaria,
        setShowModificarProfesoresPrimaria,
      ] = useState(false);
    
  const [
        showModificarProfesoresSecundaria,
        setShowModificarProfesoresSecundaria,
      ] = useState(false);
  
  const [
        showModificarHorarioAuxiliar,
        setShowModificarHorarioAuxiliar,
      ] = useState(false);

  const [
        showModificarPersonalVacaciones,
        setShowModificarPersonalVacaciones,
      ] = useState(false);
  
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
        <div className="flex-shrink-0 px-6 pt-8 pb-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h1 className="text-4xl sxs-only:text-2xl xs-only:text-3xl sm-only:text-3xl md-only:text-4xl text-negro font-bold">Gestión de Horarios Laborales</h1>
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

            {/*Registro Asistencia*/}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-negro mb-3">Horario Total de Registro de Asistencia</h2>
              <hr className="mb-3 border-black" />
              <p className="text-[1.05rem] mb-2 text-gray-800">
                Configura el inicio y fin del periodo en el que se habilita la toma de asistencia dentro del sistema. Este horario determina el tiempo durante el cual los usuarios autorizados pueden registrar la asistencia de los estudiantes en la plataforma.
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
                          setShowModificarRegistroAsistencia(true);
                        }}
                  />
                </div>
              ))}
            </section>

            {/*Profesores de Primaria*/}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-negro mb-3">Horario Laboral de los Profesores de Primaria</h2>
              <hr className="mb-3 border-black" />
              <p className="text-[1.05rem] mb-2 text-gray-800">
                Configura el inicio y fin de la jornada laboral de los profesores de nivel Secundaria durante los días escolares (lunes a viernes). Este horario define el tiempo en el que los docentes deben cumplir con sus actividades dentro de la institución educativa.
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
                          setShowModificarProfesoresPrimaria(true);
                        }}
                  />
                </div>
              ))}
            </section>

            {/*Profesores de Secundaria*/}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-negro mb-3">Horario Laboral de los Profesores de Secundaria</h2>
              <hr className="mb-3 border-black" />
              <p className="text-[1.05rem] mb-2 text-gray-800">
                Configura el inicio y fin de la jornada laboral de los profesores de nivel Secundaria durante los días escolares (lunes a viernes). Este horario define el tiempo en el que los docentes deben cumplir con sus actividades dentro de la institución educativa.
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
                          setShowModificarProfesoresSecundaria(true);
                        }}
                  />
                </div>
              ))}
            </section>

            {/*Auxiliares*/}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-negro mb-3">Horario Laboral de los Auxiliares</h2>
              <hr className="mb-3 border-black" />
              <p className="text-[1.05rem] mb-2 text-gray-800">
                Configura el inicio y fin de la jornada laboral del auxiliar durante los días escolares (lunes a viernes). Este horario define el tiempo en el que el auxiliar debe cumplir con sus funciones dentro de la institución educativa.
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
                          setShowModificarHorarioAuxiliar(true);
                        }}
                  />
                </div>
              ))}
            </section>

            {/*Vacaciones Interescolares*/}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-negro mb-3">Horario Laboral para el Personal durante Vacaciones Interescolares</h2>
              <hr className="mb-3 border-black" />
              <p className="text-[1.05rem] mb-2 text-gray-800">
                Configura el inicio y fin de la jornada laboral del personal durante las semanas de vacaciones interescuelares establecidas por la institución. Este horario define el tiempo reducido o ajustado en el que el personal debe cumplir con sus funciones dentro del colegio durante este periodo especial.
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
                          setShowModificarPersonalVacaciones(true);
                        }}
                  />
                </div>
              ))}
            </section>

            {/*Semana de Gestión*/}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-negro mb-3">Horario Laboral para el Personal durante la Semana de Gestión</h2>
              <hr className="mb-3 border-black" />
              <p className="text-[1.05rem] mb-2 text-gray-800">
                Configura el inicio y fin de la jornada laboral del personal durante la semana de gestión, que se realiza después del cierre del año lectivo. Este horario permite organizar las actividades administrativas, de planificación o cierre de año, según lo establecido por la institución educativa.
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

export default GestionFechasEscolares;
