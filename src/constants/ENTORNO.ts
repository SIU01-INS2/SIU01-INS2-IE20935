import { Entorno } from "../interfaces/shared/Entornos";
import "dotenv/config";

export const ENTORNO = process.env.NEXT_PUBLIC_ENTORNO! as Entorno;
