import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import React from "react";
import Header from "./Header";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import NavBarFooter from "./NavBarFooter";
import MarcarAsistenciaDePersonalButton from "../buttons/MarcarAsistenciaDePersonalButton";

const PlantillaProfesorPrimaria = ({
  children,
  Nombres,
  Apellidos,
  Genero,
  Google_Drive_Foto_ID,
}: {
  children: React.ReactNode;
  Nombres: RequestCookie;
  Apellidos: RequestCookie;
  Genero: RequestCookie;
  Google_Drive_Foto_ID: string | null;
}) => {
  return (
    <main className="w-full grid grid-rows-[min-content_1fr_min-content_min-content] min-h-[100dvh]">
      <Header
        Genero={Genero}
        Nombres={Nombres}
        Apellidos={Apellidos}
        Rol={RolesSistema.ProfesorPrimaria}
        Google_Drive_Foto_ID={Google_Drive_Foto_ID}
      />
      {children}

      <MarcarAsistenciaDePersonalButton rol={RolesSistema.ProfesorPrimaria} />
      <NavBarFooter Rol={RolesSistema.ProfesorPrimaria} />
    </main>
  );
};
export default PlantillaProfesorPrimaria;
