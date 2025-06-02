import { EstadosAsistenciaPersonal } from "../../interfaces/shared/EstadosAsistenciaPersonal";

export const EstadosAsistenciaPersonalStyles: Record<
  EstadosAsistenciaPersonal,
  string
> = {
  [EstadosAsistenciaPersonal.Temprano]: "bg-verde-principal text-white",
  [EstadosAsistenciaPersonal.En_Tiempo]: "bg-azul-principal text-white",
  [EstadosAsistenciaPersonal.Cumplido]: "bg-verde-principal text-white",
  [EstadosAsistenciaPersonal.Salida_Anticipada]:
    "bg-amarillo-ediciones text-negro",
  [EstadosAsistenciaPersonal.Tarde]: "bg-naranja-principal text-white",
  [EstadosAsistenciaPersonal.Falta]: "bg-rojo-oscuro text-white",
  [EstadosAsistenciaPersonal.Sin_Registro]: "text-center text-negro",
  [EstadosAsistenciaPersonal.No_Registrado]: "text-center text-negro",
  [EstadosAsistenciaPersonal.Inactivo]: "bg-gris-oscuro text-white",
  [EstadosAsistenciaPersonal.Evento]: "bg-violeta-principal text-white",
  [EstadosAsistenciaPersonal.Otro]: "bg-gris-claro text-negro",
};
