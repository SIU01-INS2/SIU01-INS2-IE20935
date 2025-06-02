"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/global/store";
import { HandlerDirectivoAsistenciaResponse } from "@/lib/utils/local/db/models/DatosAsistenciaHoy/handlers/HandlerDirectivoAsistenciaResponse";

import { alterarUTCaZonaPeruana } from "@/lib/helpers/alteradores/alterarUTCaZonaPeruana";
import { HORA_ACTUALIZACION_DATOS_ASISTENCIA_DIARIOS } from "@/constants/HORA_ACTUALIZACION_DATOS_ASISTENCIA_DIARIOS";
import { tiempoRestanteHasta } from "@/lib/calc/time/tiempoRestanteHasta";
import { DatosAsistenciaHoyIDB } from "@/lib/utils/local/db/models/DatosAsistenciaHoy/DatosAsistenciaHoyIDB";
import { DiasSemana, diasSemanaTextos } from "@/interfaces/shared/DiasSemana";
import { Meses, mesesTextos } from "@/interfaces/shared/Meses";
import PlayIcon from "@/components/icons/thinStyle/PlayIcon";
import ThinCalendarIcon from "../../../../../components/icons/thinStyle/ThinCalendarIcon";
import ThinRelojNonfillIcon from "@/components/icons/thinStyle/ThinRelojNonfillIcon";
import ThinLoader from "@/components/icons/thinStyle/ThinLoader";
import ThinInformationIcon from "@/components/icons/thinStyle/ThinInformationIcon";
import { T_Eventos } from "@prisma/client";
import FullScreenModalAsistenciaPersonal from "@/components/asistencia-personal/FullScreenModalAsistenciaPersonal";
import {
  EstadoTomaAsistenciaResponseBody,
  IniciarTomaAsistenciaRequestBody,
  TipoAsistencia,
} from "@/interfaces/shared/AsistenciaRequests";
import { ENTORNO } from "@/constants/ENTORNO";
import { Entorno } from "@/interfaces/shared/Entornos";
import { formatearISOaFormato12Horas } from "@/lib/helpers/formatters/fechas-hora/formatearAFormato12Horas";

const TomarAsistenciaPersonal = () => {
  const [
    showFullScreenModalAsistenciaPersonal,
    setShowFullScreenModalAsistenciaPersonal,
  ] = useState(ENTORNO === Entorno.LOCAL);

  const fechaHoraActual = useSelector(
    (state: RootState) => state.others.fechaHoraActualReal
  );

  const [
    handlerDatosAsistenciaHoyDirectivo,
    setHandlerDatosAsistenciaHoyDirectivo,
  ] = useState<null | HandlerDirectivoAsistenciaResponse>(null);

  const [sincronizando, setSincronizando] = useState(false);
  const [estadoTomaAsistenciaDePersonal, setEstadoTomaAsistenciaDePersonal] =
    useState<EstadoTomaAsistenciaResponseBody | null>(null);
  const [modoFinDeSemana, setModoFinDeSemana] = useState(false);

  const getDataAsistence = async () => {
    setSincronizando(true);
    setHandlerDatosAsistenciaHoyDirectivo(null);

    try {
      const datosAsistenciaHoyDirectivoIDB = new DatosAsistenciaHoyIDB();

      const handlerDirectivoAsistenciaResponse =
        (await datosAsistenciaHoyDirectivoIDB.getHandler()) as HandlerDirectivoAsistenciaResponse;

      setHandlerDatosAsistenciaHoyDirectivo(handlerDirectivoAsistenciaResponse);
    } catch (error) {
      console.error("Error al obtener datos de asistencia:", error);
    } finally {
      setSincronizando(false);
    }
  };

  // Verificamos si ya pasó la hora de actualización de datos (5:05 AM)
  const haySincronizacionDatos =
    Number(fechaHoraActual.utilidades?.hora) >=
    HORA_ACTUALIZACION_DATOS_ASISTENCIA_DIARIOS;

  // Carga inicial al montar el componente
  useEffect(() => {
    if (!fechaHoraActual.inicializado) return;

    getDataAsistence();
  }, [fechaHoraActual.inicializado]);

  // Efecto para verificar si necesitamos actualizar los datos cuando cambia el día
  useEffect(() => {
    if (!handlerDatosAsistenciaHoyDirectivo || !fechaHoraActual.utilidades)
      return;

    // Verificamos si los datos son de un día anterior y ya pasó la hora de sincronización
    const fechaDatosAsistencia = new Date(
      handlerDatosAsistenciaHoyDirectivo.getFechaLocalPeru()
    );
    const diaDatosAsistencia = fechaDatosAsistencia.getDate();
    const diaActual = fechaHoraActual.utilidades.diaMes;

    // Verificar si estamos en fin de semana
    const esFinDeSemana = fechaHoraActual.utilidades.esFinDeSemana;

    // Actualizar el estado de modo fin de semana
    setModoFinDeSemana(esFinDeSemana);

    // Solo actualizamos si:
    // - No es fin de semana, y
    // - La hora de sincronización ha pasado, y
    // - La fecha de los datos no coincide con la fecha actual
    // - No es un día de evento
    if (
      haySincronizacionDatos &&
      diaDatosAsistencia !== diaActual &&
      !esFinDeSemana &&
      !handlerDatosAsistenciaHoyDirectivo.esHoyDiaDeEvento()
    ) {
      console.log("Detectado cambio de día, actualizando datos...");
      getDataAsistence();
    }
  }, [
    haySincronizacionDatos,
    handlerDatosAsistenciaHoyDirectivo,
    fechaHoraActual.utilidades,
  ]);

  useEffect(() => {
    const obtenerEstadoAsistencia = async () => {
      const estadoTomaAsistenciaDePersonalActual =
        await new DatosAsistenciaHoyIDB().obtenerEstadoTomaAsistencia(
          TipoAsistencia.ParaPersonal
        );
      setEstadoTomaAsistenciaDePersonal(estadoTomaAsistenciaDePersonalActual);
    };
    obtenerEstadoAsistencia();
  }, []);

  // Procesamos las fechas y horas solo si tenemos los datos disponibles
  const fechaHoraInicioAsistencia = handlerDatosAsistenciaHoyDirectivo
    ? new Date(
        alterarUTCaZonaPeruana(
          String(
            handlerDatosAsistenciaHoyDirectivo.getHorarioTomaAsistenciaGeneral()
              .Inicio
          )
        )
      )
    : null;

  const fechaHoraCierreAsistencia = handlerDatosAsistenciaHoyDirectivo
    ? new Date(
        alterarUTCaZonaPeruana(
          String(
            handlerDatosAsistenciaHoyDirectivo.getHorarioTomaAsistenciaGeneral()
              .Fin
          )
        )
      )
    : null;

  const tiempoRestanteParaInicioAsistencia = useSelector((state: RootState) =>
    handlerDatosAsistenciaHoyDirectivo && fechaHoraInicioAsistencia
      ? tiempoRestanteHasta(
          { fechaHoraActualReal: state.others.fechaHoraActualReal },
          fechaHoraInicioAsistencia
        )
      : null
  );

  const tiempoRestanteParaCierreAsistencia = useSelector((state: RootState) =>
    handlerDatosAsistenciaHoyDirectivo && fechaHoraCierreAsistencia
      ? tiempoRestanteHasta(
          { fechaHoraActualReal: state.others.fechaHoraActualReal },
          fechaHoraCierreAsistencia
        )
      : null
  );

  // Función para formatear la fecha actual
  const formatearFechaActual = () => {
    if (!fechaHoraActual?.fechaHora) return "Cargando fecha...";

    const fecha = new Date(fechaHoraActual.fechaHora);

    return `${
      diasSemanaTextos[fecha.getDay() as DiasSemana]
    } ${fecha.getDate()} de ${
      mesesTextos[(fecha.getMonth() + 1) as Meses]
    } de ${fecha.getFullYear()}`;
  };

  // Función para formatear fecha de evento
  const formatearFechaEvento = (fecha: Date) => {
    const fechaObj = new Date(alterarUTCaZonaPeruana(String(fecha)));
    return `${fechaObj.getDate()} de ${
      mesesTextos[(fechaObj.getMonth() + 1) as Meses]
    } de ${fechaObj.getFullYear()}`;
  };

  const iniciarTomaAsistenciaDePersonalHoy = async () => {
    if (!estadoTomaAsistenciaDePersonal?.AsistenciaIniciada) {
      const response = await fetch(`/api/asistencia-hoy/iniciar`, {
        method: "POST",
        body: JSON.stringify({
          TipoAsistencia: TipoAsistencia.ParaPersonal,
        } as IniciarTomaAsistenciaRequestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const estadoActualTomaDeAsisteniaDePersonal =
        (await response.json()) as EstadoTomaAsistenciaResponseBody;

      const datosAsistenciaHoy = new DatosAsistenciaHoyIDB();

      datosAsistenciaHoy.guardarEstadoTomaAsistencia(
        estadoActualTomaDeAsisteniaDePersonal
      );
    }
  };

  // Función para iniciar el registro de asistencia
  const iniciarOContinuarRegistroAsistencia = async () => {
    if (!estadoTomaAsistenciaDePersonal?.AsistenciaIniciada) {
      iniciarTomaAsistenciaDePersonalHoy();
    }

    setShowFullScreenModalAsistenciaPersonal(true);
  };

  const determinarEstadoSistema = () => {
    // Verificamos primero si es un día de evento (feriado, celebración, etc.)
    // SOLO si estamos dentro del rango del evento
    if (
      handlerDatosAsistenciaHoyDirectivo &&
      handlerDatosAsistenciaHoyDirectivo.esHoyDiaDeEvento()
    ) {
      const eventoInfo =
        handlerDatosAsistenciaHoyDirectivo.esHoyDiaDeEvento() as T_Eventos;

      // Convertir las fechas del evento a objetos Date para compararlas
      const fechaInicioEvento = new Date(
        alterarUTCaZonaPeruana(String(eventoInfo.Fecha_Inicio))
      );
      const fechaConclusionEvento = new Date(
        alterarUTCaZonaPeruana(String(eventoInfo.Fecha_Conclusion))
      );
      const fechaActualObj = new Date(fechaHoraActual.fechaHora!);

      // Comparar solo las fechas (sin horas)
      const fechaActualSinHora = new Date(
        fechaActualObj.getFullYear(),
        fechaActualObj.getMonth(),
        fechaActualObj.getDate()
      );
      const fechaInicioSinHora = new Date(
        fechaInicioEvento.getFullYear(),
        fechaInicioEvento.getMonth(),
        fechaInicioEvento.getDate()
      );
      const fechaConclusionSinHora = new Date(
        fechaConclusionEvento.getFullYear(),
        fechaConclusionEvento.getMonth(),
        fechaConclusionEvento.getDate()
      );

      // Verificar si la fecha actual está dentro del rango del evento
      const dentroDelRangoEvento =
        fechaActualSinHora >= fechaInicioSinHora &&
        fechaActualSinHora <= fechaConclusionSinHora;

      if (dentroDelRangoEvento) {
        return {
          estado: "evento",
          mensaje: "Día no laborable",
          descripcion: `Hoy es "${eventoInfo.Nombre}", no se requiere tomar asistencia.`,
          tiempoRestante: null,
          botonActivo: false,
          colorEstado: "bg-purple-50",
          mostrarContadorPersonal: false,
          nombreEvento: eventoInfo.Nombre,
          fechaInicio: eventoInfo.Fecha_Inicio,
          fechaConclusion: eventoInfo.Fecha_Conclusion,
        };
      }
    }

    // Si estamos sincronizando
    if (sincronizando) {
      return {
        estado: "sincronizando",
        mensaje: "Sincronizando sistema...",
        descripcion:
          "Actualizando la información del sistema para la jornada actual",
        tiempoRestante: null,
        botonActivo: false,
        colorEstado: "bg-blue-100",
        mostrarContadorPersonal: false,
      };
    }

    // Si no tenemos datos aún
    if (
      !handlerDatosAsistenciaHoyDirectivo ||
      !tiempoRestanteParaInicioAsistencia ||
      !tiempoRestanteParaCierreAsistencia ||
      !fechaHoraActual.utilidades
    ) {
      return {
        estado: "cargando",
        mensaje: "Cargando información...",
        descripcion: "Obteniendo la información necesaria...",
        tiempoRestante: null,
        botonActivo: false,
        colorEstado: "bg-gray-100",
        mostrarContadorPersonal: false,
      };
    }

    // Si no es día escolar (es fin de semana)
    if (fechaHoraActual.utilidades.esFinDeSemana || modoFinDeSemana) {
      return {
        estado: "no_disponible",
        mensaje: "No hay clases hoy",
        descripcion:
          "Hoy es fin de semana, no se puede tomar asistencia. El sistema se actualizará automáticamente el próximo día laboral.",
        tiempoRestante: null,
        botonActivo: false,
        colorEstado: "bg-gray-100",
        mostrarContadorPersonal: false,
      };
    }

    // Verificamos si la fecha de datos de asistencia es de un día anterior
    const fechaActual = new Date(fechaHoraActual.fechaHora!);
    const fechaDatosAsistencia = new Date(
      handlerDatosAsistenciaHoyDirectivo.getFechaLocalPeru()
    );
    const esNuevoDia = fechaDatosAsistencia.getDate() !== fechaActual.getDate();

    // Caso: Estamos en un nuevo día pero aún no es hora de sincronizar datos
    if (esNuevoDia && !haySincronizacionDatos) {
      return {
        estado: "preparando",
        mensaje: "Datos pendientes de actualización",
        descripcion: `Se actualizará la información para ${fechaHoraActual.utilidades.diaSemana} ${fechaHoraActual.utilidades.diaMes} a partir de las ${HORA_ACTUALIZACION_DATOS_ASISTENCIA_DIARIOS}:00.`,
        tiempoRestante: null,
        botonActivo: false,
        colorEstado: "bg-blue-50",
        mostrarContadorPersonal: false,
      };
    }

    // VERIFICAR HORARIOS ANTES QUE EL ESTADO DE PROCESO

    // Si aún no es hora de inicio
    if (
      tiempoRestanteParaInicioAsistencia &&
      !tiempoRestanteParaInicioAsistencia.yaVencido
    ) {
      return {
        estado: "pendiente",
        mensaje: "En espera para iniciar",
        descripcion: `El registro de asistencia estará disponible en ${tiempoRestanteParaInicioAsistencia.formateado}.`,
        tiempoRestante: tiempoRestanteParaInicioAsistencia.formateado,
        botonActivo: false,
        colorEstado: "bg-orange-50",
        progreso: Math.floor(
          (tiempoRestanteParaInicioAsistencia.total / 3600000) * 100
        ),
        mostrarContadorPersonal: true,
        etiquetaPersonal: "Personal por registrar",
        iconoPersonal: "usuarios",
      };
    }

    // Si ya pasó la hora de cierre de asistencia
    const horaActual = fechaHoraActual.utilidades.hora;
    const minutosActual = fechaHoraActual.utilidades.minutos;
    const horaCierre = fechaHoraCierreAsistencia!.getHours();
    const minutosCierre = fechaHoraCierreAsistencia!.getMinutes();

    const asistenciaCerrada =
      horaActual > horaCierre ||
      (horaActual === horaCierre && minutosActual >= minutosCierre);

    if (asistenciaCerrada) {
      return {
        estado: "cerrado",
        mensaje: "Registro de asistencia cerrado",
        descripcion: `El período de registro finalizó a las ${formatearISOaFormato12Horas(
          String(
            handlerDatosAsistenciaHoyDirectivo.getHorarioTomaAsistenciaGeneral()
              .Fin!
          )
        )}`,
        tiempoRestante: null,
        botonActivo: false,
        colorEstado: "bg-red-50",
        mostrarContadorPersonal: true,
        etiquetaPersonal: "Asistencias registradas",
        iconoPersonal: "verificacion",
      };
    }

    // AHORA SÍ VERIFICAMOS EL ESTADO DE PROCESO
    // Solo si estamos dentro del horario válido y no hay restricciones
    if (estadoTomaAsistenciaDePersonal?.AsistenciaIniciada) {
      return {
        estado: "en_proceso",
        mensaje: "Registro en proceso",
        descripcion: "El registro de asistencia está siendo procesado.",
        tiempoRestante: null,
        botonActivo: !showFullScreenModalAsistenciaPersonal,
        colorEstado: "bg-green-100",
        mostrarContadorPersonal: true,
        etiquetaPersonal: "Personal pendiente",
        iconoPersonal: "reloj",
      };
    }

    // Si estamos en horario válido para tomar asistencia (estado por defecto)
    return {
      estado: "disponible",
      mensaje: "Sistema listo para registro",
      descripcion: `El registro estará disponible hasta las ${formatearISOaFormato12Horas(
        String(
          handlerDatosAsistenciaHoyDirectivo.getHorarioTomaAsistenciaGeneral()
            .Fin!
        )
      )}`,
      tiempoRestante: tiempoRestanteParaCierreAsistencia.formateado,
      botonActivo: true,
      colorEstado: "bg-green-50",
      mostrarContadorPersonal: true,
      etiquetaPersonal: "Personal pendiente",
      iconoPersonal: "reloj",
      tiempoDisponible: tiempoRestanteParaCierreAsistencia.formateado,
    };
  };
  // Obtener el estado actual
  const estadoSistema = determinarEstadoSistema();

  // Función para renderizar el icono de personal adecuado según el estado
  const renderIconoPersonal = () => {
    if (
      !estadoSistema.iconoPersonal ||
      estadoSistema.iconoPersonal === "usuarios"
    ) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-purple-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      );
    } else if (estadoSistema.iconoPersonal === "verificacion") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-purple-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    } else if (estadoSistema.iconoPersonal === "reloj") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-purple-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }
  };

  return (
    <>
      {showFullScreenModalAsistenciaPersonal &&
        handlerDatosAsistenciaHoyDirectivo && (
          <FullScreenModalAsistenciaPersonal
            handlerDatosAsistenciaHoyDirectivo={
              handlerDatosAsistenciaHoyDirectivo
            }
            tiempoRestante={tiempoRestanteParaCierreAsistencia}
            fechaHoraActual={fechaHoraActual}
            closeFullScreenModal={() => {
              setShowFullScreenModalAsistenciaPersonal(false);
            }}
          />
        )}
      <div
        className={`w-full max-w-3xl mx-auto scale-80 transform origin-top ${
          showFullScreenModalAsistenciaPersonal &&
          "transition-all hidden overflow-hidden"
        }`}
      >
        <div className="text-center mb-3">
          <h1 className="text-xl sm-only:text-2xl md-only:text-2xl lg-only:text-2xl font-semibold text-gray-800">
            Registro de Asistencia Diaria
          </h1>
          <p className="text-sm text-gray-600">
            Gestione la asistencia del personal de forma eficiente
          </p>
        </div>

        {/* Cards de información */}
        <div
          className={`grid grid-cols-1 sm-only:grid-cols-2 md-only:grid-cols-3 lg-only:grid-cols-3 gap-3`}
        >
          {/* Fecha actual */}
          <div className="bg-blue-50 rounded-lg p-3 flex items-center">
            <div className="bg-white p-2 rounded-full mr-2">
              <ThinCalendarIcon className="w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-blue-700 font-medium">Fecha Actual</p>
              <p className="text-sm font-bold text-gray-800">
                {formatearFechaActual()}
              </p>
            </div>
          </div>

          {/* Estado */}
          <div
            className={`${
              estadoSistema.estado === "evento"
                ? "bg-purple-50"
                : estadoSistema.colorEstado
            } rounded-lg p-3 flex items-center`}
          >
            <div className="bg-white p-2 rounded-full mr-2">
              <ThinRelojNonfillIcon className="w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-blue-700 font-medium">Estado</p>
              <div className="text-sm font-bold text-gray-800">
                {estadoSistema.estado === "sincronizando" ||
                estadoSistema.estado === "cargando" ? (
                  <span className="flex items-center">
                    {estadoSistema.estado === "sincronizando"
                      ? "Sincronizando..."
                      : "Cargando..."}
                    <ThinLoader className="ml-2 w-3 text-blue-500" />
                  </span>
                ) : estadoSistema.estado === "disponible" ? (
                  "Disponible ahora"
                ) : estadoSistema.estado === "pendiente" ? (
                  "Esperando apertura"
                ) : estadoSistema.estado === "cerrado" ? (
                  "Período cerrado"
                ) : estadoSistema.estado === "preparando" ? (
                  "Actualización pendiente"
                ) : estadoSistema.estado === "en_proceso" ? (
                  "Registro en curso"
                ) : estadoSistema.estado === "evento" ? (
                  "Día festivo"
                ) : (
                  "No disponible hoy"
                )}
              </div>
            </div>
          </div>

          {/* Personal contador condicional */}
          {estadoSistema.mostrarContadorPersonal && (
            <div className="bg-purple-50 rounded-lg p-3 flex items-center">
              <div className="bg-white p-2 rounded-full mr-2">
                {renderIconoPersonal()}
              </div>
              <div>
                <p className="text-xs text-purple-700 font-medium">
                  {estadoSistema.etiquetaPersonal}
                </p>
                <p className="text-sm font-bold text-gray-800">
                  {handlerDatosAsistenciaHoyDirectivo
                    ? `${
                        handlerDatosAsistenciaHoyDirectivo.getTotalPersonalAdministrativo() +
                        handlerDatosAsistenciaHoyDirectivo.getTotalProfesoresPrimaria() +
                        handlerDatosAsistenciaHoyDirectivo.getTotalProfesoresSecundaria()
                      } miembros`
                    : "Cargando..."}
                </p>
              </div>
            </div>
          )}

          {/* Card de información de evento (cuando aplica) */}
          {estadoSistema.estado === "evento" && (
            <div className="bg-purple-50 rounded-lg p-3 flex items-center">
              <div className="bg-white p-2 rounded-full mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-purple-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-purple-700 font-medium">Evento</p>
                <p className="text-sm font-bold text-gray-800">
                  {estadoSistema.nombreEvento}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Panel principal */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-3">
          {/* Encabezado de estado */}
          <div
            className={`p-3 ${
              estadoSistema.estado === "disponible"
                ? "bg-green-500 text-white"
                : estadoSistema.estado === "pendiente"
                ? "bg-orange-500 text-white"
                : estadoSistema.estado === "cerrado"
                ? "bg-red-500 text-white"
                : estadoSistema.estado === "preparando" ||
                  estadoSistema.estado === "sincronizando"
                ? "bg-blue-500 text-white"
                : estadoSistema.estado === "en_proceso"
                ? "bg-emerald-500 text-white"
                : estadoSistema.estado === "evento"
                ? "bg-purple-500 text-white"
                : "bg-gray-500 text-white"
            }`}
          >
            <h2 className="text-base font-bold">
              {estadoSistema.estado === "disponible"
                ? "Iniciar registro de asistencia"
                : estadoSistema.estado === "pendiente"
                ? "Período de registro programado"
                : estadoSistema.estado === "cerrado"
                ? "Registro de asistencia completado"
                : estadoSistema.estado === "preparando"
                ? "Datos pendientes de actualización"
                : estadoSistema.estado === "sincronizando"
                ? "Sincronizando información"
                : estadoSistema.estado === "en_proceso"
                ? "Registro de asistencia en proceso"
                : estadoSistema.estado === "no_disponible"
                ? "Día no laborable"
                : estadoSistema.estado === "evento"
                ? `Día de ${estadoSistema.nombreEvento}`
                : "Cargando sistema"}
            </h2>
            <p className="opacity-90 text-sm">{estadoSistema.descripcion}</p>
          </div>

          {/* Contenido principal */}
          <div className="p-4">
            <div className="text-center mb-4">
              <h3 className="text-gray-500 text-sm font-medium mb-3">
                Información importante
              </h3>

              {/* Mensaje según estado */}
              <div
                className={`inline-flex items-start p-3 rounded-lg text-sm ${
                  estadoSistema.estado === "disponible"
                    ? "bg-blue-50 text-blue-800 border-l-4 border-blue-500"
                    : estadoSistema.estado === "pendiente"
                    ? "bg-orange-50 text-orange-800 border-l-4 border-orange-500"
                    : estadoSistema.estado === "cerrado"
                    ? "bg-red-50 text-red-800 border-l-4 border-red-500"
                    : estadoSistema.estado === "preparando" ||
                      estadoSistema.estado === "sincronizando"
                    ? "bg-indigo-50 text-indigo-800 border-l-4 border-indigo-500"
                    : estadoSistema.estado === "en_proceso"
                    ? "bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500"
                    : estadoSistema.estado === "evento"
                    ? "bg-purple-50 text-purple-800 border-l-4 border-purple-500"
                    : "bg-gray-50 text-gray-800 border-l-4 border-gray-500"
                }`}
              >
                <ThinInformationIcon
                  className={`w-5 mr-2 flex-shrink-0 ${
                    estadoSistema.estado === "disponible"
                      ? "text-blue-500"
                      : estadoSistema.estado === "pendiente"
                      ? "text-orange-500"
                      : estadoSistema.estado === "cerrado"
                      ? "text-red-500"
                      : estadoSistema.estado === "preparando" ||
                        estadoSistema.estado === "sincronizando"
                      ? "text-indigo-500"
                      : estadoSistema.estado === "en_proceso"
                      ? "text-emerald-500"
                      : estadoSistema.estado === "evento"
                      ? "text-purple-500"
                      : "text-gray-500"
                  }`}
                />
                <div className="text-left text-xs">
                  {estadoSistema.estado === "disponible" && (
                    <span>
                      El período de registro permanecerá abierto hasta las{" "}
                      <strong>
                        {formatearISOaFormato12Horas(
                          String(
                            handlerDatosAsistenciaHoyDirectivo!.getHorarioTomaAsistenciaGeneral()
                              .Fin!
                          )
                        )}
                      </strong>
                      . Una vez iniciado el proceso, debe completar la
                      asistencia de todo el personal.
                    </span>
                  )}
                  {estadoSistema.estado === "pendiente" && (
                    <span>
                      El sistema abrirá el registro de asistencia en{" "}
                      <strong>{estadoSistema.tiempoRestante}</strong>. Toda la
                      información está preparada para el momento de apertura.
                    </span>
                  )}
                  {estadoSistema.estado === "cerrado" && (
                    <span>
                      El registro de asistencia ha concluido. Para consultar los
                      registros completos, visite la sección de reportes.
                    </span>
                  )}
                  {estadoSistema.estado === "preparando" && (
                    <span>
                      El sistema actualiza automáticamente los datos a las{" "}
                      <strong>
                        {HORA_ACTUALIZACION_DATOS_ASISTENCIA_DIARIOS}:00 AM
                      </strong>
                      . Esta actualización prepara toda la información
                      necesaria.
                    </span>
                  )}
                  {estadoSistema.estado === "sincronizando" && (
                    <span>
                      El sistema está actualizando la información para hoy. Este
                      proceso normalmente toma unos segundos.
                    </span>
                  )}
                  {estadoSistema.estado === "en_proceso" && (
                    <span>
                      Se está procesando la asistencia. Complete el proceso para
                      todos los miembros del personal. Tiempo restante:{" "}
                      <strong>{estadoSistema.tiempoDisponible}</strong>.
                    </span>
                  )}
                  {estadoSistema.estado === "cargando" && (
                    <span>
                      Inicializando componentes del sistema de registro. La
                      aplicación estará lista en unos momentos.
                    </span>
                  )}
                  {estadoSistema.estado === "no_disponible" && (
                    <span>
                      Hoy es fin de semana. Las funciones de registro de
                      asistencia están desactivadas hasta el próximo día
                      laboral. No es necesario actualizar manualmente.
                    </span>
                  )}
                  {estadoSistema.estado === "evento" && (
                    <span>
                      Hoy se celebra &quot;
                      <strong>{estadoSistema.nombreEvento}</strong>&quot;, un
                      día no laborable en la institución. El sistema está
                      programado para no requerir asistencia durante esta fecha.
                      {estadoSistema.fechaInicio &&
                        estadoSistema.fechaConclusion &&
                        estadoSistema.fechaInicio !==
                          estadoSistema.fechaConclusion && (
                          <>
                            <br />
                            <br />
                            Este evento tiene duración del{" "}
                            <strong>
                              {formatearFechaEvento(estadoSistema.fechaInicio)}
                            </strong>{" "}
                            al{" "}
                            <strong>
                              {formatearFechaEvento(
                                estadoSistema.fechaConclusion
                              )}
                            </strong>
                            . Durante este período, el registro de asistencia
                            estará deshabilitado automáticamente.
                          </>
                        )}
                      <br />
                      <br />
                      El sistema reanudará sus funciones normales el próximo día
                      hábil.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Barra de progreso para estado pendiente */}
            {estadoSistema.estado === "pendiente" &&
              estadoSistema.progreso !== undefined && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-400 h-2 rounded-full"
                      style={{ width: `${100 - estadoSistema.progreso}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Tiempo transcurrido</span>
                    <span>Apertura en: {estadoSistema.tiempoRestante}</span>
                  </div>
                </div>
              )}

            {/* Barra de progreso para estado en proceso */}
            {estadoSistema.estado === "en_proceso" &&
              estadoSistema.tiempoDisponible && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-400 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (tiempoRestanteParaCierreAsistencia!.total /
                            (fechaHoraCierreAsistencia!.getTime() -
                              fechaHoraInicioAsistencia!.getTime())) *
                            100 || 50
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Tiempo transcurrido</span>
                    <span>Restante: {estadoSistema.tiempoDisponible}</span>
                  </div>
                </div>
              )}

            {/* Información adicional para eventos */}
            {estadoSistema.estado === "evento" && (
              <div className="mb-4 bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-purple-700 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <h4 className="text-sm font-medium text-purple-800">
                    Detalles del evento
                  </h4>
                </div>
                <ul className="text-xs text-purple-900 pl-7 space-y-1 list-disc">
                  <li>
                    <span className="font-medium">Nombre:</span>{" "}
                    {estadoSistema.nombreEvento}
                  </li>
                  {estadoSistema.fechaInicio && (
                    <li>
                      <span className="font-medium">Fecha de inicio:</span>{" "}
                      {formatearFechaEvento(estadoSistema.fechaInicio)}
                    </li>
                  )}
                  {estadoSistema.fechaConclusion && (
                    <li>
                      <span className="font-medium">Fecha de conclusión:</span>{" "}
                      {formatearFechaEvento(estadoSistema.fechaConclusion)}
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Botón de acción */}
            <div className="text-center">
              {estadoTomaAsistenciaDePersonal && (
                <button
                  onClick={iniciarOContinuarRegistroAsistencia}
                  className={`flex items-center justify-center mx-auto px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    estadoSistema.botonActivo
                      ? "bg-green-500 text-white hover:bg-green-600 active:bg-green-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  disabled={!estadoSistema.botonActivo}
                >
                  <PlayIcon className="w-5 mr-2" />
                  {estadoSistema.estado === "en_proceso" ? (
                    <>Continuar toma de asistencia</>
                  ) : (
                    <>
                      {estadoTomaAsistenciaDePersonal?.AsistenciaIniciada
                        ? "Continuar toma de asistencia"
                        : "Iniciar Registro de Asistencia"}
                    </>
                  )}
                </button>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {estadoSistema.estado === "disponible"
                  ? "Al hacer clic, comenzará el proceso de registro para todo el personal"
                  : estadoSistema.estado === "pendiente"
                  ? "El botón se habilitará cuando sea la hora programada para el registro"
                  : estadoSistema.estado === "cerrado"
                  ? "El período de registro ha concluido para el día de hoy"
                  : estadoSistema.estado === "preparando"
                  ? "Espere a que se completen las actualizaciones programadas"
                  : estadoSistema.estado === "sincronizando"
                  ? "El sistema está sincronizando la información, espere un momento"
                  : estadoSistema.estado === "en_proceso"
                  ? "El proceso está en curso, no cierre esta ventana"
                  : estadoSistema.estado === "evento"
                  ? `No se requiere registro de asistencia durante "${estadoSistema.nombreEvento}"`
                  : estadoSistema.estado === "no_disponible"
                  ? "El registro no está disponible durante los fines de semana"
                  : "El sistema no está disponible en este momento"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TomarAsistenciaPersonal;
