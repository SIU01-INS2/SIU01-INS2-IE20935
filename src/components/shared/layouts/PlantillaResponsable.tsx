import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import Header from "./Header";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import NavBarFooter from "./NavBarFooter";

const PlantillaResponsable = ({
  children,
  Nombres,
  Apellidos,
  Google_Drive_Foto_ID,
}: {
  children: React.ReactNode;
  Nombres: RequestCookie;
  Apellidos: RequestCookie;
  Google_Drive_Foto_ID: string | null;
}) => {
  return (
    <>
      <Header
        Nombres={Nombres}
        Apellidos={Apellidos}
        Rol={RolesSistema.Responsable}
        Google_Drive_Foto_ID={Google_Drive_Foto_ID}
      />
      {children}
      <NavBarFooter Rol={RolesSistema.Responsable} />
    </>
  );
};

export default PlantillaResponsable;
