import PrimariaIcon from "@/components/icons/PrimariaIcon";
import SecundariaIcon from "@/components/icons/SecundariaIcon";
import { Link } from "next-view-transitions";
import React from "react";

const ProfesoresMenu = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full py-3 px-11 sxs-only:px-3 xs-only:px-5 sm-only:px-7">

      <h1 className="text-[1.85rem] sxs-only:text-[1.45rem] xs-only:text-[1.55rem] font-semibold text-center leading-8">
        SELECCIONAR NIVEL EDUCATIVO
      </h1>

      <div className="flex gap-14 sxs-only:gap-7 xs-only:gap-9 sm-only:gap-11 mt-9 sxs-only:mt-5 xs-only:mt-7 sm-only:mt-8 w-full flex-wrap justify-center items-stretch sxs-only:flex-col xs-only:flex-col sm-only:flex-col">
        {/* Tarjeta de Primaria */}
        <Link
          href={"/profesores/primaria"}
          as={"/profesores/primaria"}
          className="flex flex-1 shadow-[0_0_7px_4px_rgba(0,0,0,0.17)] hover:shadow-[0_0_11px_7px_rgba(0,0,0,0.22)] transition-all duration-300 rounded-lg flex-col justify-center items-center gap-2 p-5 py-5 sxs-only:p-4 sxs-only:py-4 xs-only:p-4 xs-only:py-4 max-w-[min(22rem,80vw)] xl-only:max-w-[26rem] cursor-pointer hover:bg-gray-50"
        >
          <div className="h-[4.2rem] sxs-only:h-[3rem] xs-only:h-[3.5rem] xl-only:h-[4.7rem] flex items-center justify-center mt-1 mb-0">
            <div className="bg-gray-100 p-3 rounded-full flex items-center justify-center">
              <PrimariaIcon className="w-[2.5rem]" />
            </div>
          </div>

          <h2 className="text-center font-semibold text-[1.15rem] sxs-only:text-[0.95rem] xs-only:text-[1rem] xl-only:text-[1.25rem] -mt-1 mb-0">
            Primaria
          </h2>

          <p className="text-[0.82rem] sxs-only:text-[0.72rem] xs-only:text-[0.77rem] xl-only:text-[0.92rem] flex-1 flex items-center justify-center leading-normal sxs-only:leading-tight xs-only:leading-snug mt-0">
            Gestión básica de profesores de nivel primario que permite registrar
            nuevos docentes, modificar sus datos personales y dar de baja
            profesores. Cada profesor será asignado a un aula específica que
            tendrá a su cargo durante todo el año escolar, siendo el único
            encargado de dicha aula.
          </p>
        </Link>

        {/* Tarjeta de Secundaria */}
        <Link
          href={"/profesores/secundaria"}
          as={"/profesores/secundaria"}
          className="flex flex-1 shadow-[0_0_7px_4px_rgba(0,0,0,0.17)] hover:shadow-[0_0_11px_7px_rgba(0,0,0,0.22)] transition-all duration-300 rounded-lg flex-col justify-center items-center gap-2 p-5 py-5 sxs-only:p-4 sxs-only:py-4 xs-only:p-4 xs-only:py-4 max-w-[min(22rem,80vw)] xl-only:max-w-[26rem] cursor-pointer hover:bg-gray-50"
        >
          <div className="h-[4.2rem] sxs-only:h-[3rem] xs-only:h-[3.5rem] xl-only:h-[4.7rem] flex items-center justify-center mt-1 mb-0">
            <div className="bg-gray-100 p-3 rounded-full flex items-center justify-center">
              <SecundariaIcon className="w-[2.5rem]" />
            </div>
          </div>

          <h2 className="text-center font-semibold text-[1.15rem] sxs-only:text-[0.95rem] xs-only:text-[1rem] xl-only:text-[1.25rem] -mt-1 mb-0">
            Secundaria
          </h2>

          <p className="text-[0.82rem] sxs-only:text-[0.72rem] xs-only:text-[0.77rem] xl-only:text-[0.92rem] flex-1 flex items-center justify-center leading-normal sxs-only:leading-tight xs-only:leading-snug mt-0">
            Administración de profesores de nivel secundario donde se pueden
            registrar nuevos docentes, actualizar sus datos personales y dar de
            baja. Cada profesor tiene un horario semanal que indica los cursos
            que dictará en diferentes aulas de este nivel. Adicionalmente,
            algunos profesores podrán ser designados como tutores de aulas
            específicas, asumiendo responsabilidades adicionales.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default ProfesoresMenu;
