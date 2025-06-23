import { useState, useRef } from "react";
import ModalContainer from "../../ModalContainer";
import BotonConIcono from "@/components/buttons/BotonConIcono";
import CalendarioIcon from "@/components/icons/CalendarioIcon";
import GuardarIcon from "@/components/icons/GuardarIcon";

const ModificarSemanaGestionEscolar = ({
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
    <ModalContainer
      className="w-[95vw] sm:w-[500px] md:w-[550px] lg:w-[600px] max-w-[80vw] sm:max-w-[600px] mx-auto"
      eliminateModal={eliminateModal}
    >
      <div className="pt-2 px-4 md:px-6">
        {/* Título */}
        <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-6">
          Periodo de Semana de Gestión
        </h2>

        {/* Fechas */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-6">
          {/* Inicio */}
          <div className="flex-1 w-full">
            <label className="block text-base sm:text-lg font-semibold text-gray-800 mb-3 pl-[6px]">
              Inicio de Semana
            </label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  ref={inputInicioRef}
                  type="date"
                  defaultValue={convertirFechaParaInput(hoy)}
                  onChange={manejarCambioFechaInicio}
                  className="bg-red-500 text-white font-medium px-3 py-2 rounded-lg hover:bg-red-600 transition-colors xs-only:w-[150px] cursor-pointer"
                />
                {/* Botón Icono Calendario */}
                <span
                  className="w-4 ml-2 absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-white"
                  onClick={() => inputInicioRef.current?.showPicker()}
                >
                  <CalendarioIcon />
                </span>
                {/* Estilos */}
                <style jsx>{`
                  input[type="date"]::-webkit-calendar-picker-indicator {
                    display: none;
                  }
                  input[type="date"]::-webkit-inner-spin-button {
                    display: none;
                  }
                  input[type="date"]::-webkit-clear-button {
                    display: none;
                  }
                  input[type="date"]:focus {
                    outline: none;
                    box-shadow: none;
                  }
                `}</style>
              </div>
              <p className="text-gray-600 font-medium whitespace-nowrap">
                ({obtenerDiaSemana(fechaInicio)})
              </p>
            </div>
          </div>

          {/* Fin */}
          <div className="flex-1 w-full">
            <label className="block text-base sm:text-lg font-semibold text-gray-800 mb-3 pl-[6px]">
              Fin de Semana
            </label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  ref={inputFinRef}
                  type="date"
                  defaultValue={convertirFechaParaInput(hoy)}
                  onChange={manejarCambioFechaFin}
                  className="bg-red-500 text-white font-medium px-3 py-2 rounded-lg hover:bg-red-600 transition-colors xs-only:w-[150px] cursor-pointer"
                />
                {/* Botón Icono Calendario */}
                <span
                  className="w-4 ml-2 absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-white"
                  onClick={() => inputFinRef.current?.showPicker()}
                >
                  <CalendarioIcon />
                </span>
                {/* Estilos */}
                <style jsx>{`
                  input[type="date"]::-webkit-calendar-picker-indicator {
                    display: none;
                  }
                  input[type="date"]::-webkit-inner-spin-button {
                    display: none;
                  }
                  input[type="date"]::-webkit-clear-button {
                    display: none;
                  }
                  input[type="date"]:focus {
                    outline: none;
                    box-shadow: none;
                  }
                `}</style>
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
  );
};

export default ModificarSemanaGestionEscolar;