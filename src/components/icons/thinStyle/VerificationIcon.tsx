import { IconProps } from "@/interfaces/IconProps";
import React from "react";

const VerificationIcon = ({ className, title }: IconProps) => {
  return (
    <div title={title}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`aspect-square ${className}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          className="fill-current"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
  );
};

export default VerificationIcon;
