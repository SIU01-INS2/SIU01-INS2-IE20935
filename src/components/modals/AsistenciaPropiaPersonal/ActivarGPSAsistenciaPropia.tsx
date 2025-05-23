import ModalContainer from "../ModalContainer";


const ActivarGPSAsistenciaPropia = ({
  eliminateModal,
}: {
  eliminateModal: () => void;
}) => {
  return (
    <ModalContainer eliminateModal={eliminateModal}>
      <div className="w-full overflow-x-hidden">
        <div className="w-full max-w-md px-4 py-6 sm:px-6 sm:py-8 mx-auto flex flex-col items-center justify-center gap-5">
            <img
             src="\images\svg\Asistencia\UbicacionEnMapa.svg"
            alt="Activar GPS"
            className="w-[70px] xs:w-[85px] sm:w-[95px] h-auto object-contain"
            /> 

            <p className="text-center text-sm xs:text-base sm:text-lg leading-relaxed">
            No pudimos <b>acceder a tu <br />ubicación</b>. Activa el <b>GPS</b> y los<b> <br /> permisos habilitados</b> de <br />tu dispositivo o navegador.
            <br />Si sigue fallando, avísale a la <br />directora.
            </p>
        </div>
        </div>


    </ModalContainer>
  );
};

export default ActivarGPSAsistenciaPropia;