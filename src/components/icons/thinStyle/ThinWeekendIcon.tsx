import { IconProps } from "@/interfaces/IconProps";
import React from "react";

const ThinWeekendIcon = ({ className, title }: IconProps) => {
  return (
    <div title={title}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`aspect-square ${className}`}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        <path d="M12 2v2" />
        <path d="M12 6v2" />
        <path d="m15.2 10.7-1.4 1.4" />
        <path d="m8.2 10.7 1.4 1.4" />
        <path d="M16 12a4 4 0 0 1-8 0" />
        <path d="M17 17H7l1.5 4h3L13 17Z" />
        <path d="M18 5c1.2 0 3 .6 3 3a3 3 0 0 1-3 3" />
        <path d="M6 5c-1.2 0-3 .6-3 3a3 3 0 0 0 3 3" />
      </svg>
    </div>
  );
};

export default ThinWeekendIcon;
