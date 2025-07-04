"use client";
import LapizFirmando from "@/components/icons/LapizFirmando";
import MarcarAsistenciaPropiaDePersonalModal from "@/components/modals/AsistenciaPropiaPersonal/MarcarAsistenciaPropiaDePersonalModal";
import store, { RootState } from "@/global/store";
import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import { useSelector } from "react-redux";
import { SE_MOSTRO_TOLTIP_TOMAR_ASISTENCIA_PERSONAL_KEY } from "../PlantillaLogin";
import { useDelegacionEventos } from "@/hooks/useDelegacionDeEventos";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { AsistenciaDePersonalIDB } from "@/lib/utils/local/db/models/AsistenciaDePersonal/AsistenciaDePersonalIDB";
import { DatosAsistenciaHoyIDB } from "@/lib/utils/local/db/models/DatosAsistenciaHoy/DatosAsistenciaHoyIDB";
import { HandlerAsistenciaBase } from "@/lib/utils/local/db/models/DatosAsistenciaHoy/handlers/HandlerDatosAsistenciaBase";
import { HandlerProfesorPrimariaAsistenciaResponse } from "@/lib/utils/local/db/models/DatosAsistenciaHoy/handlers/HandlerProfesorPrimariaAsistenciaResponse";
import { HorarioTomaAsistencia } from "@/interfaces/shared/Asistencia/DatosAsistenciaHoyIE20935";
import { HandlerAuxiliarAsistenciaResponse } from "../../../lib/utils/local/db/models/DatosAsistenciaHoy/handlers/HandlerAuxiliarAsistenciaResponse";
import { HandlerProfesorTutorSecundariaAsistenciaResponse } from "@/lib/utils/local/db/models/DatosAsistenciaHoy/handlers/HandlerProfesorTutorSecundariaAsistenciaResponse";
import { HandlerPersonalAdministrativoAsistenciaResponse } from "@/lib/utils/local/db/models/DatosAsistenciaHoy/handlers/HandlerPersonalAdministrativoAsistenciaResponse";
import {
  ModoRegistro,
  modoRegistroTextos,
} from "@/interfaces/shared/ModoRegistroPersonal";

import {
  HORAS_ANTES_INICIO_ACTIVACION,
  HORAS_ANTES_SALIDA_CAMBIO_MODO,
  HORAS_DESPUES_SALIDA_LIMITE,
  INTERVALO_CONSULTA_ASISTENCIA_OPTIMIZADO_MS,
} from "@/constants/INTERVALOS_CONSULTAS_ASISTENCIAS_PROPIAS_PARA_PERSONAL_NO_DIRECTIVO";
import ConfirmacionAsistenciaMarcadaModal from "@/components/modals/AsistenciaPropiaPersonal/ConfirmacionAsistenciaMarcadaModal";
import ActivarGPSoBrindarPermisosGPSModal from "@/components/modals/AsistenciaPropiaPersonal/ActivarGPSAsistenciaPropia";
import FalloConexionAInternetAlMarcarAsistenciaPropiaModal from "@/components/modals/AsistenciaPropiaPersonal/ConexionInternetMarcarAsistenciaPropia";
import ErrorGenericoAlRegistrarAsistenciaPropiaModal from "@/components/modals/AsistenciaPropiaPersonal/ErrorGenericoAlRegistrarAsistenciaPropiaModal";
import UbicacionFueraDelColegioAlRegistrarAsistenciaPropiaModal from "@/components/modals/AsistenciaPropiaPersonal/UbicacionFueraDelColegioAlRegistrarAsistenciaPropiaModal";
import NoSePuedeUsarLaptopParaAsistenciaModal from "@/components/modals/AsistenciaPropiaPersonal/NoSePuedeUsarLaptopParaAsistenciaModal";
import DispositivoSinGPSModal from "@/components/modals/AsistenciaPropiaPersonal/DispositivoSinGPSModal";

// ✅ INTERFACES SIMPLIFICADAS
interface EstadoAsistencia {
  entradaMarcada: boolean;
  salidaMarcada: boolean;
  inicializado: boolean;
}

interface EstadoBoton {
  visible: boolean;
  tipo: ModoRegistro | null;
  color: "verde" | "rojizo";
  tooltip: string;
}

interface ModoActual {
  activo: boolean;
  tipo: ModoRegistro | null;
  razon: string;
}

interface MensajeInformativo {
  mostrar: boolean;
  texto: string;
  tipo:
    | "sin-horario"
    | "dia-evento"
    | "fuera-año"
    | "fin-semana"
    | "fecha-no-disponible";
}

// ✅ CONSTANTES
const RETRY_HORARIO_MS = 30000; // 30 segundos

// ✅ SELECTOR OPTIMIZADO - Solo para hora/minuto (NO cada segundo)
const selectHoraMinutoActual = (state: RootState) => {
  const fechaHora = state.others.fechaHoraActualReal.fechaHora;
  if (!fechaHora) return null;

  const fecha = new Date(fechaHora);
  fecha.setHours(fecha.getHours() - 5); // Corregir zona horaria

  // ✅ CLAVE: Solo retornar timestamp redondeado a MINUTOS (no segundos)
  const timestamp = Math.floor(fecha.getTime() / 60000) * 60000; // Redondear a minutos

  return {
    fecha,
    timestamp, // Solo cambia cada minuto
    hora: fecha.getHours(),
    minuto: fecha.getMinutes(),
  };
};

const selectSidebar = (state: RootState) => ({
  height: state.elementsDimensions.navBarFooterHeight,
  isOpen: state.flags.sidebarIsOpen,
});

// ✅ COMPONENTE DE MENSAJE INFORMATIVO REUTILIZABLE
const MensajeInformativoAsistencia = memo(
  ({
    mensaje,
    onCerrar,
    navbarHeight,
  }: {
    mensaje: MensajeInformativo;
    onCerrar: () => void;
    navbarHeight: number;
  }) => {
    const { delegarEvento } = useDelegacionEventos();

    useEffect(() => {
      if (!delegarEvento) return;

      // Usar delegación de eventos para cerrar al hacer click fuera
      delegarEvento(
        "mousedown",
        "body",
        (event: Event) => {
          const target = event.target as HTMLElement;
          if (!target.closest("#mensaje-informativo-asistencia")) {
            onCerrar();
          }
        },
        true
      );
    }, [delegarEvento, onCerrar]);

    if (!mensaje.mostrar) return null;

    return (
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[101] flex items-center justify-center px-4"
        style={{ paddingBottom: navbarHeight + 12 }}
      >
        <div
          id="mensaje-informativo-asistencia"
          className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 
                   sxs-only:w-[90%] sxs-only:max-w-none sxs-only:p-4
                   xs-only:w-[85%] xs-only:max-w-none xs-only:p-5
                   sm-only:w-[80%] sm-only:max-w-md
                   w-full max-w-lg
                   relative animate-in fade-in-0 zoom-in-95 duration-300"
        >
          {/* Botón cerrar */}
          <button
            onClick={onCerrar}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 
                     flex items-center justify-center transition-colors duration-200
                     text-gray-500 hover:text-gray-700"
            title="Cerrar"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Contenido */}
          <div className="pr-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Información de Asistencia
                </h3>
                <p className="text-sm text-gray-600">I.E. 20935 Asunción 8</p>
              </div>
            </div>

            <p
              className="text-gray-700 leading-relaxed
                        sxs-only:text-sm 
                        xs-only:text-sm
                        text-base"
            >
              {mensaje.texto}
            </p>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Este mensaje se muestra solo una vez por sesión
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

MensajeInformativoAsistencia.displayName = "MensajeInformativoAsistencia";

const MarcarAsistenciaDePersonalButton = memo(
  ({ rol }: { rol: RolesSistema }) => {
    const { delegarEvento } = useDelegacionEventos();
    const selectReduxInicializado = (state: RootState) =>
      state.others.fechaHoraActualReal.inicializado;
    // ✅ SELECTORES
    const horaMinutoActual = useSelector(selectHoraMinutoActual);
    const reduxInicializado = useSelector(selectReduxInicializado);
    const sidebar = useSelector(selectSidebar);

    // ✅ ESTADOS PRINCIPALES
    const [horario, setHorario] = useState<HorarioTomaAsistencia | null>(null);
    const [asistencia, setAsistencia] = useState<EstadoAsistencia>({
      entradaMarcada: false,
      salidaMarcada: false,
      inicializado: false,
    });
    const [estadoBoton, setEstadoBoton] = useState<EstadoBoton>({
      visible: false,
      tipo: null,
      color: "verde",
      tooltip: "",
    });

    // ✅ NUEVO: Estado para mensaje informativo
    const [mensajeInformativo, setMensajeInformativo] =
      useState<MensajeInformativo>({
        mostrar: false,
        texto: "",
        tipo: "sin-horario",
      });

    // ✅ NUEVO: Estado para el handler base
    const [handlerBase, setHandlerBase] =
      useState<HandlerAsistenciaBase | null>(null);

    // ===================================================================================
    //                         Variables de estado para modales
    // ===================================================================================
    const [mostrarModalTomarMiAsistencia, setMostrarModalTomarMiAsistencia] =
      useState(false);
    const [
      mostrarModalConfirmacioAsistenciaMarcada,
      setMostrarModalConfirmacioAsistenciaMarcada,
    ] = useState(false);
    const [
      mostrarModalFaltaActivarGPSoBrindarPermisosGPS,
      setMostrarModalFaltaActivarGPSoBrindarPermisosGPS,
    ] = useState(false);

    const [
      mostrarModalUbicacionFueraDelColegioAlRegistrarAsistenciaPropia,
      setMostrarModalFueraDelColegioAlRegistrarAsistenciaPropia,
    ] = useState(false);

    const [
      mostrarModalErrorGenericoAlRegistrarAsistenciaPropia,
      setMostrarErrorGenericoAlRegistrarAsistenciaPropia,
    ] = useState(false);

    const [
      mostrarModalFalloConexionAInternetAlMarcarAsistenciaPropia,
      setMostrarModalFalloConexionAInternetAlMarcarAsistenciaPropia,
    ] = useState(false);

    const [
      mostrarModalNoSePuedeUsarLaptop,
      setMostrarModalNoSePuedeUsarLaptop,
    ] = useState(false);

    const [mostrarModalDispositivoSinGPS, setMostrarModalDispositivoSinGPS] =
      useState(false);

    // ===================================================================================

    const [asistenciaIDB, setAsistenciaIDB] =
      useState<AsistenciaDePersonalIDB | null>(null);

    // ✅ REFS
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const retryRef = useRef<NodeJS.Timeout | null>(null);
    const ultimoModoConsultado = useRef<ModoRegistro | null>(null);

    // ✅ TOOLTIP MANAGEMENT (Reutilizado para mensaje informativo)
    const [tooltipOculto, setTooltipOculto] = useState(() => {
      if (typeof window !== "undefined") {
        return (
          sessionStorage.getItem(
            SE_MOSTRO_TOLTIP_TOMAR_ASISTENCIA_PERSONAL_KEY
          ) === "true"
        );
      }
      return false;
    });

    const ocultarTooltip = useCallback(() => {
      setTooltipOculto(true);
      sessionStorage.setItem(
        SE_MOSTRO_TOLTIP_TOMAR_ASISTENCIA_PERSONAL_KEY,
        "true"
      );
    }, []);

    const mostrarTooltip = useCallback(() => {
      setTooltipOculto(false);
      sessionStorage.setItem(
        SE_MOSTRO_TOLTIP_TOMAR_ASISTENCIA_PERSONAL_KEY,
        "false"
      );
    }, []);

    // ✅ NUEVO: Funciones para manejar mensaje informativo
    const ocultarMensajeInformativo = useCallback(() => {
      setMensajeInformativo((prev) => ({ ...prev, mostrar: false }));
      // Usar las mismas constantes que el tooltip
      sessionStorage.setItem(
        SE_MOSTRO_TOLTIP_TOMAR_ASISTENCIA_PERSONAL_KEY,
        "true"
      );
    }, []);

    // ✅ FUNCIÓN: Obtener fecha actual de Redux (sin causar re-renders)
    const obtenerFechaActual = useCallback((): Date | null => {
      const state = store.getState();
      const fechaHora = state.others.fechaHoraActualReal.fechaHora;
      const inicializado = state.others.fechaHoraActualReal.inicializado;

      console.log("🕐 OBTENIENDO FECHA ACTUAL DESDE REDUX:", {
        fechaHoraOriginal: fechaHora,
        inicializado,
      });

      if (!fechaHora || !inicializado) {
        console.log("❌ Fecha Redux no disponible o no inicializada");
        return null;
      }

      const fechaOriginal = new Date(fechaHora);
      const fecha = new Date(fechaHora);
      fecha.setHours(fecha.getHours() - 5); // Corregir zona horaria

      console.log("✅ FECHA CORREGIDA:", {
        fechaOriginal: fechaOriginal.toISOString(),
        fechaCorregida: fecha.toISOString(),
        horaOriginal: fechaOriginal.getHours(),
        horaCorregida: fecha.getHours(),
        diferencia: "5 horas restadas",
      });

      return fecha;
    }, []);

    // ✅ NUEVO: Verificar condiciones especiales (CON VERIFICACIÓN DE FECHAS)
    const verificarCondicionesEspeciales = useCallback((): string | null => {
      if (!handlerBase) return null;

      console.log("🔍 VERIFICANDO CONDICIONES ESPECIALES...");

      // 1. Fuera del año escolar (prioridad más alta)
      const fueraAño = handlerBase.estaFueraDeAnioEscolar();
      if (fueraAño) {
        console.log("🚫 FUERA DEL AÑO ESCOLAR");
        return "Fuera del periode escolar, no se registra asistencia";
      }

      // 2. Día de evento
      const diaEvento = handlerBase.esHoyDiaDeEvento();
      if (diaEvento) {
        console.log("🚫 DÍA DE EVENTO:", diaEvento.Nombre);
        return `Hoy es ${diaEvento.Nombre}, no se registra asistencia`;
      }

      // 3. ✅ VERIFICACIÓN DE FECHAS (fechaLocalPeru < fechaRedux)
      const fechaRedux = obtenerFechaActual();
      if (fechaRedux) {
        const fechaLocalPeru = handlerBase.getFechaLocalPeru();

        console.log("🕐 VERIFICANDO FECHAS PARA REGISTRO:", {
          fechaLocalPeru: fechaLocalPeru.toISOString(),
          fechaRedux: fechaRedux.toISOString(),
          fechaLocalPeruFecha: fechaLocalPeru.toDateString(),
          fechaReduxFecha: fechaRedux.toDateString(),
        });

        // Comparar solo fechas (sin horas)
        const fechaReduxSinHora = new Date(
          fechaRedux.getFullYear(),
          fechaRedux.getMonth(),
          fechaRedux.getDate()
        );
        const fechaPeruSinHora = new Date(
          fechaLocalPeru.getFullYear(),
          fechaLocalPeru.getMonth(),
          fechaLocalPeru.getDate()
        );

        console.log("📅 COMPARACIÓN DE FECHAS:", {
          fechaPeruSinHora: fechaPeruSinHora.toISOString(),
          fechaReduxSinHora: fechaReduxSinHora.toISOString(),
          esFechaPeruMenor: fechaPeruSinHora < fechaReduxSinHora,
          diferenciaDias: Math.floor(
            (fechaReduxSinHora.getTime() - fechaPeruSinHora.getTime()) /
              (1000 * 60 * 60 * 24)
          ),
        });

        if (fechaPeruSinHora < fechaReduxSinHora) {
          console.log("🚫 FECHA LOCAL MENOR - Mostrando mensaje de espera");
          return "Aun no puedes registrar tu asistencia";
        }

        // 4. Fin de semana (después de verificar fechas)
        const diaSemana = fechaRedux.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
        if (diaSemana === 0) {
          // Domingo
          console.log("🚫 ES DOMINGO");
          return "Hoy es domingo, no se registra asistencia";
        }
        if (diaSemana === 6) {
          // Sábado
          console.log("🚫 ES SÁBADO");
          return "Hoy es sábado, no se registra asistencia";
        }
      }

      console.log("✅ NO HAY CONDICIONES ESPECIALES");
      return null;
    }, [handlerBase, obtenerFechaActual]);

    // ✅ FUNCIÓN: Determinar modo actual basado en horario y fecha
    const determinarModoActual = useCallback(
      (
        horario: HorarioTomaAsistencia | null,
        fechaActual: Date | null = null
      ): ModoActual => {
        console.log("🔍 INICIANDO determinarModoActual:", {
          horario,
          fechaActual,
        });

        if (!horario) {
          console.log("❌ Sin horario disponible");
          return { activo: false, tipo: null, razon: "Horario no disponible" };
        }

        // ✅ Obtener fecha actual si no se proporciona
        const fecha = fechaActual || obtenerFechaActual();
        if (!fecha) {
          console.log("❌ Sin fecha disponible");
          return { activo: false, tipo: null, razon: "Fecha no disponible" };
        }

        console.log("📅 FECHA ACTUAL OBTENIDA:", {
          fecha: fecha.toISOString(),
          horaLocal: fecha.toLocaleTimeString(),
          timestamp: fecha.getTime(),
        });

        const horarioInicio = new Date(horario.Inicio);
        const horarioFin = new Date(horario.Fin);

        console.log("🕐 HORARIOS ORIGINALES:", {
          inicio: horarioInicio.toISOString(),
          fin: horarioFin.toISOString(),
          inicioLocal: horarioInicio.toLocaleTimeString(),
          finLocal: horarioFin.toLocaleTimeString(),
        });

        // Normalizar horarios a la fecha actual
        const inicioHoy = new Date(fecha);
        inicioHoy.setHours(
          horarioInicio.getHours(),
          horarioInicio.getMinutes(),
          0,
          0
        );

        const finHoy = new Date(fecha);
        finHoy.setHours(horarioFin.getHours(), horarioFin.getMinutes(), 0, 0);

        console.log("🕐 HORARIOS NORMALIZADOS HOY:", {
          inicioHoy: inicioHoy.toLocaleTimeString(),
          finHoy: finHoy.toLocaleTimeString(),
        });

        // Calcular puntos de control
        const unaHoraAntesInicio = new Date(
          inicioHoy.getTime() - HORAS_ANTES_INICIO_ACTIVACION * 60 * 60 * 1000
        );
        const unaHoraAntesSalida = new Date(
          finHoy.getTime() - HORAS_ANTES_SALIDA_CAMBIO_MODO * 60 * 60 * 1000
        );
        const dosHorasDespuesSalida = new Date(
          finHoy.getTime() + HORAS_DESPUES_SALIDA_LIMITE * 60 * 60 * 1000
        );

        console.log("⏰ PUNTOS DE CONTROL:", {
          fechaActual: fecha.toLocaleTimeString(),
          unaHoraAntesInicio: unaHoraAntesInicio.toLocaleTimeString(),
          unaHoraAntesSalida: unaHoraAntesSalida.toLocaleTimeString(),
          dosHorasDespuesSalida: dosHorasDespuesSalida.toLocaleTimeString(),
          constantes: {
            HORAS_ANTES_INICIO_ACTIVACION,
            HORAS_ANTES_SALIDA_CAMBIO_MODO,
            HORAS_DESPUES_SALIDA_LIMITE,
          },
        });

        // Si estamos antes de 1 hora antes del inicio
        if (fecha < unaHoraAntesInicio) {
          const razon = `Muy temprano. Activación a las ${unaHoraAntesInicio.toLocaleTimeString()}`;
          console.log("🚫 RESULTADO: Muy temprano", razon);
          return {
            activo: false,
            tipo: null,
            razon,
          };
        }

        // Si estamos después de 2 horas después de la salida
        if (fecha > dosHorasDespuesSalida) {
          const razon = "Período de asistencia finalizado";
          console.log("🚫 RESULTADO: Muy tarde", razon);
          return {
            activo: false,
            tipo: null,
            razon,
          };
        }

        // Determinar el modo según el momento
        if (fecha < unaHoraAntesSalida) {
          console.log("✅ RESULTADO: Modo ENTRADA");
          return {
            activo: true,
            tipo: ModoRegistro.Entrada,
            razon: "Período de registro de entrada",
          };
        } else {
          console.log("✅ RESULTADO: Modo SALIDA");
          return {
            activo: true,
            tipo: ModoRegistro.Salida,
            razon: "Período de registro de salida",
          };
        }
      },
      [obtenerFechaActual]
    );

    // ✅ FUNCIÓN: Consultar asistencia del modo específico
    const consultarAsistenciaModo = useCallback(
      async (modo: ModoRegistro, razon: string): Promise<void> => {
        if (!asistenciaIDB) {
          console.log("❌ AsistenciaIDB no disponible");
          return;
        }

        try {
          console.log(`🔍 CONSULTANDO ${modo} - Razón: ${razon}`);

          const resultado = await asistenciaIDB.consultarMiAsistenciaDeHoy(
            modo,
            rol
          );

          console.log(`✅ Resultado ${modo}:`, {
            marcada: resultado.marcada,
            fuente: resultado.fuente,
          });

          // ✅ ACTUALIZAR SOLO EL ESTADO CORRESPONDIENTE
          setAsistencia((prev) => ({
            ...prev,
            entradaMarcada:
              modo === ModoRegistro.Entrada
                ? resultado.marcada
                : prev.entradaMarcada,
            salidaMarcada:
              modo === ModoRegistro.Salida
                ? resultado.marcada
                : prev.salidaMarcada,
            inicializado: true,
          }));
        } catch (error) {
          console.error(`❌ Error al consultar ${modo}:`, error);
        }
      },
      [asistenciaIDB, rol]
    );

    // ✅ FUNCIÓN: Obtener horario del usuario
    const obtenerHorario = useCallback(async () => {
      if (rol === RolesSistema.Directivo || rol === RolesSistema.Responsable)
        return;

      try {
        console.log(`🔄 Obteniendo horario para ${rol}`);

        const datosIDB = new DatosAsistenciaHoyIDB();
        const handler = (await datosIDB.getHandler()) as HandlerAsistenciaBase;

        if (!handler) {
          console.warn("Handler no disponible, reintentando...");
          if (retryRef.current) clearTimeout(retryRef.current);
          retryRef.current = setTimeout(obtenerHorario, RETRY_HORARIO_MS);
          return;
        }

        // ✅ NUEVO: Guardar el handler base para verificaciones
        setHandlerBase(handler);

        let nuevoHorario: HorarioTomaAsistencia | null = null;

        switch (rol) {
          case RolesSistema.ProfesorPrimaria:
            nuevoHorario = (
              handler as HandlerProfesorPrimariaAsistenciaResponse
            ).getMiHorarioTomaAsistencia();
            break;
          case RolesSistema.Auxiliar:
            nuevoHorario = (
              handler as HandlerAuxiliarAsistenciaResponse
            ).getMiHorarioTomaAsistencia();
            break;
          case RolesSistema.ProfesorSecundaria:
          case RolesSistema.Tutor:
            const horarioPersonal = (
              handler as HandlerProfesorTutorSecundariaAsistenciaResponse
            ).getMiHorarioTomaAsistencia();
            if (horarioPersonal) {
              nuevoHorario = {
                Inicio: horarioPersonal.Hora_Entrada_Dia_Actual,
                Fin: horarioPersonal.Hora_Salida_Dia_Actual,
              };
            }
            break;
          case RolesSistema.PersonalAdministrativo:
            const horarioAdmin = (
              handler as HandlerPersonalAdministrativoAsistenciaResponse
            ).getHorarioPersonal();
            if (horarioAdmin) {
              nuevoHorario = {
                Inicio: horarioAdmin.Horario_Laboral_Entrada,
                Fin: horarioAdmin.Horario_Laboral_Salida,
              };
            }
            break;
        }

        if (nuevoHorario) {
          setHorario(nuevoHorario);
          console.log(`✅ Horario obtenido para ${rol}:`, nuevoHorario);
        } else {
          console.warn(
            "Horario no disponible, El usuario no registra asistencia hoy..."
          );
          setHorario(null); // Importante: establecer null explícitamente
        }
      } catch (error) {
        console.error("Error al obtener horario:", error);
        if (retryRef.current) clearTimeout(retryRef.current);
        retryRef.current = setTimeout(obtenerHorario, RETRY_HORARIO_MS);
      }
    }, [rol]);

    // ✅ FUNCIÓN: Actualizar estado del botón
    const actualizarEstadoBoton = useCallback(() => {
      // ✅ NUEVO: Verificar condiciones especiales primero
      const condicionEspecial = verificarCondicionesEspeciales();
      if (condicionEspecial) {
        console.log("🚫 Condición especial detectada:", condicionEspecial);
        setEstadoBoton({
          visible: false,
          tipo: null,
          color: "verde",
          tooltip: "",
        });
        return;
      }

      // ✅ NUEVO: Verificar si no hay horario (después de condiciones especiales)
      if (handlerBase && !horario) {
        console.log("🚫 Sin horario disponible");
        setEstadoBoton({
          visible: false,
          tipo: null,
          color: "verde",
          tooltip: "",
        });
        return;
      }

      const modoActual = determinarModoActual(horario);

      console.log("🎯 MODO ACTUAL:", modoActual);

      if (!modoActual.activo || !modoActual.tipo) {
        console.log("🚫 Botón oculto:", modoActual.razon);
        setEstadoBoton({
          visible: false,
          tipo: null,
          color: "verde",
          tooltip: "",
        });
        return;
      }

      // ✅ VERIFICAR SI YA SE MARCÓ LA ASISTENCIA DEL MODO ACTUAL
      const yaSeMarco =
        modoActual.tipo === ModoRegistro.Entrada
          ? asistencia.entradaMarcada
          : asistencia.salidaMarcada;

      if (yaSeMarco) {
        console.log(`✅ ${modoActual.tipo} ya marcada, ocultando botón`);
        setEstadoBoton({
          visible: false,
          tipo: null,
          color: "verde",
          tooltip: "",
        });
        return;
      }

      // ✅ MOSTRAR BOTÓN CON EL MODO ACTUAL
      const esEntrada = modoActual.tipo === ModoRegistro.Entrada;
      const color = esEntrada ? "verde" : "rojizo";

      console.log(`👁️ Mostrando botón para ${modoActual.tipo}`);

      setEstadoBoton({
        visible: true,
        tipo: modoActual.tipo,
        color,
        tooltip: `¡Registra tu ${modoRegistroTextos[modoActual.tipo]}!`,
      });
    }, [
      horario,
      handlerBase,
      asistencia.entradaMarcada,
      asistencia.salidaMarcada,
      determinarModoActual,
      verificarCondicionesEspeciales,
    ]);

    // ✅ NUEVO: Verificar y mostrar mensaje informativo
    const verificarMensajeInformativo = useCallback(() => {
      // Solo mostrar si no se ha mostrado antes en esta sesión
      if (tooltipOculto) return;

      // Verificar condiciones en orden de prioridad
      const condicionEspecial = verificarCondicionesEspeciales();
      if (condicionEspecial) {
        let tipo: MensajeInformativo["tipo"] = "sin-horario";

        if (condicionEspecial.includes("Fuera del periode")) {
          tipo = "fuera-año";
        } else if (
          condicionEspecial.includes("domingo") ||
          condicionEspecial.includes("sábado")
        ) {
          tipo = "fin-semana";
        } else if (condicionEspecial.includes("Aun no puedes")) {
          tipo = "fecha-no-disponible";
        } else if (condicionEspecial.includes("no se registra asistencia")) {
          tipo = "dia-evento";
        }

        setMensajeInformativo({
          mostrar: true,
          texto: condicionEspecial,
          tipo,
        });
        return;
      }

      // Verificar si no hay horario
      if (handlerBase && !horario) {
        setMensajeInformativo({
          mostrar: true,
          texto: "No hay asistencia que debas registrar hoy",
          tipo: "sin-horario",
        });
        return;
      }
    }, [tooltipOculto, verificarCondicionesEspeciales, handlerBase, horario]);

    // ✅ FUNCIÓN: Consulta periódica inteligente (INDEPENDIENTE de Redux)
    const consultaPeriodicaInteligente = useCallback(() => {
      // No ejecutar si hay mensaje informativo
      if (mensajeInformativo.mostrar) return;

      const modoActual = determinarModoActual(horario);

      if (!modoActual.activo || !modoActual.tipo) {
        console.log("⏭️ Sin consulta periódica: modo no activo");
        return;
      }

      const yaSeMarco =
        modoActual.tipo === ModoRegistro.Entrada
          ? asistencia.entradaMarcada
          : asistencia.salidaMarcada;

      if (yaSeMarco) {
        console.log(`⏭️ Sin consulta periódica: ${modoActual.tipo} ya marcada`);
        return;
      }

      // ✅ SOLO CONSULTAR SI ES UN MODO DIFERENTE O ES LA PRIMERA VEZ
      if (ultimoModoConsultado.current !== modoActual.tipo) {
        console.log(
          `🔄 Cambio de modo detectado: ${ultimoModoConsultado.current} → ${modoActual.tipo}`
        );
        ultimoModoConsultado.current = modoActual.tipo;
      }

      consultarAsistenciaModo(
        modoActual.tipo,
        "consulta periódica inteligente"
      );
    }, [
      mensajeInformativo.mostrar,
      horario,
      asistencia.entradaMarcada,
      asistencia.salidaMarcada,
      consultarAsistenciaModo,
      determinarModoActual,
    ]);

    // ✅ INICIALIZACIÓN
    useEffect(() => {
      console.log("🔧 INICIALIZANDO AsistenciaDePersonalIDB...");
      const nuevaAsistenciaIDB = new AsistenciaDePersonalIDB("API01");
      setAsistenciaIDB(nuevaAsistenciaIDB);
      console.log(
        "✅ AsistenciaDePersonalIDB inicializada:",
        nuevaAsistenciaIDB
      );
    }, []);

    useEffect(() => {
      if (!horario && !handlerBase) {
        obtenerHorario();
      } else {
        console.log("📋 HORARIO/HANDLER YA DISPONIBLE, MOSTRANDO CONSTANTES:", {
          HORAS_ANTES_INICIO_ACTIVACION,
          HORAS_ANTES_SALIDA_CAMBIO_MODO,
          HORAS_DESPUES_SALIDA_LIMITE,
          INTERVALO_CONSULTA_MS:
            INTERVALO_CONSULTA_ASISTENCIA_OPTIMIZADO_MS / (1000 * 60) +
            " minutos",
        });
      }
    }, [horario, handlerBase, obtenerHorario]);

    // ✅ NUEVO: Verificar mensaje informativo cuando se obtiene handler/horario
    useEffect(() => {
      if (handlerBase && reduxInicializado) {
        verificarMensajeInformativo();
      }
    }, [handlerBase, horario, reduxInicializado, verificarMensajeInformativo]);

    // ✅ CONSULTA INICIAL cuando se obtiene el horario Y Redux está inicializado
    useEffect(() => {
      console.log("🚀 USEEFFECT CONSULTA INICIAL - Verificando condiciones:", {
        horario: !!horario,
        inicializadoAsistencia: asistencia.inicializado,
        reduxInicializado,
        mensajeInformativo: mensajeInformativo.mostrar,
        debeEjecutar:
          horario &&
          !asistencia.inicializado &&
          reduxInicializado &&
          !mensajeInformativo.mostrar,
      });

      if (
        horario &&
        !asistencia.inicializado &&
        reduxInicializado &&
        !mensajeInformativo.mostrar
      ) {
        console.log("🚀 INICIANDO CONSULTA INICIAL... (Redux ya inicializado)");

        const modoActual = determinarModoActual(horario);

        console.log("🎯 MODO DETERMINADO EN CONSULTA INICIAL:", modoActual);

        if (modoActual.activo && modoActual.tipo) {
          console.log(
            "✅ EJECUTANDO CONSULTA INICIAL - Modo:",
            modoActual.tipo
          );
          ultimoModoConsultado.current = modoActual.tipo;
          consultarAsistenciaModo(modoActual.tipo, "consulta inicial");
        } else {
          console.log(
            "❌ NO SE EJECUTA CONSULTA INICIAL - Razón:",
            modoActual.razon
          );
        }
      } else {
        if (!horario)
          console.log("⏭️ Sin horario disponible para consulta inicial");
        if (asistencia.inicializado)
          console.log("⏭️ Ya inicializado, no ejecutar consulta inicial");
        if (!reduxInicializado)
          console.log("⏭️ Redux no inicializado, esperando...");
        if (mensajeInformativo.mostrar)
          console.log("⏭️ Mensaje informativo activo, no consultar");
      }
    }, [
      horario,
      asistencia.inicializado,
      reduxInicializado,
      mensajeInformativo.mostrar,
      consultarAsistenciaModo,
      determinarModoActual,
    ]);

    // ✅ ACTUALIZAR ESTADO DEL BOTÓN - Solo depende de datos ESTABLES
    useEffect(() => {
      if (
        (asistencia.inicializado || (handlerBase && !horario)) &&
        reduxInicializado
      ) {
        actualizarEstadoBoton();
      } else {
        console.log(
          "⏭️ No actualizar estado del botón - Esperando inicialización:",
          {
            asistenciaInicializada: asistencia.inicializado,
            handlerDisponible: !!handlerBase,
            horarioDisponible: !!horario,
            reduxInicializado,
          }
        );
      }
    }, [
      asistencia.inicializado,
      asistencia.entradaMarcada,
      asistencia.salidaMarcada,
      horario,
      handlerBase,
      reduxInicializado,
      actualizarEstadoBoton,
    ]);

    // ✅ CONSULTA CADA 5 MINUTOS - INTERVALO INDEPENDIENTE
    useEffect(() => {
      if (
        !asistencia.inicializado ||
        !horario ||
        !reduxInicializado ||
        mensajeInformativo.mostrar
      )
        return;

      console.log(
        `⏰ Configurando consulta cada ${
          INTERVALO_CONSULTA_ASISTENCIA_OPTIMIZADO_MS / (1000 * 60)
        } minutos`
      );

      const intervalo = setInterval(() => {
        consultaPeriodicaInteligente();
      }, INTERVALO_CONSULTA_ASISTENCIA_OPTIMIZADO_MS);

      intervalRef.current = intervalo;

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [
      asistencia.inicializado,
      horario,
      reduxInicializado,
      mensajeInformativo.mostrar,
      consultaPeriodicaInteligente,
    ]);

    // ✅ DETECTAR CAMBIO DE MODO SOLO CADA 10 MINUTOS (no cada segundo)
    useEffect(() => {
      if (
        !horaMinutoActual ||
        !asistencia.inicializado ||
        !horario ||
        !reduxInicializado ||
        mensajeInformativo.mostrar
      )
        return;

      // ✅ Solo verificar cambio de modo cada 10 minutos
      if (horaMinutoActual.minuto % 10 === 0) {
        console.log(
          `🕐 Verificación de cambio de modo cada 10min: ${horaMinutoActual.hora}:${horaMinutoActual.minuto}`
        );

        const modoActual = determinarModoActual(
          horario,
          horaMinutoActual.fecha
        );

        if (
          modoActual.activo &&
          modoActual.tipo &&
          ultimoModoConsultado.current !== modoActual.tipo
        ) {
          console.log(
            `🔄 CAMBIO DE MODO DETECTADO: ${ultimoModoConsultado.current} → ${modoActual.tipo}`
          );
          ultimoModoConsultado.current = modoActual.tipo;
          consultarAsistenciaModo(
            modoActual.tipo,
            "cambio de modo por horario"
          );
        }
      }
    }, [
      horaMinutoActual?.timestamp,
      asistencia.inicializado,
      horario,
      reduxInicializado,
      mensajeInformativo.mostrar,
      consultarAsistenciaModo,
      determinarModoActual,
    ]);

    // ✅ DELEGACIÓN DE EVENTOS PARA TOOLTIP
    useEffect(() => {
      if (!delegarEvento) return;
      delegarEvento(
        "mousedown",
        "#tooltip-mostrar-asistencia-personal, #tooltip-mostrar-asistencia-personal *",
        () => ocultarTooltip(),
        true
      );
    }, [delegarEvento, ocultarTooltip]);

    // ✅ VISIBILIDAD DE PESTAÑA
    useEffect(() => {
      const handleVisibility = () => {
        if (
          document.visibilityState === "visible" &&
          asistencia.inicializado &&
          horario &&
          reduxInicializado &&
          !mensajeInformativo.mostrar
        ) {
          console.log("👁️ Pestaña visible, verificando modo actual");
          const modoActual = determinarModoActual(horario);

          if (modoActual.activo && modoActual.tipo) {
            const yaSeMarco =
              modoActual.tipo === ModoRegistro.Entrada
                ? asistencia.entradaMarcada
                : asistencia.salidaMarcada;

            if (!yaSeMarco) {
              consultarAsistenciaModo(modoActual.tipo, "pestaña visible");
            }
          }
        }
      };

      document.addEventListener("visibilitychange", handleVisibility);
      return () =>
        document.removeEventListener("visibilitychange", handleVisibility);
    }, [
      asistencia.inicializado,
      asistencia.entradaMarcada,
      asistencia.salidaMarcada,
      horario,
      reduxInicializado,
      mensajeInformativo.mostrar,
      consultarAsistenciaModo,
      determinarModoActual,
    ]);

    // ✅ MOSTRAR TOOLTIP AL CAMBIAR TIPO (solo si no hay mensaje informativo)
    useEffect(() => {
      if (estadoBoton.tipo && !mensajeInformativo.mostrar) {
        mostrarTooltip();
      }
    }, [estadoBoton.tipo, mensajeInformativo.mostrar, mostrarTooltip]);

    // ✅ HANDLE CLICK
    const handleClick = useCallback(() => {
      if (!estadoBoton.visible) return;

      if (!tooltipOculto) ocultarTooltip();
      setMostrarModalTomarMiAsistencia(true);
    }, [estadoBoton.visible, tooltipOculto, ocultarTooltip]);

    // ✅ CLEANUP
    useEffect(() => {
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (retryRef.current) clearTimeout(retryRef.current);
      };
    }, []);

    // ✅ FUNCIÓN PARA MARCAR ASISTENCIA DE HOY
    const marcarMiAsistenciaDeHoy = useCallback(async () => {
      try {
        if (!estadoBoton.tipo || !horario) {
          console.error("❌ No hay tipo de registro o horario disponible");
          return;
        }

        // Obtener la hora esperada ISO basada en el modo de registro
        const fechaActual = obtenerFechaActual();
        if (!fechaActual) {
          console.error("❌ No se pudo obtener la fecha actual");
          return;
        }

        let horaEsperadaISO: string;

        if (estadoBoton.tipo === ModoRegistro.Entrada) {
          // Para entrada, usar hora de inicio del horario
          const horaInicio = new Date(horario.Inicio);
          const fechaInicioHoy = new Date(fechaActual);
          fechaInicioHoy.setHours(
            horaInicio.getHours(),
            horaInicio.getMinutes(),
            0,
            0
          );
          horaEsperadaISO = fechaInicioHoy.toISOString();
        } else {
          // Para salida, usar hora de fin del horario
          const horaFin = new Date(horario.Fin);
          const fechaFinHoy = new Date(fechaActual);
          fechaFinHoy.setHours(horaFin.getHours(), horaFin.getMinutes(), 0, 0);
          horaEsperadaISO = fechaFinHoy.toISOString();
        }

        console.log(
          `🕐 Hora esperada ISO para ${estadoBoton.tipo}:`,
          horaEsperadaISO
        );

        // Intentar marcar asistencia usando el orquestador
        if (!asistenciaIDB) {
          console.error("❌ AsistenciaIDB no disponible");
          return;
        }

        await asistenciaIDB.marcarMiAsistenciaPropia(
          rol,
          estadoBoton.tipo,
          horaEsperadaISO
        );

        // Si llegamos aquí, todo fue exitoso
        console.log("✅ Asistencia marcada exitosamente");
      } catch (error) {
        console.error("❌ Error al marcar mi asistencia:", error);
        throw error; // Re-lanzar para que el modal lo maneje
      }
    }, [estadoBoton.tipo, horario, obtenerFechaActual, asistenciaIDB]);

    // ✅ RENDER: Mensaje informativo o botón
    const mostrarTooltipActual = !tooltipOculto && !mensajeInformativo.mostrar;

    return (
      <>
        {/* ✅ NUEVO: Mensaje informativo */}
        {mensajeInformativo.mostrar && (
          <MensajeInformativoAsistencia
            mensaje={mensajeInformativo}
            onCerrar={ocultarMensajeInformativo}
            navbarHeight={sidebar.height}
          />
        )}

        {mostrarModalTomarMiAsistencia && (
          <MarcarAsistenciaPropiaDePersonalModal
            eliminateModal={() => setMostrarModalTomarMiAsistencia(false)}
            modoRegistro={determinarModoActual(horario).tipo!}
            marcarMiAsistenciaDeHoy={marcarMiAsistenciaDeHoy}
            setMostrarModalConfirmacioAsistenciaMarcada={
              setMostrarModalConfirmacioAsistenciaMarcada
            }
            setMostrarModalFaltaActivarGPSoBrindarPermisosGPS={
              setMostrarModalFaltaActivarGPSoBrindarPermisosGPS
            }
            setMostrarModalUbicacionFueraDelColegioAlRegistrarAsistenciaPropia={
              setMostrarModalFueraDelColegioAlRegistrarAsistenciaPropia
            }
            setMostrarModalErrorGenericoAlRegistrarAsistenciaPropia={
              setMostrarErrorGenericoAlRegistrarAsistenciaPropia
            }
            setMostrarModalFalloConexionAInternet={
              setMostrarModalFalloConexionAInternetAlMarcarAsistenciaPropia
            }
            setMostrarModalNoSePuedeUsarLaptop={
              setMostrarModalNoSePuedeUsarLaptop
            }
            setMostrarModalDispositivoSinGPS={setMostrarModalDispositivoSinGPS}
          />
        )}

        {mostrarModalConfirmacioAsistenciaMarcada && (
          <ConfirmacionAsistenciaMarcadaModal
            eliminateModal={() => {
              setMostrarModalConfirmacioAsistenciaMarcada(false);
            }}
          />
        )}

        {mostrarModalFaltaActivarGPSoBrindarPermisosGPS && (
          <ActivarGPSoBrindarPermisosGPSModal
            modoRegistro={estadoBoton.tipo!}
            eliminateModal={() => {
              setMostrarModalFaltaActivarGPSoBrindarPermisosGPS(false);
            }}
          />
        )}

        {mostrarModalUbicacionFueraDelColegioAlRegistrarAsistenciaPropia && (
          <UbicacionFueraDelColegioAlRegistrarAsistenciaPropiaModal
            eliminateModal={() => {
              setMostrarModalFueraDelColegioAlRegistrarAsistenciaPropia(false);
            }}
          />
        )}

        {mostrarModalErrorGenericoAlRegistrarAsistenciaPropia && (
          <ErrorGenericoAlRegistrarAsistenciaPropiaModal
            eliminateModal={() => {
              setMostrarErrorGenericoAlRegistrarAsistenciaPropia(false);
            }}
          />
        )}

        {mostrarModalNoSePuedeUsarLaptop && (
          <NoSePuedeUsarLaptopParaAsistenciaModal
            eliminateModal={() => setMostrarModalNoSePuedeUsarLaptop(false)}
          />
        )}

        {mostrarModalDispositivoSinGPS && (
          <DispositivoSinGPSModal
            eliminateModal={() => setMostrarModalDispositivoSinGPS(false)}
          />
        )}

        {mostrarModalFalloConexionAInternetAlMarcarAsistenciaPropia && (
          <FalloConexionAInternetAlMarcarAsistenciaPropiaModal
            eliminateModal={() => {
              setMostrarModalFalloConexionAInternetAlMarcarAsistenciaPropia(
                false
              );
            }}
          />
        )}

        <style>
          {`
        @keyframes Modificar-Bottom-NavBarFooter {
            to {
                bottom: ${sidebar.isOpen ? `${sidebar.height + 12}px` : "12px"};
            }
        }
        .Mover-NavBarFooter {
            animation: Modificar-Bottom-NavBarFooter 0.3s forwards;
        }

        @keyframes tooltipFadeIn {
            from {
                opacity: 0;
                transform: translateX(15px) scale(0.9);
            }
            to {
                opacity: 1;
                transform: translateX(0) scale(1);
            }
        }

        @keyframes tooltipPulse {
            0%, 100% { transform: translateX(0) scale(1); }
            50% { transform: translateX(-2px) scale(1.02); }
        }

        @keyframes buttonPulse {
            0%, 100% {
                transform: scale(1);
                box-shadow:
                    0 6px 20px rgba(0, 0, 0, 0.2),
                    0 2px 8px 2px rgba(34, 197, 94, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
            }
            50% {
                transform: scale(1.05);
                box-shadow:
                    0 8px 25px rgba(0, 0, 0, 0.25),
                    0 3px 12px 3px rgba(34, 197, 94, 0.4),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3);
            }
        }

        @keyframes buttonPulseRojo {
            0%, 100% {
                transform: scale(1);
                box-shadow:
                    0 6px 20px rgba(0, 0, 0, 0.2),
                    0 2px 8px 2px rgba(239, 68, 68, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
            }
            50% {
                transform: scale(1.05);
                box-shadow:
                    0 8px 25px rgba(0, 0, 0, 0.25),
                    0 3px 12px 3px rgba(239, 68, 68, 0.4),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3);
            }
        }

        /* ✅ NUEVOS: Estilos para móviles con sombra reducida y más separación */
        @media (max-width: 300px) {
            .button-enhanced-verde {
                animation: buttonPulse 3s ease-in-out infinite;
                box-shadow:
                    0 4px 15px rgba(0, 0, 0, 0.15),
                    0 1px 6px 1px rgba(34, 197, 94, 0.25),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
            }
            .button-enhanced-rojizo {
                animation: buttonPulseRojo 3s ease-in-out infinite;
                box-shadow:
                    0 4px 15px rgba(0, 0, 0, 0.15),
                    0 1px 6px 1px rgba(239, 68, 68, 0.25),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
            }
        }

        @media (min-width: 300px) and (max-width: 499px) {
            .button-enhanced-verde {
                animation: buttonPulse 3s ease-in-out infinite;
                box-shadow:
                    0 4px 15px rgba(0, 0, 0, 0.15),
                    0 1px 6px 1px rgba(34, 197, 94, 0.25),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
            }
            .button-enhanced-rojizo {
                animation: buttonPulseRojo 3s ease-in-out infinite;
                box-shadow:
                    0 4px 15px rgba(0, 0, 0, 0.15),
                    0 1px 6px 1px rgba(239, 68, 68, 0.25),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
            }
        }

        @media (min-width: 500px) and (max-width: 767px) {
            .button-enhanced-verde {
                animation: buttonPulse 3s ease-in-out infinite;
                box-shadow:
                    0 4px 15px rgba(0, 0, 0, 0.15),
                    0 1px 6px 1px rgba(34, 197, 94, 0.25),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
            }
            .button-enhanced-rojizo {
                animation: buttonPulseRojo 3s ease-in-out infinite;
                box-shadow:
                    0 4px 15px rgba(0, 0, 0, 0.15),
                    0 1px 6px 1px rgba(239, 68, 68, 0.25),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
            }
        }

        /* Estilos originales para pantallas grandes */
        @media (min-width: 768px) {
            .button-enhanced-verde {
                animation: buttonPulse 3s ease-in-out infinite;
            }
            .button-enhanced-rojizo {
                animation: buttonPulseRojo 3s ease-in-out infinite;
            }
        }

        .tooltip-animation {
            animation: tooltipFadeIn 0.4s ease-out, tooltipPulse 2s ease-in-out infinite 1s;
        }
        `}
        </style>

        {/* ✅ BOTÓN: Solo mostrar si es visible y no hay mensaje informativo */}
        {estadoBoton.visible && !mensajeInformativo.mostrar && (
          <div
            className="fixed z-[102] right-0 Mover-NavBarFooter
                     sxs-only:mr-3 sxs-only:mb-3
                     xs-only:mr-4 xs-only:mb-4
                     sm-only:mr-5 sm-only:mb-4
                     mr-6 mb-5"
            style={{ bottom: sidebar.height + 12 }}
          >
            {/* Tooltip */}
            {mostrarTooltipActual && (
              <div
                id="tooltip-mostrar-asistencia-personal"
                className="absolute tooltip-animation
                         sxs-only:right-14 sxs-only:top-1
                         xs-only:right-16 xs-only:top-2
                         sm-only:right-18 sm-only:top-2
                         right-20 top-3"
              >
                <div
                  className={`${
                    estadoBoton.color === "verde"
                      ? "bg-azul-principal"
                      : "bg-red-600"
                  } text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg relative
                           sxs-only:px-2 sxs-only:py-1 sxs-only:text-xs
                           xs-only:px-2 xs-only:py-1 xs-only:text-xs
                           sm-only:px-3 sm-only:py-2 sm-only:text-sm
                           whitespace-nowrap transition-all duration-300`}
                >
                  {estadoBoton.tooltip}
                  <div
                    className={`absolute top-1/2 transform -translate-y-1/2
                           left-full border-l-4 border-y-4 border-y-transparent ${
                             estadoBoton.color === "verde"
                               ? "border-l-azul-principal"
                               : "border-l-red-600"
                           }`}
                  ></div>
                </div>
              </div>
            )}

            {/* Botón */}
            <button
              onClick={handleClick}
              title={`Registrar ${estadoBoton.tipo}`}
              className={`${
                mostrarTooltipActual
                  ? estadoBoton.color === "verde"
                    ? "button-enhanced-verde"
                    : "button-enhanced-rojizo"
                  : "transition-all duration-300"
              }
                     relative overflow-hidden aspect-square
                     ${
                       estadoBoton.color === "verde"
                         ? "bg-gradient-to-br from-verde-principal to-green-600 hover:from-green-500 hover:to-green-700"
                         : "bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800"
                     }
                     rounded-full flex items-center justify-center
                     transition-all duration-300 ease-out
                     hover:scale-110 active:scale-95
                     shadow-[0_6px_20px_rgba(0,0,0,0.3),0_2px_8px_rgba(34,197,94,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]
                     hover:shadow-[0_10px_30px_rgba(0,0,0,0.35),0_4px_15px_rgba(34,197,94,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]
                     border-2 border-green-400/20
                     sxs-only:w-12 sxs-only:h-12 sxs-only:p-2
                     xs-only:w-14 xs-only:h-14 xs-only:p-3
                     sm-only:w-16 sm-only:h-16 sm-only:p-3
                     w-18 h-18 p-4`}
            >
              {/* Efecto de brillo en hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full hover:translate-x-full transition-transform duration-700"></div>

              <LapizFirmando className="text-white relative z-10 drop-shadow-sm sxs-only:w-6 xs-only:w-7 sm-only:w-8 w-8" />

              {/* Punto de notificación cuando hay tooltip */}
              {mostrarTooltipActual && (
                <div
                  className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white animate-ping
                         sxs-only:w-2 sxs-only:h-2 ${
                           estadoBoton.color === "verde"
                             ? "bg-blue-500"
                             : "bg-yellow-500"
                         }`}
                />
              )}

              {/* Indicadores de estado */}
              <div className="absolute -bottom-1 -left-1 flex space-x-1">
                <div
                  className={`w-2 h-2 rounded-full border border-white transition-all ${
                    asistencia.entradaMarcada
                      ? "bg-green-400 scale-110"
                      : "bg-gray-400"
                  }`}
                  title={
                    asistencia.entradaMarcada
                      ? "Entrada registrada"
                      : "Entrada pendiente"
                  }
                />
                <div
                  className={`w-2 h-2 rounded-full border border-white transition-all ${
                    asistencia.salidaMarcada
                      ? "bg-green-400 scale-110"
                      : "bg-gray-400"
                  }`}
                  title={
                    asistencia.salidaMarcada
                      ? "Salida registrada"
                      : "Salida pendiente"
                  }
                />
              </div>
            </button>
          </div>
        )}
      </>
    );
  }
);

MarcarAsistenciaDePersonalButton.displayName =
  "MarcarAsistenciaDePersonalButton";

export default MarcarAsistenciaDePersonalButton;
