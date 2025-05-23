import ModalContainer from "../ModalContainer";
import BotonConIcono from "../../buttons/BotonConIcono";
import OjoIcon from "@/components/icons/OjoIcon";

const ComunicadoModal = ({
  eliminateModal,
}: {
  eliminateModal: () => void;
}) => {
  return (
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
          <h2 className="text-xl font-semibold text-left">Comunicado</h2>
          <p className="text-sm sm:text-base text-gray-800 leading-relaxed mt-4">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
        </div>

        {/* Botón */}
        <div className="flex justify-center mt-2">
          <BotonConIcono
            className="flex items-center justify-center px-3 sm:px-4 py-2 text-sm sm:text-base bg-black text-white gap-2 rounded-md"
            texto="Ver imagen adjunta"
            IconTSX={<OjoIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
          />
        </div>
      </div>
    </ModalContainer>
  );
};

export default ComunicadoModal;