import ModalContainer from "../ModalContainer";

const ErrorGenericoAlRegistrarAsistenciaPropiaModal = ({
  eliminateModal,
}: {
  eliminateModal: () => void;
}) => {
  return (
    <ModalContainer eliminateModal={eliminateModal}>
      <div className="w-full overflow-x-hidden">
        <div className="w-full max-w-md px-4 py-6 sm:px-6 sm:py-8 mx-auto flex flex-col items-center justify-center gap-5">
          <img
            src="\images\svg\Asistencia\ErrorAsistenciaPropia.svg"
            alt="Error"
            className="w-[70px] xs:w-[85px] sm:w-[95px] h-auto object-contain"
          />

          <p className="text-center text-sm xs:text-base sm:text-lg leading-relaxed">
            Hubo un problema al <br />
            registrar tu asistencia, <br />
            vuelve a intentarlo.
          </p>
        </div>
      </div>
    </ModalContainer>
  );
};

export default ErrorGenericoAlRegistrarAsistenciaPropiaModal;
