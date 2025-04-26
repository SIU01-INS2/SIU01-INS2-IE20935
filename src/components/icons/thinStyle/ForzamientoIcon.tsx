import { IconProps } from "@/interfaces/IconProps";
import React from "react";

const ForzamientoIcon = ({ className, title }: IconProps) => {
  return (
    <div title={title}>
      {" "}
      <svg
        className={`aspect-square ${className}`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 12.68V11.32C4 9.36 4 8.38 4.435 7.598C4.819 6.91 5.41 6.319 6.098 5.935C6.88 5.5 7.86 5.5 9.82 5.5H14.18C16.14 5.5 17.12 5.5 17.902 5.935C18.59 6.319 19.181 6.91 19.565 7.598C20 8.38 20 9.36 20 11.32V12.68C20 14.64 20 15.62 19.565 16.402C19.181 17.09 18.59 17.681 17.902 18.065C17.12 18.5 16.14 18.5 14.18 18.5H9.82C7.86 18.5 6.88 18.5 6.098 18.065C5.41 17.681 4.819 17.09 4.435 16.402C4 15.62 4 14.64 4 12.68Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M16.5 10.5H7.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M14.5 13.5H9.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default ForzamientoIcon;
