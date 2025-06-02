"use client";
import { DatosAsistenciaHoyIDB } from "@/lib/utils/local/db/models/DatosAsistenciaHoy/DatosAsistenciaHoyIDB";
import { HandlerAsistenciaBase } from "@/lib/utils/local/db/models/DatosAsistenciaHoy/handlers/HandlerDatosAsistenciaBase";

import { T_Comunicados } from "@prisma/client";
import React, { useEffect, useState } from "react";
import ComunicadoModal from "./ComunicadoModal";

export const SE_MOSTRARON_COMUNICADOS_DE_HOY_KEY = "comunicados-de-hoy-SHOWED";
export const SE_MOSTRARON_COMUNICADOS_DE_HOY_VALOR_INICIAL = "false";

const ComunicadosDeHoy = () => {
  const [comunicados, setComunicados] = useState<T_Comunicados[]>([]);
  const [mostrarComunicados, setMostrarComunicados] = useState(false);
  const [comunicadosVisibles, setComunicadosVisibles] = useState<{
    [key: number]: boolean;
  }>({});

  const getComunicadosDeHoy = async () => {
    try {
      const datosAsistenciaHoyDirectivoIDB = new DatosAsistenciaHoyIDB();

      const handlerAsistenciaResponse =
        (await datosAsistenciaHoyDirectivoIDB.getHandler()) as HandlerAsistenciaBase;

      if (!handlerAsistenciaResponse) {
        console.warn(
          "No se pudo obtener el handler de asistencia para obtener comunicados. Reintentando en 2.5 segundos..."
        );
        setTimeout(() => {
          getComunicadosDeHoy();
        }, 2500);

        return;
      }

      const comunicadosDeHoy = handlerAsistenciaResponse.getComunicados();
      console.info("Comunicados de hoy obtenidos:", comunicadosDeHoy);

      // Ordenar comunicados por fecha de conclusión (los que vencen primero aparecen primero)
      const comunicadosOrdenados = comunicadosDeHoy.sort((a, b) => {
        const fechaA = new Date(a.Fecha_Conclusion);
        const fechaB = new Date(b.Fecha_Conclusion);
        return fechaA.getTime() - fechaB.getTime();
      });

      setComunicados(comunicadosOrdenados);

      // Inicializar el estado de visibilidad de todos los comunicados como visible
      const estadoVisibilidad: { [key: number]: boolean } = {};
      comunicadosOrdenados.forEach((comunicado) => {
        estadoVisibilidad[comunicado.Id_Comunicado] = true;
      });
      setComunicadosVisibles(estadoVisibilidad);
    } catch (error) {
      throw error;
    }
  };

  // Verificar si se deben mostrar los comunicados
  useEffect(() => {
    const comunicadosMostrados = sessionStorage.getItem(
      SE_MOSTRARON_COMUNICADOS_DE_HOY_KEY
    );

    // Si no existe la variable o es false, mostrar comunicados
    if (!comunicadosMostrados || comunicadosMostrados === "false") {
      setMostrarComunicados(true);
    }
  }, []);

  // Función para volver a mostrar comunicados
  //   const volverAMostrarComunicados = () => {
  //     setMostrarComunicados(true);
  //     sessionStorage.setItem(SE_MOSTRARON_COMUNICADOS_DE_HOY_KEY, "false");

  //     // Reinicializar todos los comunicados como visibles
  //     const estadoVisibilidad: { [key: number]: boolean } = {};
  //     comunicados.forEach((comunicado) => {
  //       estadoVisibilidad[comunicado.Id_Comunicado] = true;
  //     });
  //     setComunicadosVisibles(estadoVisibilidad);
  //   };

  // Función para cerrar un comunicado específico
  const cerrarComunicado = (idComunicado: number) => {
    setComunicadosVisibles((prev) => ({
      ...prev,
      [idComunicado]: false,
    }));
  };

  // Efecto para verificar si todos los comunicados han sido cerrados
  useEffect(() => {
    const todosLosIds = comunicados.map((c) => c.Id_Comunicado);
    const todosCerrados = todosLosIds.every(
      (id) => comunicadosVisibles[id] === false
    );

    // Si hay comunicados y todos están cerrados, actualizar sessionStorage
    if (comunicados.length > 0 && todosCerrados) {
      sessionStorage.setItem(SE_MOSTRARON_COMUNICADOS_DE_HOY_KEY, "true");
    }
  }, [comunicadosVisibles, comunicados]);

  useEffect(() => {
    getComunicadosDeHoy();
  }, []);

  return (
    <>
      {mostrarComunicados &&
        comunicados.map(
          (comunicado, index) =>
            // Solo mostrar el comunicado si está marcado como visible
            comunicadosVisibles[comunicado.Id_Comunicado] && (
              <div
                key={comunicado.Id_Comunicado}
                style={{
                  zIndex: 1005 + index, // Cada modal sucesivo tendrá un z-index mayor
                }}
              >
                <ComunicadoModal
                  comunicado={comunicado}
                  eliminateModal={() =>
                    cerrarComunicado(comunicado.Id_Comunicado)
                  }
                />
              </div>
            )
        )}
    </>
  );
};

export default ComunicadosDeHoy;
