"use client";

import { DatosAsistenciaHoyIDB } from "@/lib/utils/local/db/models/DatosAsistenciaHoy/DatosAsistenciaHoyIDB";
import { useEffect } from "react";
import { useSelector } from "react-redux";

import { RootState } from "@/global/store";

import { DirectivoAsistenciaResponse } from "@/interfaces/shared/Asistencia/DatosAsistenciaHoyIE20935";
import { HandlerDirectivoAsistenciaResponse } from "@/lib/utils/local/db/models/DatosAsistenciaHoy/handlers/HandlerDirectivoAsistenciaResponse";

const PRUEBA = () => {
  const { inicializado } = useSelector(
    (state: RootState) => state.others.fechaHoraActualReal
  );
  console.log(inicializado);

  useEffect(() => {
    if (!inicializado) return;
    const getData = async () => {
      const datos = await new DatosAsistenciaHoyIDB().obtenerDatos();

      const handler = new HandlerDirectivoAsistenciaResponse(
        datos as DirectivoAsistenciaResponse
      );

      console.log(
        "Personal",
        handler.buscarPersonalAdministrativoPorDNI("15449593")
      );
      console.log(
        "DEBERIA ESTAR",
        handler.debeEstarPresentePersonalAhora("15449593")
      );
    };

    getData();
  }, [inicializado]);

  return (
    <>
      <div></div>
    </>
  );
};

export default PRUEBA;
