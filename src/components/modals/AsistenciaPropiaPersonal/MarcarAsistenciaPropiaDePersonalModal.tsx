import LapizIcon from "@/components/icons/LapizIcon";
import ModalContainer from "../ModalContainer";
import BotonConIcono from "@/components/buttons/BotonConIcono";

const MarcarAsistenciaPropiaDePersonalModal = ({
  eliminateModal,
}: {
  eliminateModal: () => void;
}) => {
  return (
    <ModalContainer eliminateModal={eliminateModal}>
      <div className="max-w-[15rem] flex flex-col items-center justify-center gap-4">
        <p className="text-center">
          Vamos a verificar tu <b>ubicación</b> para{" "}
          <b>registrar tu asistencia</b>. Asegúrate de estar{" "}
          <b>dentro del colegio</b>.
        </p>
          
          <BotonConIcono
            className="bg-verde-principal text-blanco flex gap-4 p-2"
            texto="Registrar Asistencia"
            IconTSX={<LapizIcon className="w-[1.5rem]" />}
          />
      </div>
    </ModalContainer>
  );
};

export default MarcarAsistenciaPropiaDePersonalModal;
