"use client";
import LapizFirmando from "@/components/icons/LapizFirmando";
import MarcarAsistenciaPropiaDePersonalModal from "@/components/modals/AsistenciaPropiaPersonal/MarcarAsistenciaPropiaDePersonalModal";
import { RootState } from "@/global/store";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { SE_MOSTRO_TOLTIP_TOMAR_ASISTENCIA_PERSONAL_KEY } from "../PlantillaLogin";
import { useDelegacionEventos } from "@/hooks/useDelegacionDeEventos";

const MarcarAsistenciaDePersonalButton = () => {
  const { delegarEvento } = useDelegacionEventos();

  useEffect(() => {
    if (!delegarEvento) return;

    //Cerrar Tooltip al hacer click en cualquier lugar menos en si mismo
    delegarEvento(
      "mousedown",
      "#tooltip-mostrar-asistencia-personal, #tooltip-mostrar-asistencia-personal *",
      () => {
        ocultarTooltip();
      },
      true
    );
  }, [delegarEvento]);

  const [tomarMiAsistenciaPropiaPersonal, setTomarMiAsistenciaPropiaPersonal] =
    useState(false);
  const [mostrarTooltip, setMostrarTooltip] = useState(false);

  const navBarFooterHeight = useSelector(
    (state: RootState) => state.elementsDimensions.navBarFooterHeight
  );
  const navBarFooterIsOpen = useSelector(
    (state: RootState) => state.flags.sidebarIsOpen
  );

  // Verificar si se debe mostrar el tooltip
  useEffect(() => {
    const tooltipMostrado = sessionStorage.getItem(
      SE_MOSTRO_TOLTIP_TOMAR_ASISTENCIA_PERSONAL_KEY
    );

    // Si no existe la variable o es false, mostrar tooltip
    if (!tooltipMostrado || tooltipMostrado === "false") {
      setMostrarTooltip(true);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        volverAMostrarTooltip();
      }
    });
    
  }, []);

  // Función para ocultar el tooltip y guardarlo en sessionStorage
  const volverAMostrarTooltip = () => {
    setMostrarTooltip(true);
    sessionStorage.setItem(
      SE_MOSTRO_TOLTIP_TOMAR_ASISTENCIA_PERSONAL_KEY,
      "false"
    );
  };


    // Función para ocultar el tooltip y guardarlo en sessionStorage
  const ocultarTooltip = () => {
    setMostrarTooltip(false);
    sessionStorage.setItem(
      SE_MOSTRO_TOLTIP_TOMAR_ASISTENCIA_PERSONAL_KEY,
      "true"
    );
  };


  // Función para manejar el click del botón
  const handleClick = () => {
    if (mostrarTooltip) {
      ocultarTooltip();
    }
    setTomarMiAsistenciaPropiaPersonal(true);
  };

  return (
    <>
      {tomarMiAsistenciaPropiaPersonal && (
        <MarcarAsistenciaPropiaDePersonalModal
          eliminateModal={() => {
            setTomarMiAsistenciaPropiaPersonal(false);
          }}
        />
      )}
      <style>
        {`
        @keyframes Modificar-Bottom-NavBarFooter {
            to {
                bottom: ${
                  navBarFooterIsOpen ? `${navBarFooterHeight}px` : "0px"
                };
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
                    0 10px 30px rgba(0, 0, 0, 0.25),
                    0 4px 12px 4px rgba(34, 197, 94, 0.4),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
            }
            50% { 
                transform: scale(1.05);
                box-shadow: 
                    0 15px 40px rgba(0, 0, 0, 0.3),
                    0 6px 20px 6px rgba(34, 197, 94, 0.6),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3);
            }
        }
        
        @keyframes buttonGlow {
            0%, 100% { 
                box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
            }
            50% { 
                box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
            }
        }
        
        .tooltip-animation {
            animation: tooltipFadeIn 0.4s ease-out, tooltipPulse 2s ease-in-out infinite 1s;
        }
        
        .button-enhanced {
            position: relative;
            animation: buttonPulse 3s ease-in-out infinite;
        }
        
        .button-enhanced::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 50%;
            animation: buttonGlow 2s ease-in-out infinite;
            z-index: -1;
        }
        
        .tooltip-modern {
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        @media (max-width: 500px) {
            .button-enhanced {
                animation: buttonPulse 2.5s ease-in-out infinite;
            }
        }
        `}
      </style>

      {/* Contenedor del botón y tooltip */}
      <div
        className="fixed z-[102] right-0 Mover-NavBarFooter
                      sxs-only:mr-3 sxs-only:mb-3
                      xs-only:mr-4 xs-only:mb-4
                      max-sm:mr-5 max-sm:mb-4
                      mr-6 mb-5"
        style={{ bottom: navBarFooterHeight }}
      >
        {/* Tooltip original */}
        {mostrarTooltip && (
          <div
            id="tooltip-mostrar-asistencia-personal"
            className="absolute tooltip-animation
                          sxs-only:right-14 sxs-only:top-1
                          xs-only:right-16 xs-only:top-2
                          max-sm:right-18 max-sm:top-2
                          right-20 top-3"
          >
            {/* Mensaje del tooltip */}
            <div
              className="bg-azul-principal text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg relative
                            sxs-only:px-2 sxs-only:py-1 sxs-only:text-xs
                            xs-only:px-2 xs-only:py-1 xs-only:text-xs
                            max-sm:px-3 max-sm:py-2 max-sm:text-sm
                            whitespace-nowrap"
            >
              ¡Registra tu entrada!
              {/* Triángulo apuntando al botón */}
              <div
                className="absolute top-1/2 transform -translate-y-1/2
                              sxs-only:left-full sxs-only:border-l-4 sxs-only:border-l-azul-principal sxs-only:border-y-4 sxs-only:border-y-transparent
                              xs-only:left-full xs-only:border-l-4 xs-only:border-l-azul-principal xs-only:border-y-4 xs-only:border-y-transparent
                              max-sm:left-full max-sm:border-l-4 max-sm:border-l-azul-principal max-sm:border-y-4 max-sm:border-y-transparent
                              left-full border-l-4 border-l-azul-principal border-y-4 border-y-transparent"
              ></div>
            </div>
          </div>
        )}

        {/* Botón flotante mejorado */}
        <button
          onClick={handleClick}
          className={`${
            mostrarTooltip ? "button-enhanced" : "button-subtle-glow"
          } 
                      relative overflow-hidden aspect-square
                      bg-gradient-to-br from-verde-principal to-green-600 
                      hover:from-green-500 hover:to-green-700
                      rounded-full flex items-center justify-center 
                      transition-all duration-300 ease-out
                      hover:scale-110 active:scale-95
                      shadow-[0_6px_20px_rgba(0,0,0,0.3),0_2px_8px_rgba(34,197,94,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]
                      hover:shadow-[0_10px_30px_rgba(0,0,0,0.35),0_4px_15px_rgba(34,197,94,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]
                      border-2 border-green-400/20
                      sxs-only:w-12 sxs-only:h-12 sxs-only:p-2
                      xs-only:w-14 xs-only:h-14 xs-only:p-3
                      max-sm:w-16 max-sm:h-16 max-sm:p-3
                      w-18 h-18 p-4`}
          style={{
            minWidth: "3rem",
            minHeight: "3rem",
          }}
        >
          {/* Efecto de brillo en hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full hover:translate-x-full transition-transform duration-700"></div>

          {/* Icono mejorado */}
          <LapizFirmando
            className="text-white relative z-10 drop-shadow-sm
                       sxs-only:w-6
                       xs-only:w-7
                       max-sm:w-8
                       w-8"
          />

          {/* Punto de notificación cuando hay tooltip */}
          {mostrarTooltip && (
            <div
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-ping
                            sxs-only:w-2 sxs-only:h-2 sxs-only:-top-0.5 sxs-only:-right-0.5
                            xs-only:w-2.5 xs-only:h-2.5"
            ></div>
          )}
        </button>
      </div>
    </>
  );
};

export default MarcarAsistenciaDePersonalButton;
