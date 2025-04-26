import React, { useEffect, useState } from "react";

interface SuccessMessageProps {
  message: string;
  className?: string;
  duration?: number; // en milisegundos
  closable?: boolean;
}

const SuccessMessage = ({
  message,
  className = "",
  duration,
  closable = false,
}: SuccessMessageProps) => {
  const [visible, setVisible] = useState(true);

  // Efecto para desaparecer automáticamente si se proporciona duration
  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  if (!visible) return null;

  return (
    <div
      className={`w-full min-w-0 max-w-full relative  rounded-md overflow-hidden bg-[#F0FFF4] border-l-4 border-verde-principal ${className}`}
      role="alert"
    >
      <div className="flex items-center py-2 px-3 sxs-only:px-2 xs-only:px-2">
        <div className="flex-shrink-0 mr-2 sxs-only:mr-1.5 xs-only:mr-1.5">
          <div className="flex items-center justify-center w-6 h-6 sxs-only:w-5 sxs-only:h-5 xs-only:w-5 xs-only:h-5 rounded-full bg-verde-principal text-white">
            <SuccessIcon className="w-4 h-4 sxs-only:w-3 sxs-only:h-3 xs-only:w-3 xs-only:h-3" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h5 className="font-medium text-sm sxs-only:text-xs xs-only:text-xs text-gris-oscuro truncate">Éxito</h5>
            <span className="block sxs-only:hidden xs-only:hidden sm-only:hidden text-gris-intermedio text-xs">•</span>
            <p className="text-xs sxs-only:hidden xs-only:hidden sm-only:hidden text-gris-oscuro truncate">{message}</p>
          </div>
          <div className="md:hidden lg:hidden xl-only:hidden text-xs text-gris-oscuro mt-0.5 line-clamp-2">{message}</div>
        </div>

        {/* Botón para cerrar si closable es true */}
        {closable && (
          <button
            type="button"
            className="ml-1.5 p-1 rounded-md text-gris-intermedio hover:bg-gris-claro hover:text-gris-oscuro transition-colors"
            onClick={() => setVisible(false)}
            aria-label="Cerrar"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

// Icono de éxito
const SuccessIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

// Icono para cerrar
const CloseIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export default SuccessMessage;