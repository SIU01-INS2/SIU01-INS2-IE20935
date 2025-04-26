import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import "dotenv/config";

export default function getAPI01InstanceForRol(rol: RolesSistema) {
  switch (rol) {
    case RolesSistema.Directivo:
    case RolesSistema.ProfesorPrimaria:
      return process.env.NEXT_PUBLIC_API01_INS1_URL_BASE;
    case RolesSistema.ProfesorSecundaria:
      return process.env.NEXT_PUBLIC_API01_INS2_URL_BASE;
    //  Para casos de Auxiliar y Personal Administrativo
    default:
      return process.env.NEXT_PUBLIC_API01_INS3_URL_BASE;
  }
}
