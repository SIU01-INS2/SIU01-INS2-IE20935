import { cookies } from "next/headers";
import MisDatosDirectivo from "./_components/MisDatosDirectivo";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import MisDatosProfesorPrimaria from "./_components/MisDatosProfesorPrimaria";
import MisDatosAuxiliar from "./_components/MisDatosAuxiliar";
import MisDatosProfesorSecundaria from "./_components/MisDatosProfesorSecundaria";
import MisDatosTutor from "./_components/MisDatosTutor";
import MisDatosResponsable from "./_components/MisDatosResponsable";
import MisDatosPersonalAdministrativo from "./_components/MisDatosPersonalAdministrativo";
import { Genero } from "@/interfaces/shared/Genero";

const MisDatos = async () => {
  //Si se ha llegado hasta este componente es porque esas cookies estaran presentes
  const cookieStore = await cookies();
  const rol = cookieStore.get("Rol")!.value as RolesSistema;
  const nombres = cookieStore.get("Nombres")!.value;
  const genero = cookieStore.get("Genero")!.value as Genero;
  const apellidos = cookieStore.get("Apellidos")!.value;
  const googleDriveFotoId =
    cookieStore.get("Google_Drive_Foto_ID")?.value || null;

  const misDatosComponent = () => {
    switch (rol) {
      case RolesSistema.Directivo:
        return (
          <MisDatosDirectivo
            googleDriveFotoIdCookieValue={googleDriveFotoId}
            nombresCookieValue={nombres}
            apellidosCookieValue={apellidos}
            generoCookieValue={genero}
          />
        );
      case RolesSistema.ProfesorPrimaria:
        return (
          <MisDatosProfesorPrimaria
            nombresCookieValue={nombres}
            apellidosCookieValue={apellidos}
            googleDriveFotoIdCookieValue={googleDriveFotoId}
            generoCookieValue={genero}
          />
        );
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
