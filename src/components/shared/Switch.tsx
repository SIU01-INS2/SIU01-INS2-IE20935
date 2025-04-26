import React, { forwardRef, useState, useEffect } from "react";

interface SwitchProps {
  className?: string;
  labelClassName?: string;
  toggleSize?: "sm" | "md" | "lg";
  trackColor?: string;
  activeColor?: string;
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  toggleGap?: number; // Nueva propiedad para controlar el espacio
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      labelClassName,
      className = "",
      toggleSize = "md",
      trackColor = "bg-gray-300",
      activeColor = "bg-blue-600",
      label,
      checked = false,
      onChange,
      disabled = false,
      toggleGap = 2, // Valor predeterminado de 2px
    },
    ref
  ) => {
    // Estado interno que se sincroniza con la prop checked
    const [isChecked, setIsChecked] = useState(checked);

    // Sincronizar el estado interno cuando cambia la prop checked
    useEffect(() => {
      setIsChecked(checked);
    }, [checked]);

    // Manejar el cambio interno y propagar el evento
    const handleChange = (e: React.MouseEvent) => {
      // Detener la propagación para evitar múltiples activaciones
      e.stopPropagation();

      if (disabled) return;

      const newValue = !isChecked;
      setIsChecked(newValue);

      if (onChange) {
        onChange(newValue);
      }
    };

    // Manejar cambio desde el input nativo
    const handleInputChange = () => {
      if (disabled) return;

      const newValue = !isChecked;
      setIsChecked(newValue);

      if (onChange) {
        onChange(newValue);
      }
    };

    // Definir tamaños
    const sizes = {
      sm: {
        track: "w-8 h-4",
        toggle: "w-3 h-3",
        translateX: "translate-x-4",
      },
      md: {
        track: "w-11 h-6",
        toggle: "w-5 h-5",
        translateX: "translate-x-5",
      },
      lg: {
        track: "w-14 h-7",
        toggle: "w-6 h-6",
        translateX: "translate-x-7",
      },
    };

    const { track, toggle, translateX } = sizes[toggleSize];

    return (
      <div
        className={`inline-flex gap-3 flex-wrap items-center ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        } ${className}`}
      >
        {label && (
          <span
            className={` font-medium ${labelClassName}`}
            onClick={handleChange}
          >
            {label}
          </span>
        )}
        <div
          className="relative"
          onClick={handleChange}
          role="switch"
          aria-checked={isChecked}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!disabled) {
                const newValue = !isChecked;
                setIsChecked(newValue);
                if (onChange) onChange(newValue);
              }
            }
          }}
        >
          <input
            type="checkbox"
            className="sr-only"
            ref={ref}
            checked={isChecked}
            onChange={handleInputChange}
            disabled={disabled}
          />
          <div
            className={`${track} ${
              isChecked ? activeColor : trackColor
            } rounded-full transition-colors duration-200 ease-in-out`}
          ></div>
          <div
            style={{ top: `${toggleGap}px`, left: `${toggleGap}px` }}
            className={`
            absolute ${toggle} 
            bg-white rounded-full shadow transition-transform duration-200 ease-in-out
            ${isChecked ? translateX : ""}
          `}
          ></div>
        </div>
      </div>
    );
  }
);

Switch.displayName = "Switch";

export default Switch;
