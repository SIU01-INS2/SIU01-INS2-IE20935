import { NOMBRE_CLASE_IMAGENES_FOTO_PERFIL_USUARIO } from "@/Assets/others/ClasesCSS";
// import userStorage from "@/lib/utils/local/db/models/UserStorage";

import React from "react";

const FotoPerfilClientSide = ({
  Google_Drive_Foto_ID,
  className = "",
}: {
  Google_Drive_Foto_ID: string | null;
  className?: string;
}) => {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      style={{ boxShadow: "0 0px 8px rgba(0, 0, 0, 0.2)" }}
      className={`${NOMBRE_CLASE_IMAGENES_FOTO_PERFIL_USUARIO} aspect-square w-12 overflow-hidden max-md:mr-2 rounded-[50%] border border-[#ffffff60] bg-contain object-cover bg-no-repeat bg-center ${className}`}
      src={
        Google_Drive_Foto_ID
          ? `https://drive.google.com/thumbnail?id=${Google_Drive_Foto_ID}`
          : "/images/svg/No-Foto-Perfil.svg"
      }
      onError={(e) => {
        // Cambiar la imagen a la imagen por defecto cuando ocurre un error de carga
        const imgElement = e.currentTarget as HTMLImageElement;
        imgElement.src = "/images/svg/No-Foto-Perfil.svg";
        // Opcional: eliminar el evento onError para prevenir bucles infinitos
        imgElement.onerror = null;
      }}
      alt="Foto Perfil"
    />
  );
};

export default FotoPerfilClientSide;
