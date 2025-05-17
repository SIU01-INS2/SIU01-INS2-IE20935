import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import React from "react";
import Header from "./Header";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import NavBarFooter from "./NavBarFooter";

const PlantillaAuxiliar = ({
  children,
  Nombres,
  Apellidos,
  Google_Drive_Foto_ID,
  Genero,
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
        Google_Drive_Foto_ID={Google_Drive_Foto_ID}
        Nombres={Nombres}
        Apellidos={Apellidos}
        Rol={RolesSistema.Auxiliar}
      />
      {children}

      <NavBarFooter Rol={RolesSistema.Auxiliar}/>
    </>
  );
};
export default PlantillaAuxiliar;
