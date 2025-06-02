import ModalContainer from "../ModalContainer";

const ComunicadoImageModal = ({
  eliminateModal,
  Google_Drive_Imagen_ID,
}: {
  Google_Drive_Imagen_ID: string;
  eliminateModal: () => void;
}) => {
  return (
    <ModalContainer
      eliminateModal={eliminateModal}
      className="relative bg-white w-[95vw] max-w-[90vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl p-2 sm:p-4 flex flex-col justify-center items-center rounded-xl"
    >
      {/* Contenedor de la imagen */}
      <div className="relative w-full h-full flex items-center justify-center">
        <img
          src={`https://drive.google.com/thumbnail?id=${Google_Drive_Imagen_ID}`}
          alt="Imagen adjunta del comunicado"
          className="max-w-full max-h-[80vh] sm:max-h-[85vh] object-contain rounded-lg shadow-lg"
          style={{
            minHeight: "200px",
            minWidth: "200px",
          }}
          onError={(e) => {
            // En caso de error al cargar la imagen, mostrar imagen por defecto
            (e.target as HTMLImageElement).src =
              "/images/svg/No-Foto-Perfil.svg";
          }}
        />
      </div>

      {/* Texto informativo opcional */}
      <div className="mt-3 text-center">
        <p className="text-xs sm:text-sm text-gray-600">
          Haga clic fuera de la imagen para cerrar
        </p>
      </div>
    </ModalContainer>
  );
};

export default ComunicadoImageModal;
