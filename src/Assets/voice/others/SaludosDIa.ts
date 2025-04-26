export enum PeriodoDia {
  MAÑANA = "Mañana",
  TARDE = "Tarde",
  NOCHE = "Noche",
}

export const saludosDia: Record<PeriodoDia, string> = {
  [PeriodoDia.MAÑANA]: "Buenos días",
  [PeriodoDia.TARDE]: "Buenas tardes",
  [PeriodoDia.NOCHE]: "Buenas noches",
};
