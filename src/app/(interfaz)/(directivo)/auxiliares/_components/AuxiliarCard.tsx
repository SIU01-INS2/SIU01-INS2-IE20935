import { AuxiliarSinContraseña } from "@/interfaces/shared/apis/shared/others/types";
import FotoPerfilClientSide from "../../../../../components/utils/photos/FotoPerfilClientSide";
import TelefonoIcon from "../../../../../components/icons/TelefonoIcon";
import BotonConIcono from "../../../../../components/buttons/BotonConIcono";
import VerEditarIcon from "@/components/icons/VerEditarIcon";
import { Link } from "next-view-transitions";

const AuxiliarCard = ({
  Auxiliar: {
    Apellidos,
    Celular,
    Correo_Electronico,
    DNI_Auxiliar,
    Estado,
    Nombres,
    Nombre_Usuario,
    Google_Drive_Foto_ID,
  },
}: {
  Auxiliar: AuxiliarSinContraseña;
}) => {
  return (
    <div className="w-[285px] h-[355px] sxs-only:w-[240px] sxs-only:h-[330px] xs-only:w-[250px] xs-only:h-[340px] sm-only:w-[270px] sm-only:h-[345px] md-only:w-[280px] lg-only:w-[285px] xl-only:w-[285px] rounded-[15px] shadow-[0_0_6px_3px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center py-4 sxs-only:py-3.5 xs-only:py-3.5 sm-only:py-4 px-3 sxs-only:px-2 gap-2 bg-white overflow-hidden">
      <FotoPerfilClientSide
        className="w-[75px] h-[75px] sxs-only:w-[60px] sxs-only:h-[60px] xs-only:w-[65px] xs-only:h-[65px] sm-only:w-[70px] sm-only:h-[70px] rounded-full object-cover"
        Google_Drive_Foto_ID={Google_Drive_Foto_ID}
      />

      <span
        className="text-[19px] sxs-only:text-[16px] xs-only:text-[17px] sm-only:text-[18px] font-semibold text-negro whitespace-nowrap overflow-hidden text-ellipsis w-full text-center"
        title={`${Nombres} ${Apellidos}`}
      >
        {Nombres} {Apellidos}
      </span>

      <span
        className="text-[17px] sxs-only:text-[15px] xs-only:text-[16px] font-medium text-azul-principal text-center"
        title={DNI_Auxiliar}
      >
        {DNI_Auxiliar}
      </span>

      <span
        className="italic text-[15px] sxs-only:text-[13px] text-negro font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full text-center"
        title={Nombre_Usuario}
      >
        {Nombre_Usuario}
      </span>

      <div className="flex items-center justify-center gap-1 text-[15px] sxs-only:text-[13px] text-negro">
        <TelefonoIcon className="w-[1.1rem] sxs-only:w-[0.9rem] text-verde-principal" />
        <span title={Celular}>{Celular}</span>
      </div>

      <span
        className="text-[13px] sxs-only:text-[11px] text-negro font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full text-center"
        title={Correo_Electronico || undefined}
      >
        {Correo_Electronico}
      </span>

      <span
        className="text-[15px] sxs-only:text-[13px] font-semibold text-verde-principal text-center"
        title={`Estado: ${Estado ? "Activo" : "Inactivo"}`}
      >
        Estado: {Estado ? "Activo" : "Inactivo"}
      </span>

      <Link href={`/auxiliares/${DNI_Auxiliar}`} className="mt-2">
        <BotonConIcono
          className="bg-amarillo-ediciones text-negro font-medium flex gap-1 items-center px-2.5 py-1.5 sxs-only:px-2 sxs-only:py-1 rounded text-[15px] sxs-only:text-[13px]"
          texto="Ver/Editar"
          IconTSX={
            <VerEditarIcon className="w-4 h-4 sxs-only:w-3.5 sxs-only:h-3.5" />
          }
        />
      </Link>
    </div>
  );
};

export default AuxiliarCard;
