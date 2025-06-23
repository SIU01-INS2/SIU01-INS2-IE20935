"use client";

import ProfesorPrimariaIcon from "../icons/ProfesorPrimariaIcon";
import AuxiliarIcon from "../icons/AuxiliarIcon";
import ProfesorOTutorIcon from "../icons/ProfesorOTutorIcon";
import PersonasGenericasIcon from "../icons/PersonasGenericasIcon";
import { useEffect, useState } from "react";
import { Speaker } from "@/lib/utils/voice/Speaker";
import userStorage from "@/lib/utils/local/db/models/UserStorage";
import { RolBoton } from "../shared/buttons/RolButton";
import { FechaHoraActualRealState } from "@/global/state/others/fechaHoraActualReal";
import { determinarPeriodoDia } from "@/lib/calc/determinarPeriodoDia";
import { saludosDia } from "@/Assets/voice/others/SaludosDIa";
import { TiempoRestante } from "@/lib/calc/time/tiempoRestanteHasta";
import VolverIcon from "../icons/VolverIcon";
import { ListaPersonal, obtenerTextoRol } from "./ListadoPersonal";
import { SeleccionEntradaSalida } from "./SeleccionEntradaSalida";
import { HandlerDirectivoAsistenciaResponse } from "@/lib/utils/local/db/models/DatosAsistenciaHoy/handlers/HandlerDirectivoAsistenciaResponse";
import {
  ModoRegistro,
  modoRegistroTextos,
} from "@/interfaces/shared/ModoRegistroPersonal";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import DirectivoIcon from "../icons/DirectivoIcon";
import { AsistenciaHoy } from "@/lib/utils/local/db/models/AsistenciasTomadasHoy/AsistenciasTomadasHoyIDB";
import IndexedDBConnection from "@/lib/utils/local/db/IndexedDBConnection";

const FullScreenModalAsistenciaPersonal = ({
  closeFullScreenModal,
  fechaHoraActual,
  tiempoRestante,
  handlerDatosAsistenciaHoyDirectivo,
}: {
  handlerDatosAsistenciaHoyDirectivo: HandlerDirectivoAsistenciaResponse;
  closeFullScreenModal: () => void;
  fechaHoraActual: FechaHoraActualRealState;
  tiempoRestante?: TiempoRestante | null;
}) => {
  // Estados para controlar el flujo
  const [rolSeleccionado, setRolSeleccionado] = useState<RolesSistema | null>(
    null
  );
  const [modoRegistro, setModoRegistro] = useState<ModoRegistro | null>(null);
  const [cargando, setCargando] = useState(false);

  // Obtener el saludo según la hora del día
  const periodoDelDia = determinarPeriodoDia(
    fechaHoraActual.fechaHora || new Date().toISOString()
  );
  const saludo = saludosDia[periodoDelDia];

  // Efecto para el saludo de bienvenida
  useEffect(() => {
    const saludoDeBienvenida = async () => {
      const nombreCompletoCortoDirectivoLogeado =
        await userStorage.getNombreCompletoCorto();

      const speaker = Speaker.getInstance();

      speaker.start(
        `${saludo}, Directivo ${nombreCompletoCortoDirectivoLogeado}, usted ha iniciado la toma de Asistencia de Personal`
      );
    };

    saludoDeBienvenida();
  }, [saludo]);

  // Manejador para la selección de rol
  const handleRolSelection = (rol: RolesSistema) => {
    setCargando(true);

    // Audio feedback
    const speaker = Speaker.getInstance();
    speaker.start(`Ha seleccionado el rol ${obtenerTextoRol(rol)}`);

    // Simulamos una pequeña carga para mejorar la experiencia
    setTimeout(() => {
      setRolSeleccionado(rol);
      setCargando(false);
    }, 300);
  };

  // Manejador para la selección de modo (entrada/salida)
  const handleModoSelection = (modo: ModoRegistro | null) => {
    setCargando(true);

    // Audio feedback
    const speaker = Speaker.getInstance();
    speaker.start(`Registrando ${modoRegistroTextos[modo!]}`);

    // Simulamos una pequeña carga para mejorar la experiencia
    setTimeout(() => {
      setModoRegistro(modo);
      setCargando(false);
    }, 300);
  };

  // Función para volver al paso anterior
  const handleVolver = () => {
    // Feedback por voz al retroceder
    const speaker = Speaker.getInstance();

    if (modoRegistro !== null) {
      speaker.start(`Volviendo a la selección de modo de registro`);
      setModoRegistro(null);
    } else if (rolSeleccionado !== null) {
      speaker.start(`Volviendo a la selección de rol`);
      setRolSeleccionado(null);
    }
  };

  const getDiagnostic = async () => {
    try {
      await IndexedDBConnection.init();
      const store = await IndexedDBConnection.getStore(
        "asistencias_tomadas_hoy",
        "readonly"
      );

      return new Promise<void>((resolve) => {
        const request = store.openCursor();

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest)
            .result as IDBCursorWithValue;

          if (cursor) {
            const asistencia = cursor.value as AsistenciaHoy;
            console.log(`🔍 REGISTRO EN CACHE:`);
            console.log(`  - Clave: ${asistencia.clave}`);
            console.log(
              `  - DNI: ${asistencia.dni} (tipo: ${typeof asistencia.dni})`
            );
            console.log(`  - Actor: ${asistencia.actor}`);
            console.log(`  - Modo: ${asistencia.modoRegistro}`);
            console.log(`  - Fecha: ${asistencia.fecha}`);
            console.log(`---`);

            cursor.continue();
          } else {
            resolve();
          }
        };
      });
    } catch (error) {
      console.error("Error en diagnóstico:", error);
    }
  };

  useEffect(() => {
    getDiagnostic();
  }, []);

  // Determinar qué contenido mostrar según el estado actual
  const renderContenido = () => {
    // Si estamos cargando, mostrar un spinner
    if (cargando) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-white bg-opacity-75">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-blue-600 font-medium text-sm">
              Cargando...
            </p>
          </div>
        </div>
      );
    }

    if (rolSeleccionado === null) {
      // Paso 1: Selección de Rol
      return (
        <div className="w-full h-full flex items-center justify-center p-3 sm-only:p-4 md-only:p-5 lg-only:p-5 xl-only:p-5 ">
          <div className="w-full max-w-4xl flex flex-col items-center">
            {/* Título principal */}
            <h1 className="text-lg sm-only:text-xl md-only:text-2xl lg-only:text-2xl xl-only:text-2xl font-bold text-green-600 text-center mb-4 sm-only:mb-8 md-only:mb-8 lg-only:mb-8 xl-only:mb-8 mt-1 sm-only:mt-2 md-only:mt-2 lg-only:mt-2 xl-only:mt-2">
              {saludo}, haz clic en tu Rol
            </h1>

            {/* Tarjetas de roles - Responsive: 2x2+1 en móvil, 3+2 en desktop */}
            <div className="w-full max-w-lg mx-auto px-3">
              {/* Layout para móviles - 2 por fila + 1 centrado */}
              <div className="sxs-only:block xs-only:block sm-only:block md-only:hidden lg-only:hidden xl-only:hidden">
                <div className="flex flex-col items-center gap-3 xs-only:gap-4 sm-only:gap-4">
                  {/* Primera fila móvil - 2 botones */}
                  <div className="flex items-center justify-center gap-3 xs-only:gap-4 sm-only:gap-5">
                    <RolBoton
                      onClick={() =>
                        handleRolSelection(RolesSistema.ProfesorPrimaria)
                      }
                      icon={
                        <ProfesorPrimariaIcon className="max-lg:short-height:h-[7vh] sxs-only:w-[1.3rem] xs-only:w-[1.4rem] sm-only:w-[1.6rem] text-negro" />
                      }
                      label="Profesor (Primaria)"
                    />
                    <RolBoton
                      onClick={() => handleRolSelection(RolesSistema.Auxiliar)}
                      icon={
                        <AuxiliarIcon className="max-lg:short-height:h-[7vh] sxs-only:w-[1.3rem] xs-only:w-[1.4rem] sm-only:w-[1.5rem] text-negro" />
                      }
                      label="Auxiliar"
                    />
                  </div>

                  {/* Segunda fila móvil - 2 botones */}
                  <div className="flex items-center justify-center gap-3 xs-only:gap-4 sm-only:gap-5">
                    <RolBoton
                      onClick={() =>
                        handleRolSelection(RolesSistema.ProfesorSecundaria)
                      }
                      icon={
                        <ProfesorOTutorIcon className="max-lg:short-height:h-[6.5vh] sxs-only:w-[1.2rem] xs-only:w-[1.3rem] sm-only:w-[1.4rem] text-negro" />
                      }
                      label="Profesor/Tutor (Secundaria)"
                    />
                    <RolBoton
                      onClick={() =>
                        handleRolSelection(RolesSistema.PersonalAdministrativo)
                      }
                      icon={
                        <PersonasGenericasIcon className="max-lg:short-height:h-[7vh] sxs-only:w-[1.3rem] xs-only:w-[1.4rem] sm-only:w-[1.6rem] text-negro" />
                      }
                      label="Otro"
                    />
                  </div>

                  {/* Tercera fila móvil - 1 botón centrado */}
                  <div className="flex items-center justify-center">
                    <RolBoton
                      onClick={() => handleRolSelection(RolesSistema.Directivo)}
                      icon={
                        <DirectivoIcon className="max-lg:short-height:h-[7vh] sxs-only:w-[1.3rem] xs-only:w-[1.4rem] sm-only:w-[1.6rem] text-negro" />
                      }
                      label="Directivo"
                    />
                  </div>
                </div>
              </div>

              {/* Layout para tablet/desktop - 3+2 */}
              <div className="sxs-only:hidden xs-only:hidden sm-only:hidden md-only:block lg-only:block xl-only:block">
                <div className="flex flex-col items-center justify-center">
                  {/* Primera fila desktop - 3 botones */}
                  <div className="flex items-center justify-center gap-5 md-only:gap-6 lg-only:gap-7 xl-only:gap-8 mb-5 md-only:mb-6 lg-only:mb-7 xl-only:mb-8">
                    <RolBoton
                      onClick={() =>
                        handleRolSelection(RolesSistema.ProfesorPrimaria)
                      }
                      icon={
                        <ProfesorPrimariaIcon className="md-only:w-[2rem] lg-only:w-[2.3rem] xl-only:w-[2.6rem] text-negro" />
                      }
                      label="Profesor (Primaria)"
                    />
                    <RolBoton
                      onClick={() => handleRolSelection(RolesSistema.Auxiliar)}
                      icon={
                        <AuxiliarIcon className="md-only:w-[1.8rem] lg-only:w-[2.1rem] xl-only:w-[2.4rem] text-negro" />
                      }
                      label="Auxiliar"
                    />
                    <RolBoton
                      onClick={() =>
                        handleRolSelection(RolesSistema.ProfesorSecundaria)
                      }
                      icon={
                        <ProfesorOTutorIcon className="md-only:w-[1.9rem] lg-only:w-[2.2rem] xl-only:w-[2.5rem] text-negro" />
                      }
                      label="Profesor/Tutor (Secundaria)"
                    />
                  </div>

                  {/* Segunda fila desktop - 2 botones centrados */}
                  <div className="flex items-center justify-center gap-5 md-only:gap-6 lg-only:gap-7 xl-only:gap-8">
                    <RolBoton
                      onClick={() =>
                        handleRolSelection(RolesSistema.PersonalAdministrativo)
                      }
                      icon={
                        <PersonasGenericasIcon className="md-only:w-[2rem] lg-only:w-[2.3rem] xl-only:w-[2.6rem] text-negro" />
                      }
                      label="Otro"
                    />
                    <RolBoton
                      onClick={() => handleRolSelection(RolesSistema.Directivo)}
                      icon={
                        <DirectivoIcon className="md-only:w-[2rem] lg-only:w-[2.3rem] xl-only:w-[2.6rem] text-negro" />
                      }
                      label="Directivo"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (modoRegistro === null) {
      // Paso 2: Selección de Entrada/Salida
      return (
        <div className="w-full h-full flex items-center justify-center">
          <SeleccionEntradaSalida onSeleccion={handleModoSelection} />
        </div>
      );
    } else {
      // Paso 3: Lista de personal para marcar asistencia
      return (
        <div className="w-full h-full">
          <ListaPersonal
            fechaHoraActual={fechaHoraActual}
            handlerDatosAsistenciaHoyDirectivo={
              handlerDatosAsistenciaHoyDirectivo
            }
            rol={rolSeleccionado}
            modoRegistro={modoRegistro}
          />
        </div>
      );
    }
  };

  return (
    <div className="animate__animated animate__fadeInUp [animation-duration:800ms] fixed top-0 left-0 w-full h-[100dvh] grid grid-rows-[auto_1fr_auto] bg-white z-[1001]">
      {/* Cabecera - REDUCIDA */}
      <header className="bg-blue-50 border-b border-blue-100 py-3 px-2 md-only:py-3 md-only:px-3 lg-only:py-4 lg-only:px-3 xl-only:py-4 xl-only:px-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm-only:flex-row md-only:flex-row lg-only:flex-row xl-only:flex-row justify-between items-center gap-1 sm-only:gap-2 gap-y-3">
          <div className="flex items-center gap-3 sm-only:gap-3">
            {/* Botón "Retroceder" - solo visible cuando se ha seleccionado algo */}
            {rolSeleccionado !== null && (
              <button
                onClick={handleVolver}
                className="flex items-center text-blanco bg-color-interfaz px-2 py-1.5 sm-only:px-3 sm-only:py-2 rounded-md text-[0.9rem]"
              >
                <VolverIcon className="w-6 mr-1" />
                Retroceder
              </button>
            )}
            <div className="flex flex-col">
              <span className="text-blue-600 font-medium text-xs leading-tight">
                {fechaHoraActual.formateada?.fechaLegible}
              </span>
              <span className="text-blue-600 font-medium text-xs leading-tight">
                {fechaHoraActual.formateada?.horaAmPm}
              </span>
              <span className="text-blue-900 font-bold text-sm sm-only:text-base md-only:text-base lg-only:text-lg xl-only:text-lg leading-tight text-center sm-only:text-left md-only:text-left lg-only:text-left xl-only:text-left">
                Registro de Asistencia de Personal
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 sm-only:gap-2 md-only:gap-3 lg-only:gap-3 xl-only:gap-3">
            <div className="flex flex-col items-end">
              <span className="text-red-600 font-medium text-xs leading-tight">
                Toma de Asistencia acaba en:
              </span>
              <span className="text-red-700 font-bold text-xs sm-only:text-sm md-only:text-sm lg-only:text-base xl-only:text-base leading-tight">
                {tiempoRestante?.formatoCorto}
              </span>
            </div>
            <button
              onClick={closeFullScreenModal}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-1.5 sm-only:py-1 sm-only:px-2 md-only:py-1.5 md-only:px-3 lg-only:py-1.5 lg-only:px-3 xl-only:py-1.5 xl-only:px-3 rounded-lg transition-colors shadow-sm text-[0.9rem] sm-only:text-[0.9rem] md-only:text-[0.8rem]  lg-only:text-base xl-only:text-base"
            >
              Cerrar
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal con scroll */}
      <main className="overflow-auto">{renderContenido()}</main>

      {/* Pie de página - REDUCIDO */}
      <footer className="bg-color-interfaz text-white border-t border-color-interfaz py-3 px-2 md-only:py-3 md-only:px-3 lg-only:py-3 lg-only:px-3 xl-only:py-3 xl-only:px-3 shadow-md">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex flex-col items-center gap-1">
            <p className="font-semibold text-xs sm-only:text-sm md-only:text-sm lg-only:text-sm xl-only:text-sm leading-tight">
              I.E. 20935 Asunción 8 - Imperial, Cañete
            </p>
            <p className="text-xs opacity-80 leading-tight">
              Sistema de Control de Asistencia ©{" "}
              {fechaHoraActual.utilidades?.año || new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FullScreenModalAsistenciaPersonal;
