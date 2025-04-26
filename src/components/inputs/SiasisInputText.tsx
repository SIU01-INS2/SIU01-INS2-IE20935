import React, {  InputHTMLAttributes } from "react";

interface SiasisInputTextProps {
  value: string | number;
  name?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
  type?: "text" | "number" | "email" | "password" | "tel";
  inputAttributes?: InputHTMLAttributes<HTMLInputElement>;
}

const SiasisInputText: React.FC<SiasisInputTextProps> = ({
  value,
  name,
  onChange,
  className = "",
  placeholder = "",
  type = "text",
  inputAttributes,
}) => {
  return (
    <input

      {...inputAttributes}
      className={`
        w-full font-normal
        sxs-only:max-w-[7rem] xs-only:max-w-[8rem] sm-only:max-w-[9rem] md-only:max-w-[10rem] lg-only:max-w-[11rem] xl-only:max-w-[12rem]
        border-2 border-color-interfaz px-2 py-1 rounded-md 
        shadow-sm focus:ring-2 focus:ring-amarillo-ediciones focus:border-amarillo-ediciones
        bg-white/90 hover:bg-white transition-colors
        ${className}
      `}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
};

export default SiasisInputText;
