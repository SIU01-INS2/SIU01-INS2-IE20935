"use client";
import { useState } from "react";
import ModalContainer, { ModalContainerProps } from "./ModalContainer";
import BotonConIcono from "../buttons/BotonConIcono";
import Loader from "../shared/loaders/Loader";
import { SiasisAPIS } from "@/interfaces/shared/SiasisComponents";
import useRequestAPIFeatures from "@/hooks/useRequestSiasisAPIFeatures";
import {
  ApiResponseBase,
  ErrorResponseAPIBase,
} from "@/interfaces/shared/apis/types";
import {
  ValidationErrorTypes,
  RequestErrorTypes,
} from "@/interfaces/shared/apis/errors";
import ErrorMessage from "../shared/errors/ErrorMessage";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import PasswordInput from "../inputs/PasswordInput";

interface CambioContrasenaModalProps
  extends Pick<ModalContainerProps, "eliminateModal"> {
  siasisAPI: SiasisAPIS;
  onSuccess?: () => void;
  Rol: RolesSistema;
}

const CambioContrasenaModal = ({
  eliminateModal,
  onSuccess,
  siasisAPI,
  Rol,
}: CambioContrasenaModalProps) => {
  // Estados para los campos de contraseña
  const [contraseñaActual, setContraseñaActual] = useState<string>("");
  const [nuevaContraseña, setNuevaContraseña] = useState<string>("");

  // Estado para validar los campos
  const [isValid, setIsValid] = useState<boolean>(false);

  // API request hooks
  const {
    error,
    setError,
    fetchSiasisAPI,
    isSomethingLoading,
    setIsSomethingLoading,
  } = useRequestAPIFeatures(siasisAPI);

  // Validación de contraseñas
  const validateForm = (actual: string, nueva: string) => {
    // Limpiar errores previos
    setError(null);

    // Verificar que no estén vacías
    if (!actual || !nueva) {
      return false;
    }

    // Verificar que la nueva contraseña tenga al menos 6 caracteres
    if (nueva.length < 6) {
      return false;
    }

    // Verificar que sean diferentes
    if (actual === nueva) {
      setError({
        message: "La nueva contraseña no puede ser igual a la actual",
        success: false,
        errorType: ValidationErrorTypes.INVALID_FORMAT,
      });
      return false;
    }

    return true;
  };

  // Manejar cambios en el campo de contraseña actual
  const handleContraseñaActualChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setContraseñaActual(value);
    setIsValid(validateForm(value, nuevaContraseña));
  };

  // Manejar cambios en el campo de nueva contraseña
  const handleNuevaContraseñaChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setNuevaContraseña(value);
    setIsValid(validateForm(contraseñaActual, value));
  };

  // Función para enviar la solicitud de cambio de contraseña
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isValid) {
      setError({
        message: "Por favor, complete correctamente todos los campos",
        success: false,
        errorType: ValidationErrorTypes.REQUIRED_FIELDS,
      });
      return;
    }

    try {
      setIsSomethingLoading(true);
      setError(null);

      const fetchCancelable = await fetchSiasisAPI({
        endpoint: "/api/mis-datos/mi-contrasena",
        method: "PUT",
        JSONBody: true,
        body: JSON.stringify({ contraseñaActual, nuevaContraseña }),
        queryParams: { Rol },
      });

      if (!fetchCancelable) throw new Error("Error en la solicitud");

      const res = await fetchCancelable.fetch();
      const responseJson = (await res.json()) as ApiResponseBase;

      if (!responseJson.success) {
        setIsSomethingLoading(false);
        return setError(responseJson as ErrorResponseAPIBase);
      }

      // Llamar al callback de éxito si existe
      onSuccess?.();

      // Cerrar el modal
      eliminateModal();
    } catch (err) {
      console.error("Error al cambiar la contraseña:", err);
      setError({
        message: "Error al procesar la solicitud",
        success: false,
        errorType: RequestErrorTypes.REQUEST_FAILED,
      });
    } finally {
      setIsSomethingLoading(false);
    }
  };

  // Función para prevenir el cierre del modal durante la operación
  const handleClose = () => {
    if (isSomethingLoading) {
      return; // No hacer nada si está cargando
    }
    eliminateModal();
  };

  return (
    <ModalContainer eliminateModal={handleClose}>
      <div className="flex flex-col items-center w-full max-w-md mx-auto transition-all duration-300 ease-in-out gap-2 px-2">
        {/* Imagen de candado */}
        <img
          src="/images/svg/Candado.svg"
          alt="Candado"
          className="w-[8rem] aspect-square mb-4 sxs-only:w-16 xs-only:w-20 sm:w-24 md:w-28"
        />

        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col items-center"
        >
          <div className="w-full space-y-3">
            {/* Contraseña actual */}
            <PasswordInput
              id="contraseñaActual"
              value={contraseñaActual}
              onChange={handleContraseñaActualChange}
              label="Contraseña Actual:"
              required
              maxLength={20}
              inputClassName="w-full sm:w-[105%]"
            />

            {/* Nueva contraseña */}
            <PasswordInput
              id="nuevaContraseña"
              value={nuevaContraseña}
              onChange={handleNuevaContraseñaChange}
              label="Nueva Contraseña"
              required
              minLength={6}
              maxLength={20}
              helperText="La contraseña debe tener al menos 8 caracteres"
              inputClassName="w-full sm:w-[105%]"
            />
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="max-w-[18rem] mt-3">
              <ErrorMessage
                className=""
                error={error}
                setError={setError}
                closable={true}
              />
            </div>
          )}

          {/* Botón de envío */}
          <BotonConIcono
            IconTSX={<></>}
            isSomethingLoading={isSomethingLoading}
            titleDisabled={`${
              isSomethingLoading
                ? "Procesando Solicitud..."
                : !isValid
                ? "Complete correctamente los campos"
                : "No puede usar el botón ahora"
            }`}
            LoaderTSX={<Loader className="w-[1.3rem] p-[0.25rem] bg-negro" />}
            texto={isSomethingLoading ? "Cambiando..." : "Cambiar Contraseña"}
            typeButton="submit"
            className={`w-max font-semibold px-6 gap-3 py-2 mt-4 rounded-md text-center text-base ${
              isSomethingLoading || !isValid
                ? "bg-gris-intermedio text-gris-oscuro cursor-not-allowed"
                : "bg-amarillo-ediciones text-negro hover:grayscale-[0.2] transition-colors"
            }`}
            disabled={isSomethingLoading || !isValid}
          />
        </form>
      </div>
    </ModalContainer>
  );
};

export default CambioContrasenaModal;
