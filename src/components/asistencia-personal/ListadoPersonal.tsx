import ItemTomaAsistencia, {
  PersonalParaTomarAsistencia,
} from "./ItemTomaAsistencia";
import { Speaker } from "../../lib/utils/voice/Speaker";
import {
  ModoRegistro,
  modoRegistroTextos,
} from "@/interfaces/shared/ModoRegistroPersonal";
import { HandlerDirectivoAsistenciaResponse } from "@/lib/utils/local/db/models/DatosAsistenciaHoy/handlers/HandlerDirectivoAsistenciaResponse";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  RegistrarAsistenciaIndividualRequestBody,
  RegistrarAsistenciaIndividualSuccessResponse,
} from "@/interfaces/shared/apis/api01/asistencia/types";
import { AsistenciaDePersonalIDB } from "../../lib/utils/local/db/models/AsistenciaDePersonal/AsistenciaDePersonalIDB";
import { FechaHoraActualRealState } from "@/global/state/others/fechaHoraActualReal";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { ActoresSistema } from "@/interfaces/shared/ActoresSistema";
import { Loader2 } from "lucide-react";
import {
  AsistenciaDiariaResultado,
  ConsultarAsistenciasTomadasPorActorEnRedisResponseBody,
  TipoAsistencia,
} from "@/interfaces/shared/AsistenciaRequests";
import { ErrorResponseAPIBase } from "@/interfaces/shared/apis/types";
import { useSelector } from "react-redux";
import { RootState } from "@/global/store";

// Obtener texto según el rol
export const obtenerTextoRol = (rol: RolesSistema): string => {
  switch (rol) {
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
      setEliminandoAsistencia(personal.DNI);

      console.log(
        `🗑️ Iniciando eliminación de asistencia para: ${personal.DNI}`
      );

      // Eliminar usando el modelo de IndexedDB
      const resultado = await asistenciaDePersonalIDB.eliminarAsistencia({
        dni: personal.DNI,
        rol: rol,
        modoRegistro: modoRegistro,
      });

      if (resultado.exitoso) {
        // ✅ Actualizar el mapa de asistencias registradas (eliminar la entrada)
        setAsistenciasRegistradas((prev) => {
          const nuevo = new Map(prev);
          nuevo.delete(personal.DNI);
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
  useEffect(() => {
    const cargarAsistenciasRegistradas = async () => {
      try {
        setCargandoAsistencias(true);

        // Mapear el rol de RolesSistema a ActoresSistema
        let actorParam: ActoresSistema;
        switch (rol) {
          case RolesSistema.ProfesorPrimaria:
            actorParam = ActoresSistema.ProfesorPrimaria;
            break;
          case RolesSistema.ProfesorSecundaria:
          case RolesSistema.Tutor:
            actorParam = ActoresSistema.ProfesorSecundaria;
            break;
          case RolesSistema.Auxiliar:
            actorParam = ActoresSistema.Auxiliar;
            break;
          case RolesSistema.PersonalAdministrativo:
            actorParam = ActoresSistema.PersonalAdministrativo;
            break;
          default:
            actorParam = ActoresSistema.Auxiliar;
        }

        // Consultar las asistencias ya registradas
        const response = await fetch(
          `/api/asistencia-hoy/consultar-asistencias-tomadas?TipoAsistencia=${TipoAsistencia.ParaPersonal}&Actor=${actorParam}&ModoRegistro=${modoRegistro}`
        );

        if (response.ok) {
          const data =
            (await response.json()) as ConsultarAsistenciasTomadasPorActorEnRedisResponseBody;

          console.log("🔍 Datos obtenidos de la API:", data);

          // Sincronizar con IndexedDB usando la nueva instancia
          const statsSync =
            await asistenciaDePersonalIDB.sincronizarAsistenciasDesdeRedis(
              data
            );

          console.log("📊 Estadísticas de sincronización:", statsSync);

          // ✅ CORREGIDO: Crear mapa de asistencias por DNI con validación
          const mapaAsistencias = new Map<string, AsistenciaDiariaResultado>();

          // Validar si Resultados es un array o un objeto único
          const resultados = Array.isArray(data.Resultados)
            ? data.Resultados
            : [data.Resultados];

          resultados.forEach((resultado) => {
            if (resultado && resultado.DNI) {
              console.log("📝 Agregando al mapa:", resultado);
              mapaAsistencias.set(resultado.DNI, resultado);
            }
          });

          console.log("🗺️ Mapa final de asistencias:", mapaAsistencias);
          setAsistenciasRegistradas(mapaAsistencias);
        } else {
          console.error(
            "❌ Error al cargar asistencias:",
            await response.text()
          );
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

    setProcesando(personal.DNI);

    try {
      // Obtener la hora esperada como string ISO directamente del JSON
      const horaEsperadaISO =
        handlerDatosAsistenciaHoyDirectivo.obtenerHorarioPersonalISO(
          rol!,
          personal.DNI,
          modoRegistro
        );

      console.log("🕐 Hora esperada ISO (directa del JSON):", horaEsperadaISO);

      // Feedback por voz
      const speaker = Speaker.getInstance();
      speaker.start(
        `${
          modoRegistroTextos[modoRegistro]
        } registrada para ${personal.Nombres.split(
          " "
        ).shift()} ${personal.Apellidos.split(" ").shift()}`
      );

      // Llamar a la API para registrar en Redis
      const response = await fetch("/api/asistencia-hoy/marcar", {
        method: "POST",
        body: JSON.stringify({
          DNI: personal.DNI,
          Actor: rol,
          TipoAsistencia: TipoAsistencia.ParaPersonal,
          ModoRegistro: modoRegistro,
          FechaHoraEsperadaISO: horaEsperadaISO,
        } as RegistrarAsistenciaIndividualRequestBody),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data =
        (await response.json()) as RegistrarAsistenciaIndividualSuccessResponse;

      console.log("Respuesta de la API:", data);

      if (data.success) {
        // ✅ NUEVO: Crear objeto AsistenciaDiariaResultado y agregarlo al mapa
        const nuevoRegistro: AsistenciaDiariaResultado = {
          DNI: personal.DNI,
          AsistenciaMarcada: true,
          Detalles: {
            Timestamp: data.data.timestamp,
            DesfaseSegundos: data.data.desfaseSegundos,
          },
        };

        // Actualizar el mapa de asistencias registradas
        setAsistenciasRegistradas((prev) => {
          const nuevo = new Map(prev);
          nuevo.set(personal.DNI, nuevoRegistro);
          return nuevo;
        });

        // Guardar en IndexedDB
        await asistenciaDePersonalIDB.marcarAsistencia({
          datos: {
            Rol: rol!,
            Dia: fechaHoraActual.utilidades!.diaMes,
            DNI: personal.DNI,
            esNuevoRegistro: data.data.esNuevoRegistro,
            ModoRegistro: modoRegistro,
            Detalles: {
              DesfaseSegundos: data.data.desfaseSegundos,
              Timestamp: data.data.timestamp,
            },
          },
        });

        toast({
          title: "Asistencia registrada",
          description: `${modoRegistro} registrada correctamente`,
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "No se pudo registrar la asistencia",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al registrar asistencia:", error);

      let errorMessage = "Ocurrió un error al procesar la solicitud";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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
            {personal.map((persona) => {
              // ✅ NUEVO: Obtener la asistencia registrada para esta persona
              const asistenciaPersona = asistenciasRegistradas.get(persona.DNI);

              // 🐛 DEBUG: Log para verificar datos
              console.log(`🔍 Debug persona ${persona.DNI}:`, {
                asistenciaPersona,
                tieneDatos: !!asistenciaPersona,
                asistenciaMarcada: asistenciaPersona?.AsistenciaMarcada,
                detalles: asistenciaPersona?.Detalles,
                timestampActual,
                mapaCompleto: asistenciasRegistradas,
              });

              return (
                <ItemTomaAsistencia
                  key={persona.DNI}
                  personal={persona}
                  handlePersonalSeleccionado={handlePersonaSeleccionada}
                  handleEliminarAsistencia={handleEliminarAsistencia} // ← NUEVO: Pasar función de eliminación
                  asistenciaRegistrada={asistenciaPersona} // ← NUEVO: Pasar los datos de asistencia
                  timestampActual={timestampActual} // ← NUEVO: Pasar timestamp de Redux
                  loading={procesando === persona.DNI}
                  eliminando={eliminandoAsistencia === persona.DNI} // ← NUEVO: Estado de eliminación
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
