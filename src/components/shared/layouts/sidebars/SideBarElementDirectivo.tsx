"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import InterceptedLinkForDataThatCouldBeLost from "../../InterceptedLinkForDataThatCouldBeLost";
import { SiasisModule } from "@/Assets/routes/modules.routes";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";

const SideBarElementDirectivo = ({
  IconTSX,
  route,
  text,
  allowedRoles,
  etiquetaSuperior,
}: SiasisModule) => {
  const pathName = usePathname();

  const [renderizar, setRenderizar] = useState(false);

  useEffect(() => {
    if (allowedRoles.indexOf(RolesSistema.Directivo) === -1) {
      setRenderizar(() => false);
    } else {
      setRenderizar(() => true);
    }
  }, []);

  const isSelected = pathName.startsWith(`${route}`);

  return renderizar ? (
    <>
      {etiquetaSuperior && (
        <span className="ml-5 mt-5 mb-2 text-[0.8rem]">
          {etiquetaSuperior}
        </span>
      )}

      <InterceptedLinkForDataThatCouldBeLost href={`${route}`}>
        <li
          className={`flex items-center pl-4 pr-7 overflow-hidden min-w-[11rem] max-w-[22rem] ${
            !isSelected && "hover:bg-gray-200"
          } py-1.5`}
          title={text}
        >
          <span
            className={`flex items-center border-l-[3px] ${
              isSelected ? "border-color-interfaz" : "border-transparent"
            } pl-4 gap-x-3`}
          >
            <IconTSX
              className={`aspect-auto w-4 ${
                isSelected ? "text-color-interfaz" : "text-negro"
              }`}
            />

            <span
              className={`w-max text-[0.85rem] text-ellipsis text-nowrap ${
                isSelected && "text-color-interfaz overflow-hidden"
              }`}
            >
              {text}
            </span>
          </span>
        </li>
      </InterceptedLinkForDataThatCouldBeLost>
    </>
  ) : (
    <></>
  );
};

export default SideBarElementDirectivo;