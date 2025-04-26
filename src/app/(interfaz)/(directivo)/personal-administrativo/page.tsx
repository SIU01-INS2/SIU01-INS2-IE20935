"use client";
import { PersonalAdministrativoSinContraseña } from "@/interfaces/shared/apis/shared/others/types";
import { ErrorResponseAPIBase } from "@/interfaces/shared/apis/types";
import React, { useEffect, useState } from "react";

import ErrorMessage from "@/components/shared/errors/ErrorMessage";
import Loader from "@/components/shared/loaders/Loader";
import PersonalAdministrativoCard from "./_components/PersonalAdministrativoCard";
import { PersonalAdministrativoIDB } from "@/lib/utils/local/db/models/PersonalAdministrativoIDB";

const PersonalAdministrativo = () => {
  const [personalAdministrivo, setPersonalAdministrivo] =
    useState<PersonalAdministrativoSinContraseña[]>();

  const [isSomethingLoading, setIsSomethingLoading] = useState(true);
  const [error, setError] = useState<ErrorResponseAPIBase | null>(null);

  useEffect(() => {
    const getPersonalAdministrativo = async () => {
      const personalAdministrativo = await new PersonalAdministrativoIDB(
        "API01",
        setIsSomethingLoading,
        setError
      ).getAll();

      setPersonalAdministrivo(personalAdministrativo);
    };

    getPersonalAdministrativo();
  }, []);

  return (
    <div className="w-full max-w-[80rem] h-full flex flex-col justify-between">
      <h1 className="text-[2.25rem] text-negro font-semibold mt-2 text-center w-full">
        LISTA DE P. ADMINISTRATIVO
      </h1>

      {error && <ErrorMessage error={error} />}

      {!isSomethingLoading &&
        personalAdministrivo &&
        personalAdministrivo.length === 0 && (
          <span>
            {" "}
            No se encontro Personal Administrativo registrado en el Sistema
          </span>
        )}

      <div className="flex flex-wrap justify-evenly gap-y-8 w-full items-center -border-2 flex-1 pt-6 gap-x-[max(2.5rem,1vw)]">
        {isSomethingLoading && (
          <span>
            Actualizando <Loader className="w-[2rem] p-2 bg-black " />
          </span>
        )}
        {personalAdministrivo && (
          <>
            {personalAdministrivo.map((unPersonalAdministrativo) => (
              <PersonalAdministrativoCard
                key={unPersonalAdministrativo.DNI_Personal_Administrativo}
                PersonalAdministrativo={unPersonalAdministrativo}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default PersonalAdministrativo;
