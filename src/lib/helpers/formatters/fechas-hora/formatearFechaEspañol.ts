import { DiasSemana, diasSemanaTextos } from "@/interfaces/shared/DiasSemana";
import {
  Meses,
  mesesTextos,
  mesesTextosCortos,
} from "@/interfaces/shared/Meses";

/**
 * Obtiene una fecha formateada en español
 * @param fecha Fecha a formatear
 * @param formato Formato deseado
 * @returns Fecha formateada
 */
export const formatearFechaEspañol = (
  fecha: Date | string,
  formato: "completo" | "corto" | "mediano" | "legible" | "numerico" = "legible"
): string => {
  const fechaObj = typeof fecha === "string" ? new Date(fecha) : fecha;
  const dia = fechaObj.getDate();
  const mes = fechaObj.getMonth() as Meses;
  const año = fechaObj.getFullYear();
  const diaSemana = fechaObj.getDay() as DiasSemana;

  switch (formato) {
    case "completo":
      return `${diasSemanaTextos[diaSemana]}, ${dia} de ${mesesTextos[mes]} de ${año}`;
    case "corto":
      return `${dia}/${mes + 1}/${año.toString().substring(2)}`;
    case "mediano":
      return `${dia} ${mesesTextosCortos[mes]} ${año}`;
    case "numerico":
      return `${dia.toString().padStart(2, "0")}/${(mes + 1)
        .toString()
        .padStart(2, "0")}/${año}`;
    case "legible":
    default:
      return `${diasSemanaTextos[diaSemana]} ${dia} de ${mesesTextos[mes]}`;
  }
};
