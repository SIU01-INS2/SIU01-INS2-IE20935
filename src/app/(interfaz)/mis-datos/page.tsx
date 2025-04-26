import { cookies } from "next/headers";
import MisDatosDirectivo from "./_components/MisDatosDirectivo";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import MisDatosProfesorPrimaria from "./_components/MisDatosProfesorPrimaria";
import MisDatosAuxiliar from "./_components/MisDatosAuxiliar";
import MisDatosProfesorSecundaria from "./_components/MisDatosProfesorSecundaria";
import MisDatosTutor from "./_components/MisDatosTutor";
import MisDatosResponsable from "./_components/MisDatosResponsable";
import MisDatosPersonalAdministrativo from "./_components/MisDatosPersonalAdministrativo";

const MisDatos = async () => {
  //Si se ha llegado hasta este componente es porque esas cookies estaran presentes
  const cookieStore = await cookies();
  const rol = cookieStore.get("Rol")!.value as RolesSistema;
  const googleDriveFotoId =
    cookieStore.get("Google_Drive_Foto_ID")?.value || null;

  const misDatosComponent = () => {
    switch (rol) {
      case RolesSistema.Directivo:
        return (
          <MisDatosDirectivo googleDriveFotoIdCookieValue={googleDriveFotoId} />
        );
      case RolesSistema.ProfesorPrimaria:
        return <MisDatosProfesorPrimaria />;
      case RolesSistema.Auxiliar:
        return <MisDatosAuxiliar />;
      case RolesSistema.ProfesorSecundaria:
        return <MisDatosProfesorSecundaria />;
      case RolesSistema.Tutor:
        return <MisDatosTutor />;
      case RolesSistema.Responsable:
        return <MisDatosResponsable />;
      case RolesSistema.PersonalAdministrativo:
        return <MisDatosPersonalAdministrativo />;
    }
  };

  return <>{misDatosComponent()}</>;
};

export default MisDatos;
