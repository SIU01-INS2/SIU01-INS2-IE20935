import ModalContainer from "../ModalContainer";

const NoSePuedeUsarLaptopParaAsistenciaModal = ({
  eliminateModal,
}: {
  eliminateModal: () => void;
}) => {
  return (
    <ModalContainer eliminateModal={eliminateModal}>
      <div className="w-full overflow-x-hidden">
        <div className="w-full max-w-md px-4 py-6 sm:px-6 sm:py-8 mx-auto flex flex-col items-center justify-center gap-5">
          {/* Aquí agregarás la imagen */}
          <div className="w-[70px] xs:w-[85px] sm:w-[95px] h-auto bg-gray-200 rounded-lg flex items-center justify-center">
            📱
          </div>

          <p className="text-center text-sm xs:text-base sm:text-lg leading-relaxed">
            No puedes <b>registrar tu asistencia</b> desde una <br />
            <b>computadora o laptop</b>.
            <br />
            <br />
            Por favor, usa tu <b>celular</b> para <br />
            acceder al sistema y marcar <br />
            tu asistencia.
          </p>
        </div>
      </div>
    </ModalContainer>
  );
};

export default NoSePuedeUsarLaptopParaAsistenciaModal;
