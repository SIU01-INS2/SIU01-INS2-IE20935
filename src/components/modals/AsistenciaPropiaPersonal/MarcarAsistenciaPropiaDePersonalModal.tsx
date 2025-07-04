import { useState, useCallback } from "react";
import ModalContainer from "../ModalContainer";
import BotonConIcono from "@/components/buttons/BotonConIcono";
import LapizFirmando from "@/components/icons/LapizFirmando";
import {
  ModoRegistro,
  modoRegistroTextos,
} from "@/interfaces/shared/ModoRegistroPersonal";
import { estaDentroDelColegioIE20935 } from "@/lib/helpers/functions/geolocation/getEstadoDeUbicacion";
import { PuntoGeografico } from "@/interfaces/Geolocalizacion";
import { verificarDisponibilidadGPS } from "@/lib/helpers/functions/geolocation/verificarDisponibilidadGPS";
import { detectarTipoDispositivo } from "@/lib/helpers/functions/geolocation/detectarTipoDispositivo";
import Loader from "@/components/shared/loaders/Loader";
import { ENTORNO } from "@/constants/ENTORNO";
import { Entorno } from "@/interfaces/shared/Entornos";

// ========================================================================================
// CONSTANTES DE CONFIGURACIÓN
// ========================================================================================
export const SOLO_PERMITIR_CELULARES_PARA_ASISTENCIA =
  ENTORNO !== Entorno.LOCAL || false; // Cambiar a false para permitir laptops

// 🆕 FUNCIONES DE DESARROLLO - SOLO ACTIVAS EN ENTORNO LOCAL
export const REQUERIR_VALIDACION_GPS = true; // 🔧 Cambiar a false para saltarse GPS (SOLO en local)
export const USAR_COORDENADAS_MOCKEADAS = false; // 🎭 Cambiar a true para usar coordenadas fake (SOLO en local)

// 🎯 COORDENADAS PARA TESTING (SOLO en local)
export const LATITUD_MOCKEADA = -13.056668; // Coordenada de prueba
export const LONGITUD_MOCKEADA = -76.346977; // Coordenada de prueba

/*
🎭 INSTRUCCIONES PARA FUNCIONES DE DESARROLLO:

⚠️ IMPORTANTE: Estas funciones SOLO trabajan en ENTORNO LOCAL
   En producción, siempre se usa GPS real con validación completa.

1. BYPASS DE GPS (Solo en Local):
   - REQUERIR_VALIDACION_GPS = false
   - Se salta TODA la validación de ubicación
   - Útil para desarrollo sin GPS

2. MOCKEO DE COORDENADAS (Solo en Local):
   - USAR_COORDENADAS_MOCKEADAS = true
   - REQUERIR_VALIDACION_GPS = true (para probar flujo completo)
   - Simula GPS real pero con coordenadas predefinidas

📍 COORDENADAS ÚTILES PARA TESTING:

DENTRO DEL COLEGIO IE 20935:
- LATITUD_MOCKEADA = -13.0393
- LONGITUD_MOCKEADA = -76.3806

FUERA DEL COLEGIO:
- LATITUD_MOCKEADA = -12.0464
- LONGITUD_MOCKEADA = -77.0428

🔧 MODOS DISPONIBLES (Solo en Local):

MODO 1 - BYPASS COMPLETO:
- REQUERIR_VALIDACION_GPS = false
→ Sin GPS, sin validación

MODO 2 - TESTING CON GPS FAKE:
- REQUERIR_VALIDACION_GPS = true
- USAR_COORDENADAS_MOCKEADAS = true
→ GPS fake + validación completa

MODO 3 - PRODUCCIÓN (Automático en otros entornos):
→ GPS real + validación completa
*/

interface MarcarAsistenciaPropiaDePersonalModalProps {
  eliminateModal: () => void;
  modoRegistro: ModoRegistro;
  marcarMiAsistenciaDeHoy: () => Promise<void>;
  setMostrarModalConfirmacioAsistenciaMarcada: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  setMostrarModalFaltaActivarGPSoBrindarPermisosGPS: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  setMostrarModalUbicacionFueraDelColegioAlRegistrarAsistenciaPropia: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  setMostrarModalErrorGenericoAlRegistrarAsistenciaPropia: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  setMostrarModalFalloConexionAInternet: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  setMostrarModalNoSePuedeUsarLaptop: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  setMostrarModalDispositivoSinGPS: React.Dispatch<
    React.SetStateAction<boolean>
  >;
}

const MarcarAsistenciaPropiaDePersonalModal = ({
  eliminateModal,
  modoRegistro,
  marcarMiAsistenciaDeHoy,
  setMostrarModalConfirmacioAsistenciaMarcada,
  setMostrarModalFaltaActivarGPSoBrindarPermisosGPS,
  setMostrarModalUbicacionFueraDelColegioAlRegistrarAsistenciaPropia,
  setMostrarModalErrorGenericoAlRegistrarAsistenciaPropia,
  setMostrarModalFalloConexionAInternet,
  setMostrarModalNoSePuedeUsarLaptop,
  setMostrarModalDispositivoSinGPS,
}: MarcarAsistenciaPropiaDePersonalModalProps) => {
  const [estaProcessando, setEstaProcessando] = useState(false);

  // 🎯 DETERMINAR CONFIGURACIÓN FINAL (Solo funciones dev en local)
  const esEntornoLocal = ENTORNO === Entorno.LOCAL;
  const saltarValidacionGPS = esEntornoLocal && !REQUERIR_VALIDACION_GPS;
  const usarCoordenadasFake = esEntornoLocal && USAR_COORDENADAS_MOCKEADAS;

  const verificarYSolicitarPermisos = async (): Promise<boolean> => {
    try {
      // Verificar si ya tenemos permisos
      if ("permissions" in navigator) {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });

        console.log("📍 Estado actual de permisos:", permission.state);

        if (permission.state === "granted") {
          console.log("✅ Permisos ya concedidos");
          return true;
        }

        if (permission.state === "denied") {
          console.log("❌ Permisos denegados permanentemente");
          return false;
        }

        console.log("🔄 Permisos en estado prompt, solicitando...");
      }

      // Solicitar permisos
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => {
            console.log("✅ Permisos concedidos");
            resolve(true);
          },
          (error) => {
            console.log("❌ Permisos denegados:", error);
            resolve(false);
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: Infinity,
          }
        );
      });
    } catch (error) {
      console.error("❌ Error al verificar permisos:", error);
      return false;
    }
  };

  const obtenerUbicacion = (): Promise<PuntoGeografico> => {
    return new Promise((resolve, reject) => {
      // 🎭 USAR COORDENADAS MOCKEADAS (Solo en local)
      if (usarCoordenadasFake) {
        console.log(
          "🎭 MODO MOCKEO ACTIVADO - Usando coordenadas fake (Solo en local)"
        );
        console.log("📍 Coordenadas mockeadas:", {
          latitud: LATITUD_MOCKEADA,
          longitud: LONGITUD_MOCKEADA,
          entorno: "LOCAL - TESTING",
        });

        // Simular delay del GPS real
        setTimeout(() => {
          resolve({
            latitud: LATITUD_MOCKEADA,
            longitud: LONGITUD_MOCKEADA,
          });
        }, 1000);

        return;
      }

      // 🔄 MODO NORMAL - GPS REAL
      if (!navigator.geolocation) {
        reject(new Error("Geolocalización no soportada"));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("📍 Posición REAL obtenida:", {
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
            precision: position.coords.accuracy,
          });

          resolve({
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
          });
        },
        (error) => {
          console.error("❌ Error de geolocalización:", {
            code: error.code,
            message: error.message,
          });

          let errorMessage = "Error desconocido";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Permisos de ubicación denegados";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Ubicación no disponible";
              break;
            case error.TIMEOUT:
              errorMessage = "Timeout al obtener ubicación";
              break;
          }

          reject(new Error(errorMessage));
        },
        options
      );
    });
  };

  const manejarRegistroAsistencia = useCallback(async () => {
    if (estaProcessando) return;

    try {
      setEstaProcessando(true);

      // MOSTRAR CONFIGURACIÓN ACTUAL EN CONSOLA
      console.log("🔧 CONFIGURACIÓN ACTUAL:", {
        entorno: ENTORNO,
        esEntornoLocal,
        saltarValidacionGPS,
        usarCoordenadasFake,
        configuracionOriginal: {
          REQUERIR_VALIDACION_GPS,
          USAR_COORDENADAS_MOCKEADAS,
        },
      });

      // PASO 1: Verificar tipo de dispositivo
      if (SOLO_PERMITIR_CELULARES_PARA_ASISTENCIA) {
        const tipoDispositivo = detectarTipoDispositivo();

        if (tipoDispositivo === "laptop") {
          console.log("❌ Dispositivo no permitido: laptop");
          eliminateModal();
          setMostrarModalNoSePuedeUsarLaptop(true);
          return;
        }

        console.log("✅ Dispositivo permitido: móvil");
      }

      // 🚀 BYPASS COMPLETO DE GPS (Solo en local)
      if (saltarValidacionGPS) {
        console.log("⚡ BYPASS DE GPS ACTIVADO (Solo en entorno local)");
        console.log("🚀 Saltando TODA la validación de ubicación...");

        // Ir directamente a marcar asistencia
        await marcarMiAsistenciaDeHoy();

        console.log("✅ Asistencia registrada exitosamente (sin GPS)");
        eliminateModal();
        setMostrarModalConfirmacioAsistenciaMarcada(true);
        return;
      }

      // 🔍 VALIDACIÓN GPS COMPLETA (Producción o local con GPS habilitado)
      console.log(
        "🔍 Validación GPS habilitada, procediendo con verificaciones..."
      );

      // PASO 2: Verificar disponibilidad de GPS (Solo si no usamos coordenadas fake)
      if (!usarCoordenadasFake) {
        if (!verificarDisponibilidadGPS()) {
          console.log("❌ GPS no disponible en el dispositivo");
          eliminateModal();
          setMostrarModalDispositivoSinGPS(true);
          return;
        }

        console.log("✅ GPS disponible, verificando permisos...");

        // PASO 3: Verificar y solicitar permisos de geolocalización
        const tienePermisos = await verificarYSolicitarPermisos();

        if (!tienePermisos) {
          console.log("❌ No se pudieron obtener permisos de geolocalización");
          eliminateModal();
          setMostrarModalFaltaActivarGPSoBrindarPermisosGPS(true);
          return;
        }

        console.log("✅ Permisos GPS obtenidos");
      }

      // PASO 4: Obtener ubicación
      let ubicacion: PuntoGeografico;
      try {
        ubicacion = await obtenerUbicacion();

        if (usarCoordenadasFake) {
          console.log(
            "🎭 Ubicación MOCKEADA obtenida (Solo en local):",
            ubicacion
          );
        } else {
          console.log("✅ Ubicación REAL obtenida:", ubicacion);
        }
      } catch (error) {
        console.error("❌ Error al obtener ubicación:", error);
        eliminateModal();
        setMostrarModalFaltaActivarGPSoBrindarPermisosGPS(true);
        return;
      }

      // PASO 5: Verificar si está dentro del colegio
      const estaDentroDelColegio = estaDentroDelColegioIE20935(ubicacion);

      if (!estaDentroDelColegio) {
        if (usarCoordenadasFake) {
          console.log(
            "❌ Coordenadas MOCKEADAS están fuera del área del colegio"
          );
          console.log(
            "💡 TIP: Cambia LATITUD_MOCKEADA y LONGITUD_MOCKEADA para testing"
          );
        } else {
          console.log("❌ Usuario fuera del área del colegio");
        }
        eliminateModal();
        setMostrarModalUbicacionFueraDelColegioAlRegistrarAsistenciaPropia(
          true
        );
        return;
      }

      if (usarCoordenadasFake) {
        console.log(
          "✅ Coordenadas MOCKEADAS están dentro del área, marcando asistencia..."
        );
      } else {
        console.log(
          "✅ Usuario dentro del área del colegio, marcando asistencia..."
        );
      }

      // PASO FINAL: Marcar asistencia
      await marcarMiAsistenciaDeHoy();

      console.log("✅ Asistencia registrada exitosamente");
      eliminateModal();
      setMostrarModalConfirmacioAsistenciaMarcada(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("❌ Error al marcar asistencia:", error);

      // Verificar si es error de conexión
      if (
        error?.message?.includes("network") ||
        error?.message?.includes("conexión") ||
        error?.message?.includes("internet") ||
        error?.name === "NetworkError" ||
        error?.message?.includes("fetch")
      ) {
        eliminateModal();
        setMostrarModalFalloConexionAInternet(true);
      } else {
        eliminateModal();
        setMostrarModalErrorGenericoAlRegistrarAsistenciaPropia(true);
      }
    } finally {
      setEstaProcessando(false);
    }
  }, [
    estaProcessando,
    esEntornoLocal,
    saltarValidacionGPS,
    usarCoordenadasFake,
    eliminateModal,
    marcarMiAsistenciaDeHoy,
    setMostrarModalConfirmacioAsistenciaMarcada,
    setMostrarModalFaltaActivarGPSoBrindarPermisosGPS,
    setMostrarModalUbicacionFueraDelColegioAlRegistrarAsistenciaPropia,
    setMostrarModalErrorGenericoAlRegistrarAsistenciaPropia,
    setMostrarModalFalloConexionAInternet,
    setMostrarModalNoSePuedeUsarLaptop,
    setMostrarModalDispositivoSinGPS,
  ]);

  // 🎨 DETERMINAR TEXTO Y ESTILO SEGÚN CONFIGURACIÓN
  const obtenerTextoModal = () => {
    if (estaProcessando) {
      if (saltarValidacionGPS) {
        return {
          texto: (
            <>
              <b>Registrando</b> tu asistencia...
              <br />
              <br />
              <span className="text-orange-600">
                <b>🚀 Modo sin GPS</b> (Solo en local)
              </span>
            </>
          ),
          boton: "Registrando...",
        };
      } else if (usarCoordenadasFake) {
        return {
          texto: (
            <>
              <b>Usando coordenadas</b> de <br />
              <b>prueba</b> para registro...
              <br />
              <br />
              <span className="text-purple-600">
                <b>🎭 Modo MOCKEO</b> (Solo en local)
              </span>
            </>
          ),
          boton: "Usando GPS fake...",
        };
      } else {
        return {
          texto: (
            <>
              <b>Verificando permisos</b> y <br />
              obteniendo tu <b>ubicación</b>...
              <br />
              <br />
              Si aparece una solicitud de <br />
              permisos, por favor <b>acepta</b> <br />
              para continuar.
            </>
          ),
          boton: "Verificando ubicación...",
        };
      }
    } else {
      if (saltarValidacionGPS) {
        return {
          texto: (
            <>
              Vamos a <b>registrar</b> tu <br />
              asistencia directamente.
              <br />
              <br />
              <span className="text-orange-600">
                <b>🚀 Sin validación GPS</b> (Solo en local)
              </span>
            </>
          ),
          boton: "🚀 Registrar (Sin GPS)",
        };
      } else if (usarCoordenadasFake) {
        return {
          texto: (
            <>
              Vamos a <b>registrar</b> tu <br />
              asistencia usando <br />
              <b>coordenadas de prueba</b>.
              <br />
              <br />
              <span className="text-purple-600">
                <b>🎭 Modo TESTING</b> (Solo en local)
              </span>
            </>
          ),
          boton: "🎭 Registrar (Modo Testing)",
        };
      } else {
        return {
          texto: (
            <>
              Vamos a verificar tu <br />
              <b>ubicación</b> para{" "}
              <b>
                registrar tu <br />
                asistencia de {modoRegistroTextos[modoRegistro]}
              </b>
              . Asegúrate de <br />
              estar <b>dentro del colegio</b>.
            </>
          ),
          boton: `Registrar ${modoRegistroTextos[modoRegistro]}`,
        };
      }
    }
  };

  const { texto, boton } = obtenerTextoModal();

  return (
    <ModalContainer className="z-[1200]" eliminateModal={eliminateModal}>
      <div className="w-full max-w-md px-4 py-4 sm:px-6 sm:py-8 flex flex-col items-center justify-center gap-5">
        <p className="text-center text-sm xs:text-base sm:text-lg leading-relaxed">
          {texto}
        </p>

        {REQUERIR_VALIDACION_GPS && (
          <img
            className="rounded-[5px] w-[11rem] xs:w-[11rem] sm:w-[11.5rem] md:w-[10.5rem] h-auto object-contain"
            src="/images/gif/UbicacionColegioViajeGuiado.gif"
            alt="Como llegar al colegio"
          />
        )}

        <BotonConIcono
          className={`${
            modoRegistro === ModoRegistro.Entrada
              ? "bg-verde-principal"
              : "bg-rojo-oscuro"
          } text-blanco flex gap-3 px-4 py-2 rounded-md text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed`}
          texto={boton}
          IconTSX={
            estaProcessando ? (
              <Loader className="w-[1.5rem] bg-white p-[0.3rem]" />
            ) : (
              <LapizFirmando className="w-[1.5rem]" />
            )
          }
          onClick={manejarRegistroAsistencia}
          disabled={estaProcessando}
        />
      </div>
    </ModalContainer>
  );
};

export default MarcarAsistenciaPropiaDePersonalModal;
