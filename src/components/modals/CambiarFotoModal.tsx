"use client";
import { useState, useRef, useEffect } from "react";
import ModalContainer, { ModalContainerProps } from "./ModalContainer";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import BotonConIcono from "../buttons/BotonConIcono";
import Loader from "../shared/loaders/Loader";
import { SiasisAPIS } from "../../interfaces/shared/SiasisComponents";
import useRequestAPIFeatures from "@/hooks/useRequestSiasisAPIFeatures";
import {
  ApiResponseBase,
  ErrorResponseAPIBase,
} from "@/interfaces/shared/apis/types";
import { CambiarFotoPerfilSuccessResponse } from "@/interfaces/shared/apis/shared/mis-datos/mi-foto-perfil/types";
import {
  ValidationErrorTypes,
  FileErrorTypes,
  RequestErrorTypes,
} from "@/interfaces/shared/errors";
import ErrorMessage from "../shared/errors/ErrorMessage";

interface CambiarFotoModalProps
  extends Pick<ModalContainerProps, "eliminateModal"> {
  initialSource?: string | null;
  updateFoto: (googleDriveFotoId: string) => void;
  Rol: RolesSistema;
  siasisAPI: SiasisAPIS;
  onSuccess?: () => void;
}

const CambiarFotoModal = ({
  eliminateModal,
  initialSource,
  updateFoto,
  Rol,
  onSuccess,
  siasisAPI,
}: CambiarFotoModalProps) => {
  // Estado para la vista previa de la imagen
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialSource || "/images/svg/No-Foto-Perfil.svg"
  );

  // Estado para el archivo seleccionado
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Referencia para el input de archivo
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    error,
    setError,
    fetchSiasisAPI,
    isSomethingLoading: isUploading,
    setIsSomethingLoading: setIsUploading,
  } = useRequestAPIFeatures(siasisAPI);

  // Función para manejar la selección de archivos
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);

    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      // Verificar tipo de archivo
      if (!file.type.includes("image/")) {
        setError({
          message: "El archivo debe ser una imagen",
          success: false,
          errorType: FileErrorTypes.INVALID_FILE_TYPE,
        });
        return;
      }

      // Verificar tamaño de archivo (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        setError({
          message: "La imagen no debe superar los 5MB",
          success: false,
          errorType: FileErrorTypes.FILE_TOO_LARGE,
        });
        return;
      }

      // Crear URL para la vista previa
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setSelectedFile(file);
    }
  };

  // Función para manejar archivos soltados (drag & drop)
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];

      // Verificar tipo de archivo
      if (!file.type.includes("image/")) {
        setError({
          message: "El archivo debe ser una imagen",
          success: false,
          errorType: FileErrorTypes.INVALID_FILE_TYPE,
        });
        return;
      }

      // Verificar tamaño de archivo (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        setError({
          message: "La imagen no debe superar los 5MB",
          success: false,
          errorType: FileErrorTypes.FILE_TOO_LARGE,
        });
        return;
      }

      // Crear URL para la vista previa
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setSelectedFile(file);
    }
  };

  // Función para abrir el selector de archivos
  const handleSelectClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Función para enviar la foto al servidor
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedFile) {
      setError({
        message: "Debes seleccionar una imagen primero",
        success: false,
        errorType: ValidationErrorTypes.REQUIRED_FIELDS,
      });
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Crear FormData directamente del formulario
      const formData = new FormData(e.currentTarget);

      // Asegurarse de que se incluye el archivo seleccionado
      formData.set("foto", selectedFile);

      const fetchCancelable = await fetchSiasisAPI({
        endpoint: "/api/mis-datos/mi-foto-perfil",
        method: "PUT",
        JSONBody: false,
        body: formData,
        queryParams: { Rol },
      });

      if (!fetchCancelable) throw new Error();

      const res = await fetchCancelable.fetch();

      const responseJson = (await res.json()) as ApiResponseBase;

      if (!responseJson.success) {
        setIsUploading(false);
        return setError(responseJson as ErrorResponseAPIBase);
      }

      const {
        data: { fileId },
      } = responseJson as CambiarFotoPerfilSuccessResponse;
      updateFoto(fileId);

      onSuccess?.();

      // Cerrar el modal
      eliminateModal();
    } catch (err) {
      console.error("Error al cambiar la foto de perfil:", err);
      setError({
        message: "Error al procesar la solicitud",
        success: false,
        errorType: RequestErrorTypes.REQUEST_FAILED,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Limpiar las URLs de objetos al desmontar
  useEffect(() => {
    return () => {
      if (
        previewUrl &&
        previewUrl !== initialSource &&
        previewUrl !== "/images/svg/No-Foto-Perfil.svg"
      ) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, initialSource]);

  return (
    <ModalContainer
      eliminateModal={() => {
        if (!isUploading) eliminateModal();
      }}
    >
      <div className="flex flex-col items-center w-full max-w-md mx-auto">
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col items-center"
          encType="multipart/form-data"
        >
          {/* Vista previa de la imagen */}
          <div className="mb-6 flex flex-wrap gap-6 items-center">
            <p className="mb-3 text-negro">Vista Previa:</p>
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gris-claro bg-white">
              <img
                className="w-full h-full object-cover"
                src={previewUrl || "/images/svg/No-Foto-Perfil.svg"}
                alt="Vista previa"
              />
            </div>
          </div>

          {/* Área para arrastrar y soltar */}
          <div
            className="max-w-[20rem] w-full border-2 border-dashed border-violeta-principal rounded-lg px-6 py-2 text-[0.9rem] cursor-pointer 
                      flex flex-col items-center justify-center bg-[#f9f9ff] hover:bg-[#f5f5ff] transition-colors"
            onClick={handleSelectClick}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <p className="text-violeta-principal font-normal text-center">
              Arrastra y suelta la foto aquí o haz clic para seleccionar una
            </p>
            <input
              type="file"
              name="foto"
              id="foto"
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
              ref={fileInputRef}
            />
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mt-4 w-full max-w-[20rem]">
              <ErrorMessage error={error} closable={true} />
            </div>
          )}

          {/* Botón de envío del formulario */}
          <BotonConIcono
            IconTSX={<></>}
            isSomethingLoading={isUploading}
            titleDisabled="La imagen se esta subiendo"
            LoaderTSX={<Loader className="w-[1.3rem] p-[0.25rem] bg-negro" />}
            texto={isUploading ? "Subiendo" : "Cambiar Foto"}
            typeButton="submit"
            className={`w-max gap-3 py-2 px-4 rounded-lg text-negro font-semibold mt-6 ${
              isUploading || !selectedFile
                ? "bg-gris-intermedio cursor-not-allowed"
                : "bg-amarillo-ediciones hover:grayscale-[0.2] transition-colors"
            }`}
            disabled={isUploading || !selectedFile}
          />
        </form>
      </div>
    </ModalContainer>
  );
};

export default CambiarFotoModal;
