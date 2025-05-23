"use client";
import { useState } from "react";

import MarcarAsistenciaPropiaDePersonalModal from "@/components/modals/AsistenciaPropiaPersonal/MarcarAsistenciaPropiaDePersonalModal";
import ActivarGPSAsistenciaPropia from "@/components/modals/AsistenciaPropiaPersonal/ActivarGPSAsistenciaPropia";
import ConexionInternetMarcarAsistenciaPropia from "@/components/modals/AsistenciaPropiaPersonal/ConexionInternetMarcarAsistenciaPropia";
import ConfirmarMarcarAsistenciaPropia from "@/components/modals/AsistenciaPropiaPersonal/ConfirmarMarcarAsistenciaPropia";
import ErrorAsistenciaPropia from "@/components/modals/AsistenciaPropiaPersonal/ErrorAsistenciaPropia";
import UbicacionFueraDeColegioAsistenciaPropia from "@/components/modals/AsistenciaPropiaPersonal/UbicacionFueraDeColegioAsistenciaPropia";

const Modales = () => {
  const [showMarcar, setShowMarcar] = useState(false);
  const [showGPS, setShowGPS] = useState(false);
  const [showConexion, setShowConexion] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showUbicacion, setShowUbicacion] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <button
        className="bg-purple-600 text-white p-4"
        onClick={() => setShowMarcar(true)}
      >
        Mostrar Marcar Asistencia
      </button>

      <button
        className="bg-blue-600 text-white p-4"
        onClick={() => setShowGPS(true)}
      >
        Mostrar Activar GPS
      </button>

      <button
        className="bg-green-600 text-white p-4"
        onClick={() => setShowConexion(true)}
      >
        Mostrar Verificar Conexión
      </button>

      <button
        className="bg-yellow-600 text-white p-4"
        onClick={() => setShowConfirmar(true)}
      >
        Mostrar Confirmar Asistencia
      </button>

      <button
        className="bg-red-600 text-white p-4"
        onClick={() => setShowError(true)}
      >
        Mostrar Error
      </button>

      <button
        className="bg-gray-600 text-white p-4"
        onClick={() => setShowUbicacion(true)}
      >
        Mostrar Ubicación Fuera del Colegio
      </button>

      {showMarcar && (
        <MarcarAsistenciaPropiaDePersonalModal eliminateModal={() => setShowMarcar(false)} />
      )}

      {showGPS && (
        <ActivarGPSAsistenciaPropia eliminateModal={() => setShowGPS(false)} />
      )}

      {showConexion && (
        <ConexionInternetMarcarAsistenciaPropia eliminateModal={() => setShowConexion(false)} />
      )}

      {showConfirmar && (
        <ConfirmarMarcarAsistenciaPropia eliminateModal={() => setShowConfirmar(false)} />
      )}

      {showError && (
        <ErrorAsistenciaPropia eliminateModal={() => setShowError(false)} />
      )}

      {showUbicacion && (
        <UbicacionFueraDeColegioAsistenciaPropia eliminateModal={() => setShowUbicacion(false)} />
      )}
    </div>
  );
};

export default Modales;
