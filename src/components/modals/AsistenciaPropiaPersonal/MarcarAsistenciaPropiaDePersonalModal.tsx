import ModalContainer from "../ModalContainer";
import BotonConIcono from "@/components/buttons/BotonConIcono";
import LapizFirmando from "@/components/icons/LapizFirmando";

const MarcarAsistenciaPropiaDePersonalModal = ({
  eliminateModal,
}: {
  eliminateModal: () => void;
}) => {
  return (
    <ModalContainer eliminateModal={eliminateModal}>
      <div className="w-full max-w-md px-4 py-4 sm:px-6 sm:py-8 flex flex-col items-center justify-center gap-5">
        <p className="text-center text-sm xs:text-base sm:text-lg leading-relaxed">
          Vamos a verificar tu <br /><b>ubicación</b> para <b>registrar tu <br />asistencia</b>. 
          Asegúrate de <br />estar <b>dentro del colegio</b>.
        </p>

        <BotonConIcono
          className="bg-verde-principal text-blanco flex gap-3 px-4 py-2 rounded-md text-sm sm:text-base"
          texto="Registrar Asistencia"
          IconTSX={<LapizFirmando className="w-[1.5rem]" />}
        />
      </div>

    </ModalContainer>
  );
};

export default MarcarAsistenciaPropiaDePersonalModal;
