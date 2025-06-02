export default function getDiasEscolaresPorMes(
  mes: number,
  año: number
): string[] {
  const dias: string[] = [];
  // const fechaInicio = new Date(año, mes - 1, 1);
  const fechaFin = new Date(año, mes, 0);

  for (let dia = 1; dia <= fechaFin.getDate(); dia++) {
    const fecha = new Date(año, mes - 1, dia);
    const diaSemana = fecha.getDay();

    // Solo incluir lunes (1) a viernes (5)
    if (diaSemana >= 1 && diaSemana <= 5) {
      const fechaStr = `${año}-${mes.toString().padStart(2, "0")}-${dia
        .toString()
        .padStart(2, "0")}`;
      dias.push(fechaStr);
    }
  }

  return dias;
}
