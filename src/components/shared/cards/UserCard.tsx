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
    <div className="flex flex-col max-w-[85%] items-center justify-center [box-shadow:0_0_12px_4px_#00000050] h-min p-[1.4rem] rounded-[1rem] gap-4 lg-only:p-[1.6rem] xl-only:p-[1.8rem] lg-only:gap-5 xl-only:gap-6">
      <FotoPerfilSideServer
        className="aspect-auto sxs-only:w-[6.4rem] xs-only:w-[6.6rem] sm-only:w-[6.9rem] md-only:w-[7.4rem] lg-only:w-[8.3rem] xl-only:w-[11rem]"
        Google_Drive_Foto_ID={Google_Drive_Foto_ID}
      />

      <div className="flex flex-col gap-[0.4rem] lg-only:gap-[0.45rem] xl-only:gap-2 justify-center items-center">
        {Nombres && Apellidos && (
          <BotonConIcono
            onClick={() => {
              setCambiarFotoModal(true);
            }}
            className="content-center font-semibold p-[0.6rem] py-[0.2rem] lg-only:p-[0.7rem] lg-only:py-[0.22rem] xl-only:p-3 xl-only:py-1 rounded-[10px] bg-amarillo-ediciones gap-2 sxs-only:text-[0.65rem] xs-only:text-[0.7rem] sm-only:text-[0.75rem] md-only:text-[0.8rem] lg-only:text-[0.87rem] xl-only:text-[1rem]"
            texto="Cambiar Foto"
            IconTSX={
              <CamaraIcon className="w-[1.1rem] sxs-only:w-[0.75rem] xs-only:w-[0.8rem] sm-only:w-[0.85rem] md-only:w-[0.9rem] lg-only:w-[1rem] xl-only:w-[1.2rem]" />
            }
          />
        )}

        <div
          className={`w-full text-[1rem] text-center ${
            isSomethingLoading && !Nombres && !Apellidos
              ? "skeleton h-[1.3rem] min-w-[min(10rem,70vw)] lg-only:h-[1.4rem] xl-only:h-[1.5rem]"
              : ""
          } sxs-only:text-[0.85rem] xs-only:text-[0.9rem] sm-only:text-[0.95rem] md-only:text-[1rem] lg-only:text-[1.1rem] xl-only:text-[1.25rem]`}
        >
          {!(isSomethingLoading && !Nombres && !Apellidos) &&
            `${Nombres} ${Apellidos}`}
        </div>

        <div
          className={`font-semibold text-center w-full sxs-only:text-[0.7rem] xs-only:text-[0.75rem] sm-only:text-[0.8rem] md-only:text-[0.85rem] lg-only:text-[0.95rem] xl-only:text-[1.1rem] ${
            isSomethingLoading && !Nombre_Usuario
              ? "skeleton h-[1.3rem] min-w-[min(10rem,70vw)] lg-only:h-[1.4rem] xl-only:h-[1.5rem]"
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
