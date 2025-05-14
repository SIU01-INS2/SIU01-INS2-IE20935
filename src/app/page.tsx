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
    <main className="flex flex-col items-center justify-center">
      <div className="flex flex-row items-center justify-around w-full max-w-5xl max-sm:flex-col max-sm:text-left">
        <div className="flex flex-col max-w-[50%] max-sm:max-w-full">
          <h1 className="text-[5rem] font-bold max-sm:text-[4rem]">¡Hola!</h1>
          <h3 className="text-gris-oscuro font-semibold text-[1.8rem] max-sm:text-[1.6rem]">
            {genero === Genero.Masculino ? "Bienvenido" : "Bienvenida"} de
            nuevo, {RolesTextos[rol].desktop[genero]}
          </h3>
          <h3 className="text-negro text-[1.8rem] max-sm:text-[1.6rem]">
            {nombres.split(" ").shift()} {apellidos.split(" ").shift()}
          </h3>
        </div>
        <div className="flex justify-center items-center max-sm:mt-6">
          <img
            src={imagenesBienvenida[rol]}
            alt="Imagen de Bienvenida"
            className="w-[17rem] h-[14rem] max-sm:w-[14rem] max-sm:h-[14rem]"
          />
        </div>
      </div>

      <div className="flex flex-row items-center justify-around w-full max-w-5xl mt-10 max-sm:flex-col max-sm:items-center max-sm:text-left">
        <div className="flex flex-col max-w-[60%] max-sm:max-w-full text-left max-sm:text-left">
          <p className="text-[2rem] font-extrabold text-color-interfaz max-sm:text-[1.6rem]">
            S I A S I S
            
          </p>
          <p className="text-[1rem] text-negro max-sm:text-[1.1rem] mt-2">
            ¡Nos emociona presentar esta nueva y avanzada sistema de asistencia!
            Diseñada por estudiantes de{" "}
            <strong>
              Ingeniería de Sistemas de la Universidad Nacional de Cañete
            </strong>{" "}
            con pasión y dedicación. ¡Bienvenidos al futuro de la educación!
          </p>
        </div>
        <img
          src="images/svg/logo-undc.svg"
          alt="Logo UNDC"
          className="w-[15rem] h-[11rem] max-sm:w-[15rem] max-sm:h-[11rem] max-sm:mt-6"
        />
      </div>
    </main>
  );
};

export default Home;
