// components/shared/layouts/NavBarFooter.tsx
"use client";
import LibretaConLapiz from "@/components/icons/LibretaConLapiz";
import PersonaLIbro from "@/components/icons/PersonaLibro";
import PizarraAula from "@/components/icons/PizarraAula";
import RelojTIempo from "@/components/icons/RelojTIempo";
import Auxiliar from "@/components/icons/Auxiliar";
import { RootState } from "@/global/store";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import InterceptedLinkForDataThatCouldBeLost from "../InterceptedLinkForDataThatCouldBeLost";

function getNavBarFooterByRol(Rol: RolesSistema): React.ReactNode {
  switch (Rol) {
    case RolesSistema.ProfesorPrimaria:
      return (
        <div
          className={`
            flex justify-center items-end
            w-full
            py-2 px-2
            bg-white/95
            rounded-t-2xl
            border-t border-gray-200
            shadow-[0_-12px_40px_0_rgba(0,0,0,0.22)]
            transition-all
            sxs-only:gap-2
            xs-only:gap-4
            sm-only:gap-8
            md-only:gap-10
            lg-only:gap-12
            xl-only:gap-16
            short-height:py-1
          `}
        >
          <InterceptedLinkForDataThatCouldBeLost
            href="/"
            className="flex flex-col items-center"
          >
            <LibretaConLapiz className="w-12 h-12" />
            <span className="mt-1 text-sm font-medium text-gray-700">
              Tomar Asistencia
            </span>
          </InterceptedLinkForDataThatCouldBeLost>
          <InterceptedLinkForDataThatCouldBeLost
            href="/"
            className="flex flex-col items-center"
          >
            <PizarraAula className="w-12 h-12" />
            <span className="mt-1 text-sm font-medium text-gray-700">
              Mi Aula
            </span>
          </InterceptedLinkForDataThatCouldBeLost>
          <InterceptedLinkForDataThatCouldBeLost
            href="/"
            className="flex flex-col items-center"
          >
            <PersonaLIbro className="w-12 h-12" />
            <span className="mt-1 text-sm font-medium text-gray-700">
              Mis asistencia
            </span>
          </InterceptedLinkForDataThatCouldBeLost>
        </div>
      );

    case RolesSistema.Auxiliar:
      return (
        <div
          className={`
            hidden lg:flex
            justify-center items-center
            w-full
            py-4 px-8
            bg-white
            shadow-[0_-6px_20px_0_rgba(0,0,0,0.12)]

            border-t border-gray-200
            gap-16
          `}
        >
          <InterceptedLinkForDataThatCouldBeLost
            href="/"
            className="flex flex-col items-center group transition-all duration-200"
          >
            <LibretaConLapiz className="w-12 h-12 text-black group-hover:text-red-500 transition-colors duration-200" />
            <span className="mt-2 text-sm font-medium text-black group-hover:text-red-500 transition-colors duration-200">
              Tomar Asistencia
            </span>
          </InterceptedLinkForDataThatCouldBeLost>
          
          <InterceptedLinkForDataThatCouldBeLost
            href="/"
            className="flex flex-col items-center group transition-all duration-200"
          >
            <Auxiliar className="w-12 h-12 text-black group-hover:text-red-500 transition-colors duration-200" />
            <span className="mt-2 text-sm font-medium text-black group-hover:text-red-500 transition-colors duration-200">
              Asistencias Escolares
            </span>
          </InterceptedLinkForDataThatCouldBeLost>
          
          <InterceptedLinkForDataThatCouldBeLost
            href="/"
            className="flex flex-col items-center group transition-all duration-200"
          >
            <PersonaLIbro className="w-12 h-12 text-black group-hover:text-red-500 transition-colors duration-200" />
            <span className="mt-2 text-sm font-medium text-black group-hover:text-red-500 transition-colors duration-200">
              Mis Asistencias
            </span>
          </InterceptedLinkForDataThatCouldBeLost>
        </div>
      );

    case RolesSistema.ProfesorSecundaria:
      return (
        <div
          className={`
            flex justify-center items-end
            w-full
            py-2 px-2
            bg-white/95
            rounded-t-2xl
            border-t border-gray-200
            shadow-[0_-12px_40px_0_rgba(0,0,0,0.22)]
            transition-all
            sxs-only:gap-4
            xs-only:gap-6
            sm-only:gap-10
            md-only:gap-14
            lg-only:gap-20
            xl-only:gap-28
            short-height:py-1
          `}
        >
          <InterceptedLinkForDataThatCouldBeLost
            href="/"
            className="flex flex-col items-center"
          >
            <RelojTIempo className="w-12 h-12" />
            <span className="mt-1 text-sm font-medium text-gray-700">
              Registrar Hora
            </span>
          </InterceptedLinkForDataThatCouldBeLost>
          <InterceptedLinkForDataThatCouldBeLost
            href="/"
            className="flex flex-col items-center"
          >
            <PersonaLIbro className="w-12 h-12" />
            <span className="mt-1 text-sm font-medium text-gray-700">
              Mis asistencia
            </span>
          </InterceptedLinkForDataThatCouldBeLost>
        </div>
      );

    case RolesSistema.Tutor:
      return (
        <div
          className={`
            flex justify-center items-end
            w-full
            py-2 px-2
            bg-white/95
            rounded-t-2xl
            border-t border-gray-200
            shadow-[0_-12px_40px_0_rgba(0,0,0,0.22)]
            transition-all
            sxs-only:gap-2
            xs-only:gap-4
            sm-only:gap-8
            md-only:gap-10
            lg-only:gap-12
            xl-only:gap-16
            short-height:py-1
          `}
        >
          <InterceptedLinkForDataThatCouldBeLost
            href="/"
            className="flex flex-col items-center"
          >
            <PizarraAula className="w-12 h-12" />
            <span className="mt-1 text-sm font-medium text-gray-700">
              Aula Tutor
            </span>
          </InterceptedLinkForDataThatCouldBeLost>
          <InterceptedLinkForDataThatCouldBeLost
            href="/"
            className="flex flex-col items-center"
          >
            <RelojTIempo className="w-12 h-12" />
            <span className="mt-1 text-sm font-medium text-gray-700">
              Registrar Hora
            </span>
          </InterceptedLinkForDataThatCouldBeLost>
          <InterceptedLinkForDataThatCouldBeLost
            href="/"
            className="flex flex-col items-center"
          >
            <PersonaLIbro className="w-12 h-12" />
            <span className="mt-1 text-sm font-medium text-gray-700">
              Mis asistencia
            </span>
          </InterceptedLinkForDataThatCouldBeLost>
        </div>
      );

    case RolesSistema.Responsable:
      return <div>Responsable</div>;

    case RolesSistema.PersonalAdministrativo:
      return <div>Personal Administrativo</div>;

    default:
      return <></>;
  }
}

const NavBarFooter = ({ Rol }: { Rol: RolesSistema }) => {
  const [montado, setMontado] = useState(false);

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
    <nav
      className={`animate__animated ${
        montado && navBarFooterIsOpen
          ? "animate__slideInUp"
          : "animate__slideOutDown"
      } [animation-duration:150ms] flex items-center justify-center w-[100vw] fixed z-[1001] bottom-0 left-0`}
    >
      {getNavBarFooterByRol(Rol)}
    </nav>
  );
};

export default NavBarFooter;