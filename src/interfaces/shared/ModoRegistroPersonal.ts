export enum ModoRegistro {
  Entrada = "E",
  Salida = "S",
}

export const modoRegistroTextos: Record<ModoRegistro, string> = {
  [ModoRegistro.Entrada]: "Entrada",
  [ModoRegistro.Salida]: "Salida",
};
