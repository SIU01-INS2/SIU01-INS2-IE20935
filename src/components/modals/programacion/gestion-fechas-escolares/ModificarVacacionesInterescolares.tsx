import { useState, useRef } from "react";
import ModalContainer from "../../ModalContainer";
import BotonConIcono from "@/components/buttons/BotonConIcono";
import CalendarioIcon from "@/components/icons/CalendarioIcon";
import GuardarIcon from "@/components/icons/GuardarIcon";

const ModificarVacacionesInterescolares = ({
  eliminateModal,
}: {
  eliminateModal: () => void;
}) => {
  const hoy = new Date();
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);

  // Referencias a los inputs para controlar el calendario
  const inputInicioRef = useRef<HTMLInputElement>(null);
  const inputFinRef = useRef<HTMLInputElement>(null);

  const obtenerDiaSemana = (fecha: Date) => {
    const dias = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    return dias[fecha.getDay()];
  };

  const convertirFechaParaInput = (fecha: Date) =>
    `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(
      fecha.getDate()
    ).padStart(2, "0")}`;

  const manejarCambioFechaInicio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevaFecha = new Date(e.target.value + "T00:00:00");
    setFechaInicio(nuevaFecha);
  };

  const manejarCambioFechaFin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevaFecha = new Date(e.target.value + "T00:00:00");
    setFechaFin(nuevaFecha);
  };

  return (
    <>
      {/* Estilos globales para ocultar el ícono del date picker */}
      <style jsx global>{`
        .date-input-custom::-webkit-calendar-picker-indicator {
          opacity: 0;
          position: absolute;
          right: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
          z-index: 1;
        }
        
        .date-input-custom::-webkit-inner-spin-button,
        .date-input-custom::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
          display: none;
        }
        
        .date-input-custom::-webkit-clear-button {
          display: none;
        }
        
        .date-input-custom {
          -webkit-appearance: none;
          -moz-appearance: textfield;
          appearance: none;
        }
        
        .date-input-custom:focus {
          outline: none;
          box-shadow: none;
        }
      `}</style>

      <ModalContainer
        className="w-[95vw] sm:w-[500px] md:w-[550px] lg:w-[600px] max-w-[80vw] sm:max-w-[600px] mx-auto"
        eliminateModal={eliminateModal}
      >
        <div className="pt-2 px-4 md:px-6">
          {/* Título */}
          <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-6">
            Periodo de Vacaciones
          </h2>

          {/* Fechas */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-6">
            {/* Inicio */}
            <div className="flex-1 w-full">
              <label className="block text-base sm:text-lg font-semibold text-gray-800 mb-3 pl-[6px]">
                Inicio de Vacaciones
              </label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    ref={inputInicioRef}
                    type="date"
                    defaultValue={convertirFechaParaInput(hoy)}
                    onChange={manejarCambioFechaInicio}
                    className="date-input-custom bg-red-500 text-white font-medium px-3 py-2 rounded-lg hover:bg-red-600 transition-colors xs-only:w-[150px] cursor-pointer"
                  />
                  {/* Botón Icono Calendario */}
                  <span
                    className="w-4 ml-2 absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-white pointer-events-none"
                    onClick={() => inputInicioRef.current?.showPicker()}
                  >
                    <CalendarioIcon />
                  </span>
                </div>
                <p className="text-gray-600 font-medium whitespace-nowrap">
                  ({obtenerDiaSemana(fechaInicio)})
                </p>
              </div>
            </div>

            {/* Fin */}
            <div className="flex-1 w-full">
              <label className="block text-base sm:text-lg font-semibold text-gray-800 mb-3 pl-[6px]">
                Fin de Vacaciones
              </label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    ref={inputFinRef}
                    type="date"
                    defaultValue={convertirFechaParaInput(hoy)}
                    onChange={manejarCambioFechaFin}
                    className="date-input-custom bg-red-500 text-white font-medium px-3 py-2 rounded-lg hover:bg-red-600 transition-colors xs-only:w-[150px] cursor-pointer"
                  />
                  {/* Botón Icono Calendario */}
                  <span
                    className="w-4 ml-2 absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-white pointer-events-none"
                    onClick={() => inputFinRef.current?.showPicker()}
                  >
                    <CalendarioIcon />
                  </span>
                </div>
                <p className="text-gray-600 font-medium whitespace-nowrap">
                  ({obtenerDiaSemana(fechaFin)})
                </p>
              </div>
            </div>
          </div>

          {/* Botón Guardar */}
          <div className="flex justify-center">
            <BotonConIcono
              texto="Guardar Cambios"
              IconTSX={<GuardarIcon className="w-4 ml-2" />}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg transition-colors xs-only:w-[250px]"
            />
          </div>
          <br />
        </div>
      </ModalContainer>
    </>
  );
};

export default ModificarVacacionesInterescolares;