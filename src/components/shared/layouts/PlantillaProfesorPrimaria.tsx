import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import React from "react";
import Header from "./Header";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import NavBarFooter from "./NavBarFooter";


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
    <>
      <Header
        Genero={Genero}
        Nombres={Nombres}
        Apellidos={Apellidos}
        Rol={RolesSistema.ProfesorPrimaria}
        Google_Drive_Foto_ID={Google_Drive_Foto_ID}
      />
      {children}
      
      <NavBarFooter Rol={RolesSistema.ProfesorPrimaria}/>
    </>
  );
};
export default PlantillaProfesorPrimaria;
