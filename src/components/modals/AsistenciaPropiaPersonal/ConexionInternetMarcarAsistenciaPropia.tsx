import ModalContainer from "../ModalContainer";


const ConexionInternetMarcarAsistenciaPropia = ({
  eliminateModal,
}: {
  eliminateModal: () => void;
}) => {
  return (
    <ModalContainer eliminateModal={eliminateModal}>
      <div className="w-full overflow-x-hidden">
        <div className="w-full max-w-md px-4 py-6 sm:px-6 sm:py-8 mx-auto flex flex-col items-center justify-center gap-5">
            <img
             src="\images\svg\Asistencia\ConexionInternetAsistenciaPropia.svg"
            alt="Conexion a Internet"
            className="w-[70px] xs:w-[85px] sm:w-[95px] h-auto object-contain"
            /> 

            <p className="text-center text-sm xs:text-base sm:text-lg leading-relaxed">
            No hay conexión a <br />Internet. Conéctate a <br />una red para registrar <br /> tu asistencia.
            </p>
        </div>
        </div>


    </ModalContainer>
  );
};

export default ConexionInternetMarcarAsistenciaPropia;