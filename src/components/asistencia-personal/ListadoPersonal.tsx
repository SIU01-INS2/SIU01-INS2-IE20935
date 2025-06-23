import ItemTomaAsistencia, {
  PersonalParaTomarAsistencia,
} from "./ItemTomaAsistencia";
import { Speaker } from "../../lib/utils/voice/Speaker";
import {
  ModoRegistro,
  modoRegistroTextos,
} from "@/interfaces/shared/ModoRegistroPersonal";
import { HandlerDirectivoAsistenciaResponse } from "@/lib/utils/local/db/models/DatosAsistenciaHoy/handlers/HandlerDirectivoAsistenciaResponse";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

import { AsistenciaDePersonalIDB } from "../../lib/utils/local/db/models/AsistenciaDePersonal/AsistenciaDePersonalIDB";
import { FechaHoraActualRealState } from "@/global/state/others/fechaHoraActualReal";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { Loader2 } from "lucide-react";
import { AsistenciaDiariaResultado } from "@/interfaces/shared/AsistenciaRequests";
import { ErrorResponseAPIBase } from "@/interfaces/shared/apis/types";
import { useSelector } from "react-redux";
import { RootState } from "@/global/store";

// Obtener texto según el rol
export const obtenerTextoRol = (rol: RolesSistema): string => {
  switch (rol) {
    case RolesSistema.Directivo:
      return "Directivos";
    case RolesSistema.ProfesorPrimaria:
      return "Profesores de Primaria";
    case RolesSistema.Auxiliar:
      return "Auxiliares";
    case RolesSistema.ProfesorSecundaria:
    case RolesSistema.Tutor:
      return "Profesores/Tutores de Secundaria";
    case RolesSistema.PersonalAdministrativo:
      return "Personal Administrativo";
    default:
      return "";
  }
};

export const ListaPersonal = ({
  rol,
  modoRegistro,
  handlerDatosAsistenciaHoyDirectivo,
  fechaHoraActual,
}: {
  rol: RolesSistema;
  modoRegistro: ModoRegistro;
  handlerDatosAsistenciaHoyDirectivo: HandlerDirectivoAsistenciaResponse;
  fechaHoraActual: FechaHoraActualRealState;
}) => {
  const { toast } = useToast();
  const [procesando, setProcesando] = useState<string | null>(null);
  const [cargandoAsistencias, setCargandoAsistencias] = useState(true);
  const [eliminandoAsistencia, setEliminandoAsistencia] = useState<
    string | null
  >(null);

  // ✅ NUEVO: Obtener timestamp actual de Redux
  const fechaHoraRedux = useSelector(
    (state: RootState) => state.others.fechaHoraActualReal
  );
  const timestampActual = fechaHoraRedux.utilidades?.timestamp;

  // ✅ NUEVO: Estado para almacenar las asistencias registradas por DNI
  const [asistenciasRegistradas, setAsistenciasRegistradas] = useState<
    Map<string, AsistenciaDiariaResultado>
  >(new Map());

  // Estados para el sistema de manejo de errores
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorResponseAPIBase | null>(null);

  // ✅ MODIFICADO: Crear instancia SIN el callback
  const asistenciaDePersonalIDB = new AsistenciaDePersonalIDB(
    "API01",
    setIsLoading,
    setError
  );

  // Obtenemos los datos del personal
  const personal = rol
    ? handlerDatosAsistenciaHoyDirectivo.obtenerPersonalPorRol(rol)
    : [];

  // Manejar eliminación de asistencia CON FEEDBACK DE VOZ
  const handleEliminarAsistencia = async (
    personal: PersonalParaTomarAsistencia
  ) => {
    if (eliminandoAsistencia !== null) return;

    try {
      setEliminandoAsistencia(personal.ID_o_DNI);

      console.log(
        `🗑️ Iniciando eliminación de asistencia para: ${personal.ID_o_DNI}`
      );

      // Eliminar usando el modelo de IndexedDB
      const resultado = await asistenciaDePersonalIDB.eliminarAsistencia({
        id_o_dni: personal.ID_o_DNI,
        rol: rol,
        modoRegistro: modoRegistro,
      });

      if (resultado.exitoso) {
        // ✅ Actualizar el mapa de asistencias registradas (eliminar la entrada)
        setAsistenciasRegistradas((prev) => {
          const nuevo = new Map(prev);
          nuevo.delete(personal.ID_o_DNI);
          return nuevo;
        });

        // 🎯 NUEVO: Feedback por voz para eliminación exitosa
        const speaker = Speaker.getInstance();
        speaker.start(
          `${
            modoRegistroTextos[modoRegistro]
          } eliminada para ${personal.Nombres.split(
            " "
          ).shift()} ${personal.Apellidos.split(" ").shift()}`
        );

        console.log("✅ Eliminación exitosa, estado actualizado");

        toast({
          title: "Asistencia eliminada",
          description: resultado.mensaje,
          variant: "default",
        });
      } else {
        // 🎯 NUEVO: Feedback por voz para error en eliminación
        const speaker = Speaker.getInstance();
        speaker.start(
          `Error al eliminar ${modoRegistroTextos[
            modoRegistro
          ].toLowerCase()} de ${personal.Nombres.split(" ").shift()}`
        );

        toast({
          title: "Error",
          description: resultado.mensaje,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al eliminar asistencia:", error);

      // 🎯 NUEVO: Feedback por voz para error general
      const speaker = Speaker.getInstance();
      speaker.start(
        `Error del sistema al eliminar ${modoRegistroTextos[
          modoRegistro
        ].toLowerCase()}`
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error desconocido al eliminar asistencia";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setEliminandoAsistencia(null);
    }
  };

  // ✅ MODIFICADO: Cargar las asistencias ya registradas
  const ultimaConsultaRef = useRef<string>("");

  useEffect(() => {
    const claveConsulta = `${rol}-${modoRegistro}`;

    // ✅ Evitar consulta si es la misma que la anterior
    if (ultimaConsultaRef.current === claveConsulta) {
      console.log("🚫 Consulta duplicada evitada:", claveConsulta);
      return;
    }

    ultimaConsultaRef.current = claveConsulta;
    const cargarAsistenciasRegistradas = async () => {
      try {
        setCargandoAsistencias(true);

        console.log(`🔍 Cargando asistencias para ${rol} - ${modoRegistro}`);

        // ✅ USAR ORQUESTADOR en lugar de fetch directo
        const resultado =
          await asistenciaDePersonalIDB.consultarYSincronizarAsistenciasRedis(
            rol,
            modoRegistro
          );

        if (resultado.exitoso && resultado.datos) {
          // Crear mapa de asistencias por DNI
          const mapaAsistencias = new Map<string, AsistenciaDiariaResultado>();

          const resultados = Array.isArray(resultado.datos.Resultados)
            ? resultado.datos.Resultados
            : [resultado.datos.Resultados];

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          resultados.forEach((resultado: any) => {
            if (resultado && resultado.ID_o_DNI) {
              mapaAsistencias.set(resultado.ID_o_DNI, resultado);
            }
          });

          console.log("🗺️ Mapa final de asistencias:", mapaAsistencias);
          setAsistenciasRegistradas(mapaAsistencias);
        } else {
          console.error("❌ Error al cargar asistencias:", resultado.mensaje);
          toast({
            title: "Error",
            description: "No se pudieron cargar las asistencias registradas",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("❌ Error al consultar asistencias registradas:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las asistencias registradas",
          variant: "destructive",
        });
      } finally {
        setCargandoAsistencias(false);
      }
    };

    if (rol && modoRegistro) {
      cargarAsistenciasRegistradas();
    }
  }, [rol, modoRegistro]);

  // ✅ MODIFICADO: Manejador simplificado
  const handlePersonaSeleccionada = async (
    personal: PersonalParaTomarAsistencia
  ) => {
    if (procesando !== null) return;

    setProcesando(personal.ID_o_DNI);

    try {
      // Obtener la hora esperada
      const horaEsperadaISO =
        handlerDatosAsistenciaHoyDirectivo.obtenerHorarioPersonalISO(
          rol!,
          personal.ID_o_DNI,
          modoRegistro
        );


      // ✅ USAR ORQUESTADOR en lugar de fetch directo
      await asistenciaDePersonalIDB.marcarAsistencia(
        {
          datos: {
            ModoRegistro: modoRegistro,
            DNI: personal.ID_o_DNI,
            Rol: rol!,
            Dia: fechaHoraActual.utilidades!.diaMes,
          },
        },
        horaEsperadaISO // ✅ PASAR hora esperada
      );

      // Feedback por voz
      const speaker = Speaker.getInstance();
      speaker.start(
        `${
          modoRegistroTextos[modoRegistro]
        } registrada para ${personal.Nombres.split(
          " "
        ).shift()} ${personal.Apellidos.split(" ").shift()}`
      );

      // ✅ ACTUALIZAR estado local (simulando respuesta exitosa)
      const timestampActual =
        fechaHoraRedux.utilidades?.timestamp || Date.now();
      const nuevoRegistro: AsistenciaDiariaResultado = {
        ID_o_DNI: personal.ID_o_DNI,
        AsistenciaMarcada: true,
        Detalles: {
          Timestamp: timestampActual,
          DesfaseSegundos: 0, // El servidor calculará el valor real
        },
      };

      setAsistenciasRegistradas((prev) => {
        const nuevo = new Map(prev);
        nuevo.set(personal.ID_o_DNI, nuevoRegistro);
        return nuevo;
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // El orquestador ya manejó el error, solo dar feedback por voz
      const speaker = Speaker.getInstance();
      speaker.start(
        `Error al registrar ${modoRegistroTextos[modoRegistro].toLowerCase()}`
      );
    } finally {
      setProcesando(null);
    }
  };
  const textoRol = obtenerTextoRol(rol);

  // Mostrar error si existe
  if (error) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-xl text-red-600 mb-2">Error del Sistema</p>
          <p className="text-sm text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => setError(null)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Mensaje para cuando no hay personal
  if (personal.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <p className="text-xl text-gray-600">
          No hay personal disponible para este rol
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col pb-3 px-4 sm-only:pb-4 sm-only:px-3 md-only:pb-4 md-only:px-3 lg-only:pb-4 lg-only:px-4 xl-only:pb-4 xl-only:px-4 bg-gradient-to-b from-white to-gray-50 overflow-auto">
      {/* Encabezados fijos en la parte superior - CON MENSAJE INFORMATIVO */}
      <div className="sticky top-0 bg-[#ffffffcc] [backdrop-filter:blur(10px)] py-2 sm-only:py-3 md-only:py-3 lg-only:py-3 xl-only:py-4 z-10 mb-2">
        <h2 className="text-base sm-only:text-lg md-only:text-lg lg-only:text-lg xl-only:text-xl font-bold text-blue-800 text-center leading-tight">
          {modoRegistroTextos[modoRegistro]} | {textoRol}
        </h2>

        <h3 className="text-lg sm-only:text-xl md-only:text-xl lg-only:text-2xl xl-only:text-2xl font-bold text-green-600 text-center leading-tight">
          Ahora haz clic en tu nombre
        </h3>

        {/* 🆕 MENSAJE INFORMATIVO SOBRE TIEMPO LÍMITE */}
        <div className="text-center mt-1 mb-2">
          <p className="text-xs sm-only:text-sm text-orange-600 font-medium">
            💡 Tienes 5 minutos para cancelar una asistencia después de
            registrarla
          </p>
        </div>

        {(cargandoAsistencias || isLoading) && (
          <p className="text-center text-blue-500 mt-1">
            <Loader2 className="inline-block w-4 h-4 mr-1 animate-spin" />
            {cargandoAsistencias
              ? "Cargando asistencias registradas..."
              : "Procesando asistencia..."}
          </p>
        )}
      </div>

      {/* Contenedor centrado para las tarjetas */}
      <div className="flex-1 flex justify-center">
        <div className="max-w-4xl w-full">
          {/* Lista de personas con flex-wrap */}
          <div className="flex flex-wrap justify-center gap-2 sm-only:gap-3 md-only:gap-3 lg-only:gap-3 xl-only:gap-3">
            {personal.map((persona, index) => {
              // ✅ NUEVO: Obtener la asistencia registrada para esta persona
              const asistenciaPersona = asistenciasRegistradas.get(
                persona.ID_o_DNI
              );

              // 🐛 DEBUG: Log para verificar datos
              // console.log(`🔍 Debug persona ${persona.ID_o_DNI}:`, {
              //   asistenciaPersona,
              //   tieneDatos: !!asistenciaPersona,
              //   asistenciaMarcada: asistenciaPersona?.AsistenciaMarcada,
              //   detalles: asistenciaPersona?.Detalles,
              //   timestampActual,
              //   mapaCompleto: asistenciasRegistradas,
              // });

              return (
                <ItemTomaAsistencia
                  key={index}
                  personal={persona}
                  handlePersonalSeleccionado={handlePersonaSeleccionada}
                  handleEliminarAsistencia={handleEliminarAsistencia} // ← NUEVO: Pasar función de eliminación
                  asistenciaRegistrada={asistenciaPersona} // ← NUEVO: Pasar los datos de asistencia
                  timestampActual={timestampActual} // ← NUEVO: Pasar timestamp de Redux
                  loading={procesando === persona.ID_o_DNI}
                  eliminando={eliminandoAsistencia === persona.ID_o_DNI} // ← NUEVO: Estado de eliminación
                  globalLoading={cargandoAsistencias || isLoading}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
