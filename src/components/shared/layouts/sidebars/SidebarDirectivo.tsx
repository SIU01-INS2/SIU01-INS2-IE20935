"use client";

import allSiasisModules from "@/Assets/routes/modules.routes";
import { RootState } from "@/global/store";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import SideBarElementDirectivo from "./SideBarElementDirectivo";
import { switchSidebarIsOpen } from "@/global/state/Flags/sidebarIsOpen";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";

const SidebarDirectivo = () => {
  const dispatch = useDispatch();

  const pathname = usePathname();
  const isLoginPage = pathname.startsWith("/login");

  const headerHeight = useSelector(
    (state: RootState) => state.elementsDimensions.headerHeight
  );
  const windowHeight = useSelector(
    (state: RootState) => state.elementsDimensions.windowHeight
  );

  const windowWidth = useSelector(
    (state: RootState) => state.elementsDimensions.windowWidth
  );

  const sidebarIsOpen = useSelector(
    (state: RootState) => state.flags.sidebarIsOpen
  );

  // Filtrar módulos activos y permitidos para Directivo
  const activeModulesForDirectivo = allSiasisModules.filter(
    (module) => 
      module.active && 
      module.allowedRoles.includes(RolesSistema.Directivo)
  );

  return isLoginPage ? (
    <></>
  ) : (
    <>
      <nav
        id="sidebar"
        className={`w-min sticky left-0 overflow-auto bg-white top-0 max-h-full`}
        onClick={() => {
          if (windowWidth < 768) dispatch(switchSidebarIsOpen());
        }}
      >
        <ul id="sidebar-ul" className="flex flex-col py-3.5">
          {activeModulesForDirectivo.map((props, index) => {
            return <SideBarElementDirectivo key={index} {...props} />;
          })}
        </ul>
      </nav>
      <style>
        {`
        #sidebar{
          width: max-content;
          max-width: 100vw;
          box-shadow: 1px 0 4px 2px #00000020;
          top:${headerHeight}px;                           
          height: ${windowHeight - headerHeight}px;
          max-height: ${windowHeight - headerHeight}px;      
          display: ${
            sidebarIsOpen ? "block" : "none"
          };                                 
        }

        #sidebar-ul{
          background-color: white;
          height: 100%;
          width: 100%;
        }

        @media screen and (max-width: 768px){
          #sidebar{
            width: 100vw;
            position: fixed;
            top: 0;
            min-height: 100dvh;
            left: 0;        
            background-color:${sidebarIsOpen ? "#00000080" : "transparent"};
            z-index: 10000;
          }

          #sidebar-ul{
            background-color: white;
            height: 100%;
            width: max-content;
            max-width: 80%;
          }
        }                  
    `}
      </style>
    </>
  );
};

export default SidebarDirectivo;