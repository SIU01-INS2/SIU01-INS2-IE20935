import ModalContainer from "../ModalContainer";

const DispositivoSinGPSModal = ({
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
            🚫
          </div>

          <p className="text-center text-sm xs:text-base sm:text-lg leading-relaxed">
            Tu dispositivo <b>no es compatible</b> <br />
            para registrar asistencia.
            <br />
            <br />
            No cuenta con <b>componente GPS</b> <br />
            necesario para verificar tu <br />
            ubicación.
            <br />
            <br />
            Contacta a la <b>directora</b> para <br />
            obtener un dispositivo compatible.
          </p>
        </div>
      </div>
    </ModalContainer>
  );
};

export default DispositivoSinGPSModal;
