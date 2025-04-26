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
  savedValue?: string | number;
  modificatedValue?: string | number;
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
  inputType?: "text" | "select";
  selectValues?: Record<string, string>;
  
  // Propiedades de control
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
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
  const textoResponsivo = "sxs-only:text-[0.85rem] xs-only:text-[0.9rem] sm-only:text-[0.95rem] md-only:text-[1rem] lg-only:text-[1.05rem] xl-only:text-[1.1rem]";
  
  // Función para renderizar el botón modal (para evitar duplicación)
  const renderBotonModal = () => (
    <div
      className="cursor-pointer flex items-center justify-center bg-amarillo-ediciones rounded-[50%] aspect-square 
        sxs-only:w-[1.5rem] xs-only:w-[1.6rem] sm-only:w-[1.7rem] md-only:w-[1.8rem] lg-only:w-[1.9rem] xl-only:w-[2rem]
        transition-all hover:bg-yellow-400 ml-1"
      onClick={() => setModalVisibility?.(true)}
    >
      {IconTSX}
    </div>
  );

  // Determinar si se debe mostrar el campo de edición
  const mostrarInputEdicion = modificable && modoEdicion && onChange && modificatedValue;
  
  // Determinar si se debe mostrar el skeleton
  // Mostramos el skeleton si:
  // 1. No es savedValueOculto (porque en ese caso no queremos mostrar nada relacionado con el valor)
  // 2. El savedValue no está definido (undefined o null)
  // 3. Algo está cargando (isSomethingLoading)
  const mostrarSkeleton = !savedValueOculto && savedValue === undefined && isSomethingLoading;

  return (
    <label
      className={`flex ${
        savedValueOculto && savedValue !== undefined ? "flex-row items-center" : "flex-col"
      } gap-[0.2rem] 
        sxs-only:text-[0.rem] xs-only:text-[0.75rem] sm-only:text-[0.8rem] md-only:text-[0.85rem] lg-only:text-[1rem] xl-only:text-[0.95rem]
        font-normal -text-gray-600
        ${fullWidth ? "min-w-full" : ""}`}
    >
      {/* Etiqueta del campo */}
      {etiqueta}:
      
      {/* Botón de edición (cuando el valor está oculto pero definido) */}
      {savedValueOculto && savedValue !== undefined && modificableConModal && renderBotonModal()}
      
      {/* Contenedor del valor o input */}
      <div
        className={`min-h-[1.5rem] 
          sxs-only:min-h-[1.4rem] xs-only:min-h-[1.5rem] sm-only:min-h-[1.6rem] md-only:min-h-[1.7rem] lg-only:min-h-[1.8rem] xl-only:min-h-[1.9rem]
          ${textoResponsivo}
          font-normal text-black
          ${
            mostrarSkeleton || (savedValueOculto && savedValue === undefined && isSomethingLoading)
              ? `skeleton sxs-only:min-w-[5rem] xs-only:min-w-[5.5rem] sm-only:min-w-[6rem] md-only:min-w-[6.5rem] lg-only:min-w-[7rem] xl-only:min-w-[7.5rem] ${skeletonClassName?.className}`
              : ""
          }`}
      >
        {/* Caso 1: Mostrar input de edición */}
        {mostrarInputEdicion && (
          <>
            {inputType === "text" ? (
              <SiasisInputText
                inputAttributes={inputAttributes}
                value={modificatedValue}
                name={nombreDato as string}
                onChange={onChange}
                className={className ?? textoResponsivo}
                placeholder={`Ingrese ${etiqueta.toLowerCase()}`}
              />
            ) : inputType === "select" ? (
              <SiasisSelect
                selectAttributes={selectAttributes}
                value={modificatedValue || ""}
                name={nombreDato as string}
                onChange={onChange}
                className={className ?? textoResponsivo}
                placeholder={`Seleccione ${etiqueta.toLowerCase()}`}
              >
                {selectValues &&
                  Object.entries(selectValues).map(([value, text]) => (
                    <option key={value} value={value}>
                      {text}
                    </option>
                  ))}
              </SiasisSelect>
            ) : null}
          </>
        )}
        
        {/* Caso 2: Mostrar valor guardado (no en modo edición y no oculto) */}
        {!mostrarInputEdicion && savedValue !== undefined && !savedValueOculto && (
          <span
            className={`w-max max-w-full break-words font-normal
                ${modificableConModal ? "flex flex-wrap items-center gap-1.5" : ""}  
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