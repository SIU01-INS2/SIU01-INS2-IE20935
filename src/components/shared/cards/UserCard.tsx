import BotonConIcono from "@/components/buttons/BotonConIcono";
import FotoPerfilSideServer from "../../utils/photos/FotoPerfilClientSide";
import CamaraIcon from "@/components/icons/CamaraIcon";
import { Dispatch, SetStateAction } from "react";

const MyUserCard = ({
  Google_Drive_Foto_ID,
  Apellidos,
  Nombre_Usuario,
  Nombres,
  isSomethingLoading = false,
  setCambiarFotoModal,
}: {
  setCambiarFotoModal: Dispatch<SetStateAction<boolean>>;
  isSomethingLoading?: boolean;
  Google_Drive_Foto_ID: string | null;
  Nombre_Usuario?: string;
  Nombres?: string;
  Apellidos?: string;
}) => {
  return (
    <div className="flex flex-col max-w-[85%] items-center justify-center [box-shadow:0_0_12px_4px_#00000050] h-min p-[1.8rem] rounded-[1rem] gap-6">
      <FotoPerfilSideServer
        className="aspect-auto sxs-only:w-[8rem] xs-only:w-[8.5rem] sm-only:w-[9rem] md-only:w-[9.5rem] lg-only:w-[10rem] xl-only:w-[11rem]"
        Google_Drive_Foto_ID={Google_Drive_Foto_ID}
      />

      <div className="flex flex-col gap-2 justify-center items-center">
        {Nombres && Apellidos && (
          <BotonConIcono
            onClick={() => {
              setCambiarFotoModal(true);
            }}
            className="content-center font-semibold p-3 py-1 rounded-[10px] bg-amarillo-ediciones gap-2 sxs-only:text-[0.75rem] xs-only:text-[0.8rem] sm-only:text-[0.85rem] md-only:text-[0.9rem] lg-only:text-[0.95rem] xl-only:text-[1rem]"
            texto="Cambiar Foto"
            IconTSX={
              <CamaraIcon className="w-[1.4rem] sxs-only:w-[0.85rem] xs-only:w-[0.9rem] sm-only:w-[0.95rem] md-only:w-[1rem] lg-only:w-[1.1rem] xl-only:w-[1.2rem]" />
            }
          />
        )}

        <div
          className={`w-full text-[1.2rem] text-center ${
            isSomethingLoading && !Nombres && !Apellidos
              ? "skeleton h-[1.5rem] min-w-[min(10rem,70vw)]"
              : ""
          } sxs-only:text-[1rem] xs-only:text-[1.05rem] sm-only:text-[1.1rem] md-only:text-[1.15rem] lg-only:text-[1.2rem] xl-only:text-[1.25rem]`}
        >
          {!(isSomethingLoading && !Nombres && !Apellidos) &&
            `${Nombres} ${Apellidos}`}
        </div>

        <div
          className={`font-semibold text-center w-full sxs-only:text-[0.85rem] xs-only:text-[0.9rem] sm-only:text-[0.95rem] md-only:text-[1rem] lg-only:text-[1.05rem] xl-only:text-[1.1rem] ${
            isSomethingLoading && !Nombre_Usuario
              ? "skeleton h-[1.5rem] min-w-[min(10rem,70vw)]"
              : ""
          }`}
        >
          {!(isSomethingLoading && !Nombre_Usuario) && Nombre_Usuario}
        </div>
      </div>
    </div>
  );
};

export default MyUserCard;
