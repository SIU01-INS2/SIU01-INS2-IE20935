import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import React from "react";
import Header from "./Header";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";

const PlantillaTutor = ({
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
        Google_Drive_Foto_ID={Google_Drive_Foto_ID}
        Nombres={Nombres}
        Apellidos={Apellidos}
        Rol={RolesSistema.Tutor}
      />
      {children}
    </>
  );
};

export default PlantillaTutor;
