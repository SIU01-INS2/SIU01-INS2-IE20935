"use client";

import { useEffect, useState } from "react";
import { AuxiliarSinContraseña } from "../../../../interfaces/shared/apis/shared/others/types";
// import auxiliarLocal from "@/lib/utils/local/db/models/AuxiliarIDB";
import AuxiliardCard from "./_components/AuxiliarCard";
import ErrorMessage from "@/components/shared/errors/ErrorMessage";
import { ErrorResponseAPIBase } from "@/interfaces/shared/apis/types";

import Loader from "@/components/shared/loaders/Loader";
import { AuxiliaresIDB } from "@/lib/utils/local/db/models/AuxiliaresIDB";

const Auxiliares = () => {
  const [auxiliares, setAuxiliares] = useState<AuxiliarSinContraseña[]>();

  const [isSomethingLoading, setIsSomethingLoading] = useState(true);
  const [error, setError] = useState<ErrorResponseAPIBase | null>(null);

  useEffect(() => {
    const getAuxiliares = async () => {
      const auxiliares = await new AuxiliaresIDB(
        "API01",
        setIsSomethingLoading,
        setError
      ).getAll();

      setAuxiliares(auxiliares);
    };

    getAuxiliares();
  }, []);

  return (
    <div className="w-full max-w-[80rem] h-full flex flex-col justify-between">
      <h1 className="text-[2.185rem] sxs-only:text-[1.725rem] xs-only:text-[1.84rem] sm-only:text-[1.955rem] md-only:text-[2.07rem] text-negro font-semibold mt-2 text-center">
        LISTA DE AUXILIARES
      </h1>

      {error && <ErrorMessage error={error} />}

      {!isSomethingLoading && auxiliares && auxiliares.length === 0 && (
        <span className="sxs-only:text-[12px] xs-only:text-[13px] sm-only:text-[14px] text-center w-full"> 
          No se encontraron Auxiliares Regitrados en el Sistema
        </span>
      )}

      <div className="flex flex-col items-center w-full flex-1 pt-8 sxs-only:pt-6 xs-only:pt-7 sm-only:pt-7 md-only:pt-8">
        {isSomethingLoading && (
          <span className="sxs-only:text-[12px] xs-only:text-[13px] sm-only:text-[14px] flex items-center">
            Actualizando <Loader className="w-[2rem] sxs-only:w-[1.5rem] xs-only:w-[1.7rem] p-2 sxs-only:p-1.5 bg-black ml-2" />
          </span>
        )}
        {auxiliares && (
          <div className="flex flex-wrap justify-center w-full gap-y-6 sxs-only:gap-y-4 xs-only:gap-y-5 gap-x-4 sxs-only:gap-x-2 xs-only:gap-x-3">
            {auxiliares.map((auxiliar) => (
              <AuxiliardCard key={auxiliar.DNI_Auxiliar} Auxiliar={auxiliar} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Auxiliares;