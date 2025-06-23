import React, {
  Dispatch,
  InputHTMLAttributes,
  ReactElement,
  SelectHTMLAttributes,
  SetStateAction,
} from "react";
import SiasisSelect from "../inputs/SiasisSelect";
import SiasisInputText from "../inputs/SiasisInputText";

// Definición clara de la interfaz de propiedades
interface DatoFormularioConEtiquetaProps<R> {
  // Propiedades básicas
  etiqueta: string;
  savedValue?: string | number | null;
  modificatedValue?: string | number | null;
  nombreDato?: keyof R;
  isSomethingLoading: boolean;

  // Propiedades de comportamiento
  modificable?: boolean;
  modoEdicion?: boolean;
  modificableConModal?: boolean;
  savedValueOculto?: boolean;
  fullWidth?: boolean;

  // Propiedades visuales
  className?: string;
  skeletonClassName?: { className: string };
  IconTSX?: ReactElement;

  // Propiedades de tipo de entrada
  inputType?: "text" | "select" | "tel";
  selectValues?: Record<string, string>;

  // Propiedades de control
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  setModalVisibility?: Dispatch<SetStateAction<boolean>>;

  // Propiedades HTML nativas
  inputAttributes?: InputHTMLAttributes<HTMLInputElement>;
  selectAttributes?: SelectHTMLAttributes<HTMLSelectElement>;
}

const DatoFormularioConEtiqueta = <R,>({
  // Destructuración organizada por categorías
  // Propiedades básicas
  etiqueta,
  savedValue,
  modificatedValue,
  nombreDato,
  isSomethingLoading,

  // Propiedades de comportamiento
  modificable = false,
  modoEdicion = false,
  modificableConModal = false,
  savedValueOculto = false,
  fullWidth = false,

  // Propiedades visuales
  className = "",
  skeletonClassName,
  IconTSX,

  // Propiedades de tipo de entrada
  inputType = "text",
  selectValues,

  // Propiedades de control
  onChange,
  setModalVisibility,

  // Propiedades HTML nativas
  inputAttributes,
  selectAttributes,
}: DatoFormularioConEtiquetaProps<R>) => {
  // Clases comunes para tamaños responsivos
  const textoResponsivo =
    "sxs-only:text-[0.77rem] xs-only:text-[0.81rem] sm-only:text-[0.86rem] md-only:text-[0.9rem] lg-only:text-[0.95rem] xl-only:text-[0.99rem]";

  // Clases para texto "No registrado" (15% más pequeño pero que resalte)
  const textoNoRegistrado =
    "sxs-only:text-[0.65rem] xs-only:text-[0.69rem] sm-only:text-[0.73rem] md-only:text-[0.77rem] lg-only:text-[0.8rem] xl-only:text-[0.85rem] text-gray-500 italic font-medium";

  // Función para renderizar el botón modal (para evitar duplicación)
  const renderBotonModal = () => (
    <div
      className="cursor-pointer flex items-center justify-center bg-amarillo-ediciones rounded-[50%] aspect-square 
        sxs-only:w-[1.49rem] xs-only:w-[1.58rem] sm-only:w-[1.68rem] md-only:w-[1.78rem] lg-only:w-[1.88rem] xl-only:w-[1.98rem]
        transition-all hover:bg-yellow-400 ml-1"
      onClick={() => setModalVisibility?.(true)}
    >
      {IconTSX}
    </div>
  );

  // Determinar si se debe mostrar el campo de edición
  const mostrarInputEdicion =
    modificable && modoEdicion && onChange && modificatedValue !== undefined;

  // Determinar si se debe mostrar el skeleton
  // Mostramos el skeleton si:
  // 1. No es savedValueOculto (porque en ese caso no queremos mostrar nada relacionado con el valor)
  // 2. El savedValue no está definido (undefined o null)
  // 3. Algo está cargando (isSomethingLoading)
  const mostrarSkeleton =
    !savedValueOculto && savedValue === undefined && isSomethingLoading;

  return (
    <label
      className={`flex ${
        savedValueOculto && savedValue !== undefined
          ? "flex-row items-center"
          : "flex-col"
      } gap-[0.2rem] 
        sxs-only:text-[0.68rem] xs-only:text-[0.68rem] sm-only:text-[0.72rem] md-only:text-[0.77rem] lg-only:text-[0.9rem] xl-only:text-[0.86rem]
        font-normal -text-gray-600
        ${fullWidth ? "min-w-full" : ""}`}
    >
      {/* Etiqueta del campo */}
      {etiqueta}:
      {/* Botón de edición (cuando el valor está oculto pero definido) */}
      {savedValueOculto &&
        savedValue !== undefined &&
        modificableConModal &&
        renderBotonModal()}
      {/* Contenedor del valor o input */}
      <div
        className={`min-h-[1.5rem] 
          sxs-only:min-h-[1.26rem] xs-only:min-h-[1.35rem] sm-only:min-h-[1.44rem] md-only:min-h-[1.53rem] lg-only:min-h-[1.62rem] xl-only:min-h-[1.71rem]
          ${textoResponsivo}
          font-normal text-black
          ${
            mostrarSkeleton ||
            (savedValueOculto && savedValue === undefined && isSomethingLoading)
              ? `skeleton sxs-only:min-w-[4.5rem] xs-only:min-w-[5rem] sm-only:min-w-[5.4rem] md-only:min-w-[5.9rem] lg-only:min-w-[6.3rem] xl-only:min-w-[6.8rem] ${skeletonClassName?.className}`
              : ""
          }`}
      >
        {/* Caso 1: Mostrar input de edición */}
        {mostrarInputEdicion && (
          <>
            {inputType === "text" ? (
              <SiasisInputText
                inputAttributes={inputAttributes}
                value={modificatedValue ?? ""}
                name={nombreDato as string}
                onChange={onChange}
                className={className ?? textoResponsivo}
                placeholder={`Ingrese ${etiqueta.toLowerCase()}`}
              />
            ) : inputType === "select" ? (
              <SiasisSelect
                selectAttributes={selectAttributes}
                value={modificatedValue ?? ""}
                name={nombreDato as string}
                onChange={onChange}
                className={className ?? textoResponsivo}
                placeholder={`Seleccione ${etiqueta.toLowerCase()}`}
              >
                <option value="" disabled>
                  Pendiente de selección
                </option>
                {selectValues &&
                  Object.entries(selectValues).map(([value, text]) => (
                    <option key={value} value={value}>
                      {text}
                    </option>
                  ))}
              </SiasisSelect>
            ) : // : inputType === "tel" ? (
            //   <SiasisInputTel
            //     inputAttributes={inputAttributes}
            //     value={modificatedValue ?? ""}
            //     name={nombreDato as string}
            //     onChange={onChange}
            //     className={className ?? textoResponsivo}
            //     placeholder={`Ingrese ${etiqueta.toLowerCase()}`}
            //   />
            // )

            null}
          </>
        )}

        {/* Caso 2: Mostrar "No registrado" cuando savedValue es null */}
        {!mostrarInputEdicion && savedValue === null && !savedValueOculto && (
          <span
            className={`w-max max-w-full break-words
                ${
                  modificableConModal
                    ? "flex flex-wrap items-center gap-1.5"
                    : ""
                }  
                ${textoNoRegistrado}`}
          >
            No registrado
            {/* Botón de edición modal */}
            {modificableConModal && renderBotonModal()}
          </span>
        )}

        {/* Caso 3: Mostrar valor guardado (no en modo edición y no oculto) */}
        {!mostrarInputEdicion &&
          savedValue !== undefined &&
          savedValue !== null &&
          !savedValueOculto && (
            <span
              className={`w-max max-w-full break-words font-normal
                ${
                  modificableConModal
                    ? "flex flex-wrap items-center gap-1.5"
                    : ""
                }  
                ${className ?? textoResponsivo}`}
            >
              {/* Mostrar valor según el tipo */}
              {selectValues ? selectValues[savedValue as string] : savedValue}

              {/* Botón de edición modal */}
              {modificableConModal && renderBotonModal()}
            </span>
          )}
      </div>
    </label>
  );
};

export default DatoFormularioConEtiqueta;
