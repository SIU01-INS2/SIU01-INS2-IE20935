import ModalContainer from "../ModalContainer";

const ConfirmacionAsistenciaMarcadaModal = ({
  eliminateModal,
}: {
  eliminateModal: () => void;
}) => {
  return (
    <ModalContainer className="z-[1201]" eliminateModal={eliminateModal}>
      <div className="w-full overflow-x-hidden">
        <div className="w-full max-w-md px-4 py-6 sm:px-6 sm:py-8 mx-auto flex flex-col items-center justify-center gap-5">
          <img
            src="/images/svg/Asistencia/ConfirmacionDeAsistencia.svg"
            alt="Confirmación de asistencia"
            className="w-[70px] xs:w-[85px] sm:w-[95px] h-auto object-contain"
          />

          <p className="text-center text-sm xs:text-base sm:text-lg leading-relaxed">
            Tu asistencia ha sido <br />
            registrada <br />
            correctamente el <br />
            <b>[fecha y hora]</b>. <br />
            ¡Gracias!
          </p>
        </div>
      </div>
    </ModalContainer>
  );
};

export default ConfirmacionAsistenciaMarcadaModal;
