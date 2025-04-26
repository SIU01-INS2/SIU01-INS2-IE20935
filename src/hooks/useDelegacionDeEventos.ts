// delegacionDeEventos.ts
import { TypeEventAvailable } from "@/lib/utils/interfaces/TypeEventAvailable";
import { useEffect, useState } from "react";


export const useDelegacionEventos = () => {
  const [delegarEvento, setDelegarEvento] =
    useState<
      (
        typeEvent: TypeEventAvailable,
        querySelectorOrElement: string | HTMLElement,
        callback: (e: Event) => void,
        except?: boolean
      ) => number
    >();
  const [eliminarEvento, setEliminarEvento] =
    useState<(typeEvent: TypeEventAvailable, idEvento: number) => void>();

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("../lib/utils/delegacionEventos").then(({ initializeDelegacion }) => {
        const {
          delegarEvento: delegarEventoRec,
          eliminarEventoDelegado: eliminarEventoRec,
        } = initializeDelegacion();

        setDelegarEvento(() => delegarEventoRec);
        setEliminarEvento(() => eliminarEventoRec);
      });
    }
  }, []);

  return { delegarEvento, eliminarEvento };
};
