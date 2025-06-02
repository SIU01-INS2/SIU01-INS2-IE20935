import ModalContainer from "../ModalContainer";
import BotonConIcono from "../../buttons/BotonConIcono";
import OjoIcon from "@/components/icons/OjoIcon";
import { T_Comunicados } from "@prisma/client";
import { useState } from "react";
import ComunicadoImageModal from "./ComunicadoImageModal";

const ComunicadoModal = ({
  eliminateModal,
  comunicado,
}: {
  comunicado: T_Comunicados;
  eliminateModal: () => void;
}) => {
  const [mostrarImagenModal, setMostrarImagenModal] = useState(false);

  const handleVerImagen = () => {
    setMostrarImagenModal(true);
  };

  return (
    <>
      {/* Modal de imagen - se muestra encima de todo */}
      {mostrarImagenModal && comunicado.Google_Drive_Imagen_ID && (
        <div style={{ zIndex: 9999 }}>
          <ComunicadoImageModal
            Google_Drive_Imagen_ID={comunicado.Google_Drive_Imagen_ID}
            eliminateModal={() => setMostrarImagenModal(false)}
          />
        </div>
      )}

      {/* Modal principal del comunicado */}
      <ModalContainer
        eliminateModal={eliminateModal}
        className="relative bg-white w-[90vw] max-w-[80vw] sm:max-w-lg md:max-w-[60vw] lg:max-w-[50vw] xl:max-w-[40vw] p-4 sm:p-8 min-h-[45vh] sm:min-h-0 flex flex-col justify-center overflow-hidden rounded-xl"
      >
        {/* Logo */}
        <img
          src="/images/svg/Logo.svg"
          alt="Logo del Colegio"
          className="absolute inset-0 w-full h-full p-8 object-contain object-center opacity-10 pointer-events-none"
        />

        {/* Contenido */}
        <div className="relative z-10 flex flex-col justify-between h-full w-full gap-4 sm:gap-6">
          <div className="text-left px-4 sm:px-6 mx-auto max-w-[95%] sm:max-w-[100%] pt-2 sm:pt-4">
            <h2 className="text-xl font-semibold text-left">
              {comunicado.Titulo}
            </h2>
            <p className="text-sm sm:text-base text-gray-800 leading-relaxed mt-4">
              {comunicado.Contenido}
            </p>
          </div>

          {/* Botón - solo se muestra si hay imagen */}
          {comunicado.Google_Drive_Imagen_ID && (
            <div className="flex justify-center mt-2">
              <BotonConIcono
                onClick={handleVerImagen}
                className="flex items-center justify-center px-3 sm:px-4 py-2 text-sm sm:text-base bg-black text-white gap-2 rounded-md hover:bg-gray-800 transition-colors cursor-pointer"
                texto="Ver imagen adjunta"
                IconTSX={
                  <OjoIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                }
              />
            </div>
          )}
        </div>
      </ModalContainer>
    </>
  );
};

export default ComunicadoModal;
