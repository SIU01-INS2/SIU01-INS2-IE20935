import { ReactElement } from "react";

interface BotonConIconoProps {
  className?: string;
  texto: string;
  IconTSX: ReactElement;
  onClick?: () => void;
  typeButton?: "submit" | "reset" | "button";
  disabled?: boolean;
  LoaderTSX?: ReactElement;
  isSomethingLoading?: boolean;
  titleDisabled?: string;
}

const BotonConIcono = ({
  disabled = false,
  texto,
  IconTSX,
  className = "",
  onClick,
  typeButton = "button",
  LoaderTSX,
  isSomethingLoading = false,
  titleDisabled,
}: BotonConIconoProps) => {
  return (
    <button
      disabled={disabled || isSomethingLoading}
      onClick={onClick}
      type={typeButton}
      title={
        disabled
          ? titleDisabled ?? "No puedes usar este boton ahora"
          : "Guarda tu cambios"
      }
      className={`rounded-[10px] flex flex-wrap items-center justify-center disabled:grayscale-[0.6] disabled:cursor-not-allowed ${className}`}
    >
      {texto} {isSomethingLoading ? LoaderTSX : IconTSX}
    </button>
  );
};

export default BotonConIcono;
