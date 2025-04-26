/* eslint-disable @next/next/no-img-element */
import { Julee } from "next/font/google";
import React from "react";
import InterceptedLinkForDataThatCouldBeLost from "../InterceptedLinkForDataThatCouldBeLost";

// Inicializar la fuente Julee
const julee = Julee({
  weight: "400", // Ajusta según las opciones disponibles para esta fuente
  subsets: ["latin"],
  display: "swap",
});
const LogoCabecera = () => {
  return (
    <InterceptedLinkForDataThatCouldBeLost href="/" className="pointer flex items-center gap-2 max-w-[10rem] justify-center bg-white rounded-[10px] px-3 py-2">
      <img
        src="/images/svg/Logo.svg"
        alt="Colegio Asuncion 8 Logo"
        className="w-[3.2rem]"
      />

      <span className={`${julee.className} text-[1.1rem] max-sm:hidden`}>Asunción 8 20935</span>
    </InterceptedLinkForDataThatCouldBeLost>
  );
};

export default LogoCabecera;
