import React, { useState, useEffect } from "react";
import OjoTachadoIcon from "../icons/OjoTachadoIcon";
import OjoIcon from "../icons/OjoIcon";

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  helperText?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  value,
  onChange,
  label,
  required = false,
  minLength,
  maxLength,
  helperText,
  className = "",
  labelClassName = "",
  inputClassName = "",
}) => {
  const [mostrarPassword, setMostrarPassword] = useState<boolean>(false);
  const [isEdgeBrowser, setIsEdgeBrowser] = useState<boolean>(false);

  // Detectar si estamos en Microsoft Edge
  useEffect(() => {
    // Verificamos si estamos en el navegador y si es Edge
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent;

      // Microsoft Edge tiene "Edg/" o "Edge/" en el user agent
      const isEdge =
        userAgent.indexOf("Edg") !== -1 || userAgent.indexOf("Edge") !== -1;
      setIsEdgeBrowser(isEdge);
    }
  }, []);

  return (
    <div className={`mb-4 w-full ${className}`}>
      <label
        htmlFor={id}
        className={`block text-negro font-semibold mb-1 text-base sxs-only:text-sm xs-only:text-sm ${labelClassName}`}
      >
        {label}
      </label>
      <div className="relative">
        <input
          placeholder="Escribe Aqui"
          type={mostrarPassword ? "text" : "password"}
          id={id}
          value={value}
          onChange={onChange}
          className={`w-full px-3 py-2 placeholder:text-gris-oscuro text-base border-2 border-red-500 rounded-[10px] focus:outline-none ${inputClassName}`}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
        />
        {/* Solo mostrar el botón de ojo si NO estamos en Edge */}
        {!isEdgeBrowser && (
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            onClick={() => setMostrarPassword(!mostrarPassword)}
          >
            {mostrarPassword ? (
              <OjoTachadoIcon className="w-[1.5rem]" />
            ) : (
              <OjoIcon className="w-[1.5rem]" />
            )}
          </button>
        )}
      </div>
      {helperText && (
        <p className="text-xs text-gray-500 mt-1 sxs-only:text-[10px] xs-only:text-[10px]">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default PasswordInput;
