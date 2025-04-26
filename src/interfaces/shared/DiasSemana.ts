export enum DiasSemana {
  Domingo = 0,
  Lunes = 1,
  Martes = 2,
  Miercoles = 3,
  Jueves = 4,
  Viernes = 5,
  Sabado = 6,
}

export const diasSemanaTextos: Record<DiasSemana, string> = {
  [DiasSemana.Domingo]: "Domingo",
  [DiasSemana.Lunes]: "Lunes",
  [DiasSemana.Martes]: "Martes",
  [DiasSemana.Miercoles]: "Miércoles",
  [DiasSemana.Jueves]: "Jueves",
  [DiasSemana.Viernes]: "Viernes",
  [DiasSemana.Sabado]: "Sábado",
};

export const diasSemanaTextosCortos: Record<DiasSemana, string> = {
  [DiasSemana.Domingo]: "Dom",
  [DiasSemana.Lunes]: "Lun",
  [DiasSemana.Martes]: "Mar",
  [DiasSemana.Miercoles]: "Mié",
  [DiasSemana.Jueves]: "Jue",
  [DiasSemana.Viernes]: "Vie",
  [DiasSemana.Sabado]: "Sáb",
};
