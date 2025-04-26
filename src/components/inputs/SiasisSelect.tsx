import React, { ReactNode, SelectHTMLAttributes } from "react";
import DespliegueIcon from "../icons/DespliegueIcon";

interface SiasisSelectProps {
  children: ReactNode;
  value: string | number;
  name?: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  placeholder?: string;
  selectAttributes?: SelectHTMLAttributes<HTMLSelectElement>;
}

const SiasisSelect: React.FC<SiasisSelectProps> = ({
  children,
  value,
  name,
  onChange,
  className = "",
  placeholder = "Seleccione una opción",
  selectAttributes,
}) => {
  return (
    <div className="relative inline-block w-full">
      <select
        {...selectAttributes}
        className={`appearance-none w-full font-normal
         px-2 py-1 rounded-md 
        shadow-sm focus:ring-2 focus:ring-negro
        bg-color-interfaz transition-colors pl-3 pr-8 cursor-pointer text-center text-white ${className}`}
        name={name}
        value={value}
        onChange={onChange}
      >
        <option className="text-gris-intermedio" value="" disabled>
          {placeholder}
        </option>
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <DespliegueIcon className="w-[1rem] text-white" title="" />
      </div>
    </div>
  );
};

export default SiasisSelect;
