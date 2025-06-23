import { Genero } from "@/interfaces/shared/Genero";
import FotoPerfilClientSide from "../utils/photos/FotoPerfilClientSide";
import { CheckCircle, Loader2, X, Trash2, Clock } from "lucide-react";
import {
  AsistenciaDiariaResultado,
  DetallesAsistenciaUnitariaPersonal,
} from "@/interfaces/shared/AsistenciaRequests";
import { useState } from "react";
import { CANTIDAD_MINUTOS_MAXIMO_PARA_DESCARTAR_ASISTENCIA_DE_PERSONAL } from "@/constants/CANTIDAD_MINUTOS_MAXIMO_PARA_DESCARTE_ASISTENCIAS";

export interface PersonalParaTomarAsistencia {
  ID_o_DNI: string;
  GoogleDriveFotoId: string | null;
  Nombres: string;
  Apellidos: string;
  Genero: Genero;
  Cargo?: string;
}

const ItemTomaAsistencia = ({
  handlePersonalSeleccionado,
  handleEliminarAsistencia,
  personal,
  asistenciaRegistrada, // ← NUEVO: recibe los datos de asistencia
  timestampActual, // ← NUEVO: timestamp actual de Redux
  disabled = false,
  loading = false,
  globalLoading = false,
  eliminando = false,
}: {
  personal: PersonalParaTomarAsistencia;
  handlePersonalSeleccionado: (personal: PersonalParaTomarAsistencia) => void;
  handleEliminarAsistencia?: (
    personal: PersonalParaTomarAsistencia
  ) => Promise<void>;
  asistenciaRegistrada?: AsistenciaDiariaResultado | null; // ← NUEVO
  timestampActual?: number; // ← NUEVO: desde Redux
  disabled?: boolean;
  loading?: boolean;
  globalLoading?: boolean;
  eliminando?: boolean;
}) => {
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  // ✅ LÓGICA SIMPLE: Si tiene asistencia registrada, está marcada
  const tieneMarcada = asistenciaRegistrada?.AsistenciaMarcada || false;
  const estaDeshabilitado = disabled || tieneMarcada;

  // ✅ CALCULAR SI PUEDE ELIMINAR basado en timestamp de Redux
  const puedeEliminar = (() => {
    if (
      !asistenciaRegistrada?.AsistenciaMarcada ||
      !timestampActual ||
      !asistenciaRegistrada.Detalles
    ) {
      return false;
    }

    const detalles =
      asistenciaRegistrada.Detalles as DetallesAsistenciaUnitariaPersonal;
    if (!detalles.Timestamp) {
      return false;
    }

    // 🔧 RESTAURAR: Aplicar offset de Perú (-5 horas = -5 * 60 * 60 * 1000 ms)
    const OFFSET_PERU_MS = 5 * 60 * 60 * 1000;
    const timestampAsistenciaCorregido = detalles.Timestamp + OFFSET_PERU_MS;

    // Calcular tiempo transcurrido en minutos
    const tiempoTranscurridoMs = timestampActual - timestampAsistenciaCorregido;
    const tiempoTranscurridoMinutos = tiempoTranscurridoMs / (1000 * 60);

    console.log("🕐 Debug cálculo eliminación:", {
      timestampActual,
      timestampAsistenciaOriginal: detalles.Timestamp,
      timestampAsistenciaCorregido,
      tiempoTranscurridoMs,
      tiempoTranscurridoMinutos,
      puedeEliminar:
        tiempoTranscurridoMinutos <=
        CANTIDAD_MINUTOS_MAXIMO_PARA_DESCARTAR_ASISTENCIA_DE_PERSONAL,
      fechaActual: new Date(timestampActual).toLocaleString("es-PE"),
      fechaAsistencia: new Date(timestampAsistenciaCorregido).toLocaleString(
        "es-PE"
      ),
    });

    return (
      tiempoTranscurridoMinutos <=
      CANTIDAD_MINUTOS_MAXIMO_PARA_DESCARTAR_ASISTENCIA_DE_PERSONAL
    );
  })();

  // ✅ CALCULAR MINUTOS RESTANTES
  const minutosRestantes = (() => {
    if (
      !asistenciaRegistrada?.AsistenciaMarcada ||
      !timestampActual ||
      !asistenciaRegistrada.Detalles
    ) {
      return 0;
    }

    const detalles =
      asistenciaRegistrada.Detalles as DetallesAsistenciaUnitariaPersonal;
    if (!detalles.Timestamp) {
      return 0;
    }

    // 🔧 RESTAURAR: Aplicar offset de Perú
    const OFFSET_PERU_MS = 5 * 60 * 60 * 1000;
    const timestampAsistenciaCorregido = detalles.Timestamp + OFFSET_PERU_MS;

    const tiempoTranscurridoMs = timestampActual - timestampAsistenciaCorregido;
    const tiempoTranscurridoMinutos = tiempoTranscurridoMs / (1000 * 60);
    const restantes =
      CANTIDAD_MINUTOS_MAXIMO_PARA_DESCARTAR_ASISTENCIA_DE_PERSONAL -
      tiempoTranscurridoMinutos;

    return Math.max(0, Math.ceil(restantes));
  })();

  // ✅ MOSTRAR BOTONES DE ACCIÓN
  const debeMostrarBotonesAccion =
    tieneMarcada &&
    !loading &&
    !globalLoading &&
    !eliminando &&
    !mostrarConfirmacion;

  // ✅ MANEJADORES DE ELIMINACIÓN
  const handleEliminarClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!handleEliminarAsistencia || !puedeEliminar) return;

    if (!mostrarConfirmacion) {
      setMostrarConfirmacion(true);
      return;
    }

    try {
      await handleEliminarAsistencia(personal);
      setMostrarConfirmacion(false);
    } catch (error) {
      console.error("Error al eliminar:", error);
      setMostrarConfirmacion(false);
    }
  };

  const handleCancelarEliminacion = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMostrarConfirmacion(false);
  };

  const handleRegistrarClick = () => {
    if (
      !estaDeshabilitado &&
      !loading &&
      !globalLoading &&
      !eliminando &&
      !mostrarConfirmacion
    ) {
      handlePersonalSeleccionado(personal);
    }
  };

  return (
    <div
      onClick={handleRegistrarClick}
      className={`flex items-center border rounded-lg shadow-sm transition-all p-1.5 sm-only:p-2 md-only:p-2 lg-only:p-2 xl-only:p-2 w-full sm-only:w-[48%] md-only:w-[48%] lg-only:w-[32%] xl-only:w-[32%] relative ${
        globalLoading
          ? "border-gray-300 cursor-not-allowed filter brightness-90"
          : loading || eliminando
          ? "border-blue-400 bg-gradient-to-r from-blue-50 to-gray-100 animate-pulse cursor-wait shadow-md"
          : estaDeshabilitado
          ? "border-green-200 bg-green-50 cursor-pointer hover:bg-green-100"
          : mostrarConfirmacion
          ? "border-red-300 bg-red-50 cursor-pointer"
          : "border-gray-200 bg-white hover:bg-blue-50 active:bg-blue-100 cursor-pointer"
      }`}
    >
      {/* Foto del personal */}
      <div
        className={`w-8 h-8 sm-only:w-9 sm-only:h-9 md-only:w-9 md-only:h-9 lg-only:w-10 lg-only:h-10 xl-only:w-10 xl-only:h-10 rounded-full overflow-hidden mr-2 flex-shrink-0 ${
          globalLoading
            ? "border-2 border-gray-300 opacity-80"
            : loading || eliminando
            ? "border-2 border-blue-500"
            : estaDeshabilitado
            ? "border-2 border-green-300"
            : mostrarConfirmacion
            ? "border-2 border-red-300"
            : "border-2 border-blue-200"
        }`}
      >
        <FotoPerfilClientSide
          Google_Drive_Foto_ID={personal.GoogleDriveFotoId}
        />
      </div>

      {/* Información del personal */}
      <div
        title={`${personal.Nombres} ${personal.Apellidos}`}
        className={`text-xs sm-only:text-sm md-only:text-sm lg-only:text-sm xl-only:text-sm font-medium truncate leading-tight ${
          globalLoading
            ? "text-gray-600"
            : loading || eliminando
            ? "text-blue-700"
            : estaDeshabilitado
            ? "text-green-700"
            : mostrarConfirmacion
            ? "text-red-700"
            : ""
        }`}
      >
        {personal.Nombres} {personal.Apellidos}
        {personal.Cargo && (
          <div
            className={`italic text-xs ${
              globalLoading
                ? "text-gray-500"
                : mostrarConfirmacion
                ? "text-red-600"
                : "text-gris-oscuro"
            }`}
          >
            {personal.Cargo}
          </div>
        )}
      </div>

      {/* ✅ ESTADO: Check verde */}
      {debeMostrarBotonesAccion && (
        <div className="absolute right-1 top-1">
          <CheckCircle className="text-green-500 w-5 h-5" />
        </div>
      )}

      {/* 🔴 BOTONES DE ACCIÓN */}
      {debeMostrarBotonesAccion && (
        <div className="absolute right-1 bottom-1 flex items-center gap-1">
          {/* Botón de eliminar */}
          {handleEliminarAsistencia && puedeEliminar && (
            <button
              onClick={handleEliminarClick}
              className="group relative w-6 h-6 bg-red-500 hover:bg-red-600 active:bg-red-700 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-sm hover:shadow-md z-10"
              title={`Eliminar asistencia (${minutosRestantes} min restantes)`}
            >
              <X className="text-white w-3 h-3 group-hover:w-3.5 group-hover:h-3.5 transition-all" />
              <div className="absolute inset-0 bg-red-400 rounded-full opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </button>
          )}

          {/* Indicador de tiempo expirado */}
          {handleEliminarAsistencia &&
            !puedeEliminar &&
            asistenciaRegistrada?.AsistenciaMarcada && (
              <div
                className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center"
                title="Tiempo para eliminar expirado"
              >
                <Clock className="text-white w-3 h-3" />
              </div>
            )}
        </div>
      )}

      {/* ⏳ ESTADO: Cargando asistencia */}
      {loading && !globalLoading && !eliminando && (
        <div className="absolute right-2 top-2 flex items-center">
          <div className="mr-1 bg-blue-100 text-blue-800 text-xs font-semibold px-1.5 py-0.5 rounded">
            Cargando
          </div>
          <Loader2 className="text-blue-600 w-5 h-5 animate-spin" />
        </div>
      )}

      {/* 🗑️ ESTADO: Eliminando asistencia */}
      {eliminando && (
        <div className="absolute right-2 top-2 flex items-center">
          <div className="mr-1 bg-red-100 text-red-800 text-xs font-semibold px-1.5 py-0.5 rounded">
            Eliminando
          </div>
          <Loader2 className="text-red-600 w-5 h-5 animate-spin" />
        </div>
      )}

      {/* ❓ ESTADO: Confirmación de eliminación */}
      {mostrarConfirmacion && !eliminando && (
        <div className="absolute inset-0 bg-red-50 border-2 border-red-300 rounded-lg flex items-center justify-center z-20">
          <div className="flex flex-col items-center justify-center text-center p-2">
            <Trash2 className="text-red-600 w-6 h-6 mb-1" />
            <p className="text-xs text-red-700 font-medium mb-2 leading-tight">
              ¿Eliminar asistencia?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleEliminarClick}
                className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded transition-colors"
                title="Confirmar eliminación"
              >
                Sí
              </button>
              <button
                onClick={handleCancelarEliminacion}
                className="bg-gray-400 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded transition-colors"
                title="Cancelar eliminación"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌐 ESTADO: Carga global */}
      {globalLoading && (
        <div className="absolute right-2 top-2">
          <Loader2 className="text-gray-500 w-4 h-4 animate-spin" />
        </div>
      )}

      {/* 🔵 Sin asistencia (punto azul parpadeante) */}
      {!estaDeshabilitado &&
        !loading &&
        !globalLoading &&
        !eliminando &&
        !mostrarConfirmacion &&
        !asistenciaRegistrada?.AsistenciaMarcada && (
          <div className="absolute right-2 top-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-md">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ItemTomaAsistencia;
