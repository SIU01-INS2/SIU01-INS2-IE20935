"use client";
import LibretaConLapiz from "@/components/icons/LibretaConLapiz";
import { RootState } from "@/global/store";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

function getNavBarFooterByRol(Rol: RolesSistema): React.ReactNode {
  switch (Rol) {
    case RolesSistema.ProfesorPrimaria:
      return <div>Profesor Primaria</div>;
    case RolesSistema.Auxiliar:
      return (
        <div>
          <LibretaConLapiz className="w-[7rem] " />
        </div>
      );
    case RolesSistema.ProfesorSecundaria:
      return <div>Profesor Secundaria</div>;
    case RolesSistema.Tutor:
      return <div>Profesor Tutor</div>;
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
        montado && navBarFooterIsOpen ? "animate__slideInUp" : "animate__slideOutDown"
      } [animation-duration:150ms] flex items-center justify-center w-[100vw] border-2 border-negro fixed z-[1001] bottom-0 left-0`}
    >
      {getNavBarFooterByRol(Rol)}
    </nav>
  );
};

export default NavBarFooter;
