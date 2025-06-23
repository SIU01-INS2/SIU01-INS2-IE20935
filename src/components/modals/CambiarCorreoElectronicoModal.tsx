"use client";
import { useState, useEffect, useRef } from "react";
import ModalContainer, { ModalContainerProps } from "./ModalContainer";
import BotonConIcono from "../buttons/BotonConIcono";
import Loader from "../shared/loaders/Loader";
import { SiasisAPIS } from "@/interfaces/shared/SiasisComponents";
import useRequestAPIFeatures from "@/hooks/useRequestSiasisAPIFeatures";
import {
  ApiResponseBase,
  ErrorResponseAPIBase,
} from "@/interfaces/shared/apis/types";
import { CambiarCorreoSuccessResponse } from "@/interfaces/shared/apis/api01/mis-datos/cambiar-correo/types";

import ErrorMessage from "../shared/errors/ErrorMessage";
import InformationIcon from "../icons/InformationIcon";
import {
  AuthenticationErrorTypes,
  RequestErrorTypes,
  TokenErrorTypes,
  ValidationErrorTypes,
} from "@/interfaces/shared/errors";

interface CambioCorreoModalProps
  extends Pick<ModalContainerProps, "eliminateModal"> {
  updateEmail: (nuevoCorreo: string) => void;
  siasisAPI: SiasisAPIS;
  onSuccess?: () => void;
}

// Número máximo de intentos permitidos
const MAX_ATTEMPTS = 3;
// Tiempo de espera antes de cerrar el modal después de exceder los intentos (3 segundos)
const ERROR_DISPLAY_TIME = 6000;

const CambioCorreoModal = ({
  eliminateModal,
  updateEmail,
  onSuccess,
  siasisAPI,
}: CambioCorreoModalProps) => {
  // Estado para controlar la vista (ingreso de correo vs. ingreso de código)
  const [step, setStep] = useState<"email" | "code">("email");

  // Estado para el nuevo correo electrónico
  const [nuevoCorreo, setNuevoCorreo] = useState<string>("");

  // Estado para el código OTP
  const [codigo, setCodigo] = useState<string>("");

  // Estado para almacenar la fecha de expiración absoluta
  const [expireTimestamp, setExpireTimestamp] = useState<number | null>(null);

  // Estado para el contador de tiempo restante
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  // Estado para controlar si el botón de envío está habilitado
  const [isEmailValid, setIsEmailValid] = useState<boolean>(false);

  // Estado para contar los intentos fallidos
  const [attempts, setAttempts] = useState<number>(0);

  // Estado para controlar si se han excedido los intentos máximos
  const [maxAttemptsExceeded, setMaxAttemptsExceeded] =
    useState<boolean>(false);

  // Referencia para el intervalo del temporizador
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Referencia para el timeout de cierre por máximos intentos
  const maxAttemptsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // API request hooks
  const {
    error,
    setError,
    fetchSiasisAPI,
    isSomethingLoading,
    setIsSomethingLoading,
  } = useRequestAPIFeatures(siasisAPI);

  // Validar formato de correo electrónico
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Manejar cambio en el campo de correo
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setNuevoCorreo(email);
    setIsEmailValid(validateEmail(email));
    setError(null);
  };

  // Manejar cambio en el campo de código
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo permitir números
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length <= 6) {
      setCodigo(value);
      setError(null);
    }
  };

  // Función para enviar la solicitud de cambio de correo
  const handleSubmitEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isEmailValid) {
      setError({
        message: "Ingresa un correo electrónico válido",
        success: false,
        errorType: ValidationErrorTypes.INVALID_EMAIL,
      });
      return;
    }

    try {
      setIsSomethingLoading(true);
      setError(null);

      const fetchCancelable = await fetchSiasisAPI({
        endpoint: "/api/mis-datos/mi-correo/solicitar-cambio-correo",
        method: "PUT",
        body: JSON.stringify({ nuevoCorreo }),
      });

      if (!fetchCancelable) throw new Error("Error en la solicitud");

      const res = await fetchCancelable.fetch();
      const responseJson = (await res.json()) as ApiResponseBase;

      if (!responseJson.success) {
        setIsSomethingLoading(false);
        return setError(responseJson as ErrorResponseAPIBase);
      }

      const { otpExpireTime } = responseJson as CambiarCorreoSuccessResponse;

      // Calcular y almacenar el timestamp de expiración absoluto
      const expirationTime = Math.floor(Date.now() / 1000) + otpExpireTime;
      setExpireTimestamp(expirationTime);

      // Iniciar el contador inmediatamente
      updateTimeRemaining(expirationTime);

      // Reiniciar contador de intentos y estado de intentos máximos al cambiar a pantalla de código
      setAttempts(0);
      setMaxAttemptsExceeded(false);

      // Cambiar al paso de ingreso de código
      setStep("code");
    } catch (err) {
      console.error("Error al solicitar cambio de correo:", err);
      setError({
        message: "Error al procesar la solicitud",
        success: false,
        errorType: RequestErrorTypes.REQUEST_FAILED,
      });
    } finally {
      setIsSomethingLoading(false);
    }
  };

  // Función para confirmar el código OTP
  const handleSubmitCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (maxAttemptsExceeded) {
      return; // No hacer nada si ya se excedieron los intentos máximos
    }

    if (!codigo || codigo.length === 0) {
      setError({
        message: "Ingresa el código de verificación",
        success: false,
        errorType: ValidationErrorTypes.REQUIRED_FIELDS,
      });
      return;
    }

    if (codigo.length < 6) {
      setError({
        message: "El código debe tener 6 dígitos",
        success: false,
        errorType: ValidationErrorTypes.INVALID_FORMAT,
      });
      return;
    }

    try {
      setIsSomethingLoading(true);
      setError(null);

      const fetchCancelable = await fetchSiasisAPI({
        endpoint: "/api/mis-datos/mi-correo/confirmar-correo",
        method: "POST",
        body: JSON.stringify({ codigo, nuevoCorreo }),
      });

      if (!fetchCancelable) throw new Error("Error en la solicitud");

      const res = await fetchCancelable.fetch();
      const responseJson = (await res.json()) as ApiResponseBase;

      if (!responseJson.success) {
        // Incrementar el contador de intentos fallidos
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        // Verificar si se ha excedido el número máximo de intentos
        if (newAttempts >= MAX_ATTEMPTS) {
          // Marcar que se han excedido los intentos máximos
          setMaxAttemptsExceeded(true);

          const maxAttemptsError: ErrorResponseAPIBase = {
            message: `Has excedido el número máximo de intentos (${MAX_ATTEMPTS}). El proceso será cancelado.`,
            success: false,
            errorType: AuthenticationErrorTypes.MAX_ATTEMPTS_EXCEEDED,
            details: { maxAttempts: MAX_ATTEMPTS },
          };

          setError(maxAttemptsError);

          // Establecer un temporizador para cerrar el modal después de mostrar el error
          if (maxAttemptsTimeoutRef.current) {
            clearTimeout(maxAttemptsTimeoutRef.current);
          }

          maxAttemptsTimeoutRef.current = setTimeout(() => {
            // Cerrar el modal
            eliminateModal();
          }, ERROR_DISPLAY_TIME);

          setIsSomethingLoading(false);
          return;
        }

        setIsSomethingLoading(false);
        return setError({
          ...(responseJson as ErrorResponseAPIBase),
          message: `Código incorrecto. Intento ${newAttempts} de ${MAX_ATTEMPTS}.`,
        });
      }

      // Actualizar el correo en el estado de la aplicación
      updateEmail(nuevoCorreo);

      // Llamar al callback de éxito si existe
      onSuccess?.();

      // Cerrar el modal
      eliminateModal();
    } catch (err) {
      console.error("Error al confirmar código:", err);
      setError({
        message: "Error al procesar la confirmación",
        success: false,
        errorType: RequestErrorTypes.REQUEST_FAILED,
      });
    } finally {
      setIsSomethingLoading(false);
    }
  };

  // Función para formatear el tiempo restante
  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Función para actualizar el contador de tiempo restante
  const updateTimeRemaining = (expirationTimestamp: number) => {
    const currentTime = Math.floor(Date.now() / 1000);
    const remaining = expirationTimestamp - currentTime;

    if (remaining <= 0) {
      setTimeRemaining("Expirado");
      setError({
        message: "El código ha expirado. Solicita uno nuevo.",
        success: false,
        errorType: TokenErrorTypes.TOKEN_EXPIRED,
      });

      // Limpiar el intervalo si existe
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      return;
    }

    setTimeRemaining(formatTimeRemaining(remaining));
  };

  // Efecto para iniciar y manejar el contador de tiempo
  useEffect(() => {
    // Limpiar cualquier intervalo existente
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Si estamos en el paso de código y tenemos un timestamp de expiración, iniciar el contador
    if (step === "code" && expireTimestamp) {
      // Actualizar inmediatamente
      updateTimeRemaining(expireTimestamp);

      // Configurar intervalo para actualizar cada segundo
      timerIntervalRef.current = setInterval(() => {
        updateTimeRemaining(expireTimestamp);
      }, 1000);
    }

    // Limpiar intervalo al desmontar
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      if (maxAttemptsTimeoutRef.current) {
        clearTimeout(maxAttemptsTimeoutRef.current);
        maxAttemptsTimeoutRef.current = null;
      }
    };
  }, [step, expireTimestamp]);

  // Función para prevenir el cierre del modal durante la verificación
  const handleClose = () => {
    if (isSomethingLoading) {
      return; // No hacer nada si está cargando
    }

    if (step === "code" && !maxAttemptsExceeded) {
      const confirmClose = window.confirm(
        "¿Estás seguro de que deseas cancelar el proceso de cambio de correo? Si cierras esta ventana, tendrás que iniciar de nuevo."
      );
      if (confirmClose) {
        eliminateModal();
      }
    } else {
      eliminateModal();
    }
  };

  return (
    <ModalContainer eliminateModal={handleClose}>
      <div className="flex flex-col items-center w-full max-w-[360px] mx-auto transition-all duration-300 ease-in-out gap-4">
        {/* Imagen de correo electrónico */}
        <img
          src="/images/svg/CorreoElectronico.svg"
          alt="Correo electrónico"
          className="w-24 aspect-square mb-2 sxs-only:w-12 sxs-only:h-12 xs-only:w-14 xs-only:h-14"
        />

        {step === "email" ? (
          <form
            onSubmit={handleSubmitEmail}
            className="w-full flex flex-col items-center"
          >
            <div className="w-full">
              <div className="bg-blue-100 p-3 rounded-md mb-3 flex items-start sxs-only:p-2 xs-only:p-2 lg-only:p-3 xl-only:p-3">
                <div className="text-blue-700 mr-2 text-base sxs-only:text-sm xs-only:text-sm">
                  <InformationIcon className="w-4 text-[#007BFF]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-700 leading-tight">
                    Cambio de Correo Electrónico
                  </h3>
                  <p className="text-xs text-blue-800 mt-0.5 leading-4">
                    Este correo es clave para recibir todas las notificaciones
                    importantes. Asegúrate de que el nuevo correo sea uno que
                    revises frecuentemente.
                  </p>
                </div>
              </div>

              <div className="relative mb-3">
                <input
                  type="email"
                  value={nuevoCorreo}
                  onChange={handleEmailChange}
                  placeholder="Ingresa tu nuevo correo aqui"
                  className="w-full px-3 py-2 text-center text-base border-2 border-red-500 rounded-[10px] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Mensaje de error */}
            {error && <ErrorMessage error={error} closable={true} />}

            {/* Botón de envío */}
            <BotonConIcono
              IconTSX={<></>}
              isSomethingLoading={isSomethingLoading}
              titleDisabled={`${
                isSomethingLoading
                  ? "Procesando Solicitud..."
                  : !isEmailValid
                  ? "Ingresa un correo valido"
                  : "No puede usar el boton ahora"
              }`}
              LoaderTSX={<Loader className="w-[1.3rem] p-[0.25rem] bg-negro" />}
              texto={isSomethingLoading ? "Enviando" : "Cambiar Correo"}
              typeButton="submit"
              className={`w-max font-semibold px-4 gap-3 py-2 rounded-md text-center text-base bg-amarillo-ediciones text-negro hover:grayscale-[0.2] transition-colors`}
              disabled={isSomethingLoading || !isEmailValid}
            />
          </form>
        ) : (
          <form
            onSubmit={handleSubmitCode}
            className="w-full flex flex-col items-center"
          >
            <div className="w-full mb-3 flex flex-col items-center">
              <p className="text-center text-negro text-sm leading-tight mb-2 sxs-only:text-xs xs-only:text-xs">
                Se ha enviado un código de verificación de 6 dígitos al correo
                electrónico que ingresaste. Por favor, ingresa el código para
                confirmar tu identidad antes de proceder con el cambio.
              </p>

              <div className="w-full bg-red-50 border border-red-200 p-2 rounded-md mb-3">
                <p className="text-center text-red-600 text-xs font-medium leading-tight">
                  Revisa tu bandeja de entrada y carpetas de spam.
                </p>
                <p className="text-center text-red-500 text-xs mt-0.5 font-medium leading-tight">
                  No cierres esta ventana hasta completar el proceso.
                </p>
              </div>

              {timeRemaining && !maxAttemptsExceeded && (
                <p className="text-center text-xs text-gray-600 mb-1">
                  Tiempo restante:{" "}
                  <span className="font-semibold">{timeRemaining}</span>
                </p>
              )}

              {attempts > 0 && !maxAttemptsExceeded && (
                <p className="text-center text-xs text-amber-600 mb-1 font-medium">
                  Intento {attempts} de {MAX_ATTEMPTS}
                </p>
              )}

              {/* Mostrar input y botón solo si no se han excedido los intentos máximos */}
              {!maxAttemptsExceeded && (
                <>
                  <div className="mb-2">
                    <input
                      type="text"
                      value={codigo}
                      onChange={handleCodeChange}
                      placeholder="Ingresa tu codigo aqui"
                      className="w-max px-3 py-2 text-center text-lg font-medium border-2 border-red-500 rounded-md focus:outline-none"
                      required
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="mb-3 w-full">
                <ErrorMessage error={error} closable={true} />
              </div>
            )}

            {/* Botón de aceptar - Solo mostrar si no se han excedido los intentos máximos */}
            {!maxAttemptsExceeded && (
              <BotonConIcono
                IconTSX={<></>}
                isSomethingLoading={isSomethingLoading}
                titleDisabled="Verificando código..."
                LoaderTSX={
                  <Loader className="w-[1.3rem] p-[0.25rem] bg-negro" />
                }
                texto={isSomethingLoading ? "Verificando" : "Aceptar"}
                typeButton="submit"
                className={`font-semibold w-max gap-3 px-4 py-2 rounded-md text-center text-base ${
                  isSomethingLoading || codigo.length < 6
                    ? "bg-gris-intermedio text-gris-oscuro cursor-not-allowed"
                    : "bg-amarillo-ediciones text-negro hover:grayscale-[0.2] transition-colors"
                }`}
                disabled={isSomethingLoading || codigo.length < 6}
              />
            )}
          </form>
        )}
      </div>
    </ModalContainer>
  );
};

export default CambioCorreoModal;
