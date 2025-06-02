"use client";

import { AppDispatch, RootState } from "@/global/store";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import InterceptedLinkForDataThatCouldBeLost from "../InterceptedLinkForDataThatCouldBeLost";
import allSiasisModules from "@/Assets/routes/modules.routes";
import { useDelegacionEventos } from "@/hooks/useDelegacionDeEventos";
import { setNavBarFooterHeight } from "@/global/state/ElementDimensions/navBarFooterHeight";
import { setSidebarIsOpen } from "@/global/state/Flags/sidebarIsOpen";

// Estilos uniformes para todos los contenedores de navegación
const getUniformContainerStyles = (itemsCount: number) => {
  const gapClasses = {
    1: "sxs-only:gap-8 xs-only:gap-12 sm-only:gap-16 md-only:gap-20 lg-only:gap-24 xl-only:gap-28",
    2: "sxs-only:gap-6 xs-only:gap-8 sm-only:gap-12 md-only:gap-16 lg-only:gap-20 xl-only:gap-24",
    3: "sxs-only:gap-4 xs-only:gap-6 sm-only:gap-8 md-only:gap-12 lg-only:gap-16 xl-only:gap-20",
  };

  return `
    flex items-center
    w-full
    py-5 px-4
    bg-white/95
    border-t border-gray-200
    transition-all duration-200
    ${gapClasses[itemsCount as keyof typeof gapClasses] || gapClasses[3]}
    short-height:py-4
    overflow-x-auto
    justify-center
    min-w-fit
    scrollbar-hide
    sm:justify-center
  `;
};

// Estilos uniformes para los elementos de navegación
const getUniformItemStyles = () => `
  flex flex-col items-center
  transition-all duration-200
  hover:transform hover:scale-105
  flex-shrink-0
  min-w-fit
`;

// Estilos uniformes para los iconos
const getUniformIconStyles = (isSelected: boolean = false) => `
  sxs-only:w-5 sxs-only:h-5
  xs-only:w-6 xs-only:h-6
  sm-only:w-7 sm-only:h-7
  md-only:w-8 md-only:h-8
  lg-only:w-9 lg-only:h-9
  xl-only:w-9 xl-only:h-9
  ${isSelected ? "text-color-interfaz" : "text-black"}
  transition-colors duration-200
`;

// Estilos uniformes para las etiquetas de texto
const getUniformLabelStyles = (isSelected: boolean = false) => `
  mt-1
  text-xs font-medium
  sxs-only:text-xs
  xs-only:text-xs
  sm-only:text-sm
  md-only:text-sm
  lg-only:text-sm
  xl-only:text-sm
  ${isSelected ? "text-color-interfaz" : "text-black"}
  transition-colors duration-200
  text-center leading-tight
  short-height:mt-0.5 short-height:text-xs
  whitespace-nowrap
`;

function getNavBarFooterByRol(
  Rol: RolesSistema,
  pathname: string
): React.ReactNode {
  // Filtrar módulos disponibles para el rol actual que estén activos
  const availableModules = allSiasisModules.filter(
    (module) => module.allowedRoles.includes(Rol) && module.active
  );

  if (availableModules.length === 0) {
    return <></>;
  }

  return (
    <div className={getUniformContainerStyles(availableModules.length)}>
      {availableModules.map((module, index) => {
        const isSelected = pathname.startsWith(module.route);

        return (
          <InterceptedLinkForDataThatCouldBeLost
            key={index}
            href={module.route}
            className={getUniformItemStyles()}
          >
            <module.IconTSX className={getUniformIconStyles(isSelected)} />
            <span className={getUniformLabelStyles(isSelected)}>
              {module.text}
            </span>
          </InterceptedLinkForDataThatCouldBeLost>
        );
      })}
    </div>
  );
}

const NavBarFooter = ({ Rol }: { Rol: RolesSistema }) => {
  const [montado, setMontado] = useState(false);
  const pathname = usePathname();

  const { delegarEvento } = useDelegacionEventos();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!delegarEvento) return;

    // Observer para actualizar la altura del header en el store
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        dispatch(
          setNavBarFooterHeight({
            value: parseFloat(getComputedStyle(entry.target).height),
          })
        );
      });
    });

    // Establecer navbarfooter abierto por defecto en movil
    if (window.innerWidth < 768) {
      dispatch(setSidebarIsOpen({ value: true }));
    }

    const navBarFooterHTML = document.getElementById("header");

    if (!navBarFooterHTML) return;
    resizeObserver.observe(navBarFooterHTML);

    return () => {
      resizeObserver.disconnect();
    };
  }, [delegarEvento, dispatch]);

  useEffect(() => {
    setMontado(true);
  }, []);

  const navBarFooterIsOpen = useSelector(
    (state: RootState) => state.flags.sidebarIsOpen
  );

  if (Rol == RolesSistema.Directivo) {
    return <></>;
  }

  return (
    <>
      <nav
        className={`shadow-[0_0_12px_4px_rgba(0,0,0,0.20)] 
        animate__animated fixed
        ${
          montado && navBarFooterIsOpen
            ? "animate__slideInUp sticky"
            : "animate__slideOutDown"
        } 
        [animation-duration:150ms] 
        flex items-center justify-center 
        max-w-[100vw] w-full 
         z-[101] bottom-0 left-0 bg-white
      `}
      >
        {getNavBarFooterByRol(Rol, pathname)}
      </nav>
    </>
  );
};

export default NavBarFooter;
