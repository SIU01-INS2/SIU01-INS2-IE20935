import { Entorno } from "@/interfaces/shared/Entornos";

export const Entornos_Textos: Record<Entorno, string> = {
  [Entorno.LOCAL]: "LOCAL",
  [Entorno.DESARROLLO]: "DESARROLLO",
  [Entorno.CERTIFICACION]: "CERTIFICACION",
  [Entorno.TEST]: "TEST",
  [Entorno.PRODUCCION]: "PRODUCCION",
};

export const Entornos_Emojis: Record<Entorno, string> = {
  [Entorno.LOCAL]: "🏠",
  [Entorno.DESARROLLO]: "🛠️",
  [Entorno.CERTIFICACION]: "✅",
  [Entorno.TEST]: "📝",
  [Entorno.PRODUCCION]: "🚀",
};
