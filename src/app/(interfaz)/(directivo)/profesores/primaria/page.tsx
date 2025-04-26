"use client";
import PrimariaIcon from "@/components/icons/PrimariaIcon";
import Breadcrumb from "@/components/shared/Breadcrumb";
import Switch from "@/components/shared/Switch";
import React, { useRef } from "react";

const ProfesoresPrimaria = () => {
  const switchRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full min-h-full">
      <Breadcrumb
        elements={[
          { Ruta: "/profesores", Texto: "Profesores" },
          { Ruta: "", Texto: "Primaria" },
        ]}
      />
      <h1 className=" text-[2rem] flex items-center -border-2 gap-3 w-max justify-center font-semibold text-center leading-8 sxs-only:text-[1.55rem] xs-only:text-[1.65rem] sm-only:text-[1.75rem] flex-wrap my-4">
        BUSCAR PROFESORES <PrimariaIcon className="w-[2.7rem] mt-[-0.7rem]" />
      </h1>
      {/* Contenedor de Filtros */}
      <form className="flex gap-4 w-full flex-wrap mt-7 ">
        <label className="flex font-medium text-[1rem] gap-3 items-center">
          DNI:
          <input
            type="text"
            id="dni"
            minLength={8}
            maxLength={8}
            pattern="[0-9]{8}"
            title="DNI debe contener 8 dígitos numéricos"
            onKeyDown={(event) => {
              return /[0-9]/.test(event.key);
            }}
            className="w-[min(80vw,6.5rem)]  border-2 border-color-interfaz rounded-[8px] -h-[3rem] px-2 py-1 font-normal"
          />
        </label>
        <label className="flex font-medium text-[1rem] gap-3 items-center">
          Nombres:
          <input
            type="text"
            className="w-[min(80vw,10rem)] border-2 border-color-interfaz rounded-[8px] -h-[3rem] px-2 py-1 font-normal"
          />
        </label>
        <label className="flex font-medium text-[1rem]  gap-3 items-center">
          Apellidos:
          <input
            type="text"
            className="w-[min(80vw,10rem)] border-2 border-color-interfaz rounded-[8px] -h-[3rem] px-2 py-1 font-normal"
          />
        </label>

        <Switch
          activeColor="bg-color-interfaz"
          ref={switchRef}
          label="Sin Aula"
          toggleSize="md"
          labelClassName="text-[1rem] font-medium"
        />
      </form>
    </div>
  );
};

export default ProfesoresPrimaria;
