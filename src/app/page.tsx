/* eslint-disable @next/next/no-img-element */
import { RolesTextos } from "@/Assets/RolesTextos";

import { Genero } from "@/interfaces/shared/Genero";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { cookies } from "next/headers";
import React from "react";

const imagenesBienvenida: Record<RolesSistema, string> = {
  [RolesSistema.Directivo]: "images/svg/bienvenida-D.svg",
  [RolesSistema.ProfesorPrimaria]: "images/svg/bienvenida-PP-A-PS.svg",
  [RolesSistema.Auxiliar]: "images/svg/bienvenida-PP-A-PS.svg",
  [RolesSistema.ProfesorSecundaria]: "images/svg/bienvenida-PP-A-PS.svg",
  [RolesSistema.Tutor]: "images/svg/bienvenida-T.svg",
  [RolesSistema.Responsable]: "images/svg/bienvenida-R.svg",
  [RolesSistema.PersonalAdministrativo]: "images/svg/bienvenida-PA.svg",
};

const Home = async () => {
  //Si se ha llegado hasta este componente es porque esas cookies estaran presentes
  const cookieStore = await cookies();
  const rol = cookieStore.get("Rol")!.value as RolesSistema;
  const nombres = cookieStore.get("Nombres")!.value;
  const apellidos = cookieStore.get("Apellidos")!.value;
  const genero = cookieStore.get("Genero")!.value as Genero;

  return (
    <>
      <main className="flex flex-col items-center justify-center px-4">
        <div
          className="flex flex-row items-center justify-around w-full max-w-5xl 
                      sxs-only:flex-col sxs-only:text-center
                      xs-only:flex-col xs-only:text-center
                      max-sm:flex-col max-sm:text-center"
        >
          <div
            className="flex flex-col max-w-[50%] 
                        sxs-only:max-w-full
                        xs-only:max-w-full
                        max-sm:max-w-full"
          >
            <h1
              className="font-bold 
                         sxs-only:text-[3rem]
                         xs-only:text-[3.4rem]
                         max-sm:text-[3.4rem]
                         text-[4.25rem]"
            >
              ¡Hola!
            </h1>
            <h3
              className="text-gris-oscuro font-semibold 
                         sxs-only:text-[1rem]
                         xs-only:text-[1.2rem]
                         max-sm:text-[1.35rem]
                         text-[1.55rem]"
            >
              {genero === Genero.Masculino ? "Bienvenido" : "Bienvenida"} de
              nuevo, {RolesTextos[rol].desktop[genero]}
            </h3>
            <h3
              className="text-negro 
                         sxs-only:text-[1rem]
                         xs-only:text-[1.2rem]
                         max-sm:text-[1.35rem]
                         text-[1.55rem]"
            >
              {nombres.split(" ").shift()} {apellidos.split(" ").shift()}
            </h3>
          </div>
          <div
            className="flex justify-center items-center 
                        sxs-only:mt-4
                        xs-only:mt-5
                        max-sm:mt-5"
          >
            <img
              src={imagenesBienvenida[rol]}
              alt="Imagen de Bienvenida"
              className="sxs-only:w-[10rem] sxs-only:h-[8.5rem]
                       xs-only:w-[12rem] xs-only:h-[10rem]
                       max-sm:w-[12rem] max-sm:h-[10rem]
                       w-[14.5rem] h-[12rem]"
            />
          </div>
        </div>

        <div
          className="flex flex-row items-center justify-around w-full max-w-5xl 
                      sxs-only:flex-col sxs-only:items-center sxs-only:text-center sxs-only:mt-6
                      xs-only:flex-col xs-only:items-center xs-only:text-center xs-only:mt-7
                      max-sm:flex-col max-sm:items-center max-sm:text-center max-sm:mt-8
                      mt-8"
        >
          <div
            className="flex flex-col max-w-[60%] text-left 
                        sxs-only:max-w-full sxs-only:text-center sxs-only:px-3
                        xs-only:max-w-full xs-only:text-center xs-only:px-3
                        max-sm:max-w-full max-sm:text-center max-sm:px-4"
          >
            <p
              className="font-extrabold text-color-interfaz 
                        sxs-only:text-[1.2rem]
                        xs-only:text-[1.4rem]
                        max-sm:text-[1.35rem]
                        text-[1.7rem]"
            >
              S I A S I S
            </p>
            <p
              className="text-negro mt-2
                        sxs-only:text-[0.85rem]
                        xs-only:text-[0.95rem]
                        max-sm:text-[0.95rem]
                        text-[1rem]"
            >
              ¡Nos emociona presentar esta nueva y avanzada sistema de
              asistencia! Diseñada por estudiantes de{" "}
              <strong>
                Ingeniería de Sistemas de la Universidad Nacional de Cañete
              </strong>{" "}
              con pasión y dedicación. ¡Bienvenidos al futuro de la educación!
            </p>
          </div>
          <img
            src="images/svg/logo-undc.svg"
            alt="Logo UNDC"
            className="sxs-only:w-[10rem] sxs-only:h-[7.5rem] sxs-only:mt-4
                     xs-only:w-[12rem] xs-only:h-[9rem] xs-only:mt-5
                     max-sm:w-[12.75rem] max-sm:h-[9.5rem] max-sm:mt-5
                     w-[12.75rem] h-[9.5rem]"
          />
        </div>
      </main>
    </>
  );
};

export default Home;
