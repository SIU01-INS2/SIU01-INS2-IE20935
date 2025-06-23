import { useState, useRef } from "react";
import ModalContainer from "../../ModalContainer";
import BotonConIcono from "@/components/buttons/BotonConIcono";
import GuardarIcon from "@/components/icons/GuardarIcon";
import RelojTIempo from "@/components/icons/RelojTIempo";

const ModificarPersonalVacaciones= ({
  eliminateModal,
}: {
  eliminateModal: () => void;
}) => {
  const ahora = new Date();
  const [horaInicio, setHoraInicio] = useState(ahora);
  const [horaFin, setHoraFin] = useState(ahora);

  // Referencias a los inputs para controlar el selector de hora
  const inputInicioRef = useRef<HTMLInputElement>(null);
  const inputFinRef = useRef<HTMLInputElement>(null);

  const formatearHora = (fecha: Date) => {
    const horas = fecha.getHours();
    const minutos = fecha.getMinutes();
    const ampm = horas >= 12 ? 'p.m.' : 'a.m.';
    const horas12 = horas % 12;
    const horaFormateada = horas12 === 0 ? 12 : horas12;
    const minutosFormateados = String(minutos).padStart(2, '0');
    return `${String(horaFormateada).padStart(2, '0')}:${minutosFormateados} ${ampm}`;
  };

  const convertirHoraParaInput = (fecha: Date) => {
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
  };

  const manejarCambioHoraInicio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [horas, minutos] = e.target.value.split(':');
    const nuevaHora = new Date();
    nuevaHora.setHours(parseInt(horas), parseInt(minutos));
    setHoraInicio(nuevaHora);
  };

  const manejarCambioHoraFin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [horas, minutos] = e.target.value.split(':');
    const nuevaHora = new Date();
    nuevaHora.setHours(parseInt(horas), parseInt(minutos));
    setHoraFin(nuevaHora);
  };

  return (
    <ModalContainer
      className="w-[95vw] sm:w-[500px] max-w-[80vw] sm:max-w-[500px] mx-auto"
      eliminateModal={eliminateModal}
    >
      <div className="pt-2 px-4">
        {/* Título */}
        <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-6">
          Horario del Personal en Vacaciones Interescolares
        </h2>

        {/* Horarios */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-6">
          {/* Inicio */}
          <div className="flex-1 w-full">
            <label className="block text-base sm:text-lg font-semibold text-gray-800 mb-3 text-center">
              Horario de Inicio
            </label>
            <div className="flex items-center justify-center gap-3">
              <div className="relative">
                <div className="bg-red-500 text-white font-medium px-3 py-2 rounded-lg hover:bg-red-600 transition-colors xs-only:w-[150px] cursor-pointer flex items-center justify-between">
                  <span>{formatearHora(horaInicio)}</span>
                  <span
                    className="w-4 ml-2 cursor-pointer text-white"
                    onClick={() => inputInicioRef.current?.showPicker()}
                  >
                    <RelojTIempo />
                  </span>
                </div>
                <input
                  ref={inputInicioRef}
                  type="time"
                  defaultValue={convertirHoraParaInput(ahora)}
                  onChange={manejarCambioHoraInicio}
                  className="absolute opacity-0 pointer-events-none"
                />
                {/* Estilos */}
                <style jsx>{`
                  input[type="time"]::-webkit-calendar-picker-indicator {
                    display: none;
                  }
                  input[type="time"]::-webkit-inner-spin-button {
                    display: none;
                  }
                  input[type="time"]::-webkit-clear-button {
                    display: none;
                  }
                  input[type="time"]:focus {
                    outline: none;
                    box-shadow: none;
                  }
                `}</style>
              </div>
            </div>
          </div>

          {/* Fin */}
          <div className="flex-1 w-full">
            <label className="block text-base sm:text-lg font-semibold text-gray-800 mb-3 text-center">
              Horario de Cierre
            </label>
            <div className="flex items-center justify-center gap-3">
              <div className="relative">
                <div className="bg-red-500 text-white font-medium px-3 py-2 rounded-lg hover:bg-red-600 transition-colors xs-only:w-[150px] cursor-pointer flex items-center justify-between">
                  <span>{formatearHora(horaFin)}</span>
                  <span
                    className="w-4 ml-2 cursor-pointer text-white"
                    onClick={() => inputFinRef.current?.showPicker()}
                  >
                    <RelojTIempo />
                  </span>
                </div>
                <input
                  ref={inputFinRef}
                  type="time"
                  defaultValue={convertirHoraParaInput(ahora)}
                  onChange={manejarCambioHoraFin}
                  className="absolute opacity-0 pointer-events-none"
                />
                {/* Estilos */}
                <style jsx>{`
                  input[type="time"]::-webkit-calendar-picker-indicator {
                    display: none;
                  }
                  input[type="time"]::-webkit-inner-spin-button {
                    display: none;
                  }
                  input[type="time"]::-webkit-clear-button {
                    display: none;
                  }
                  input[type="time"]:focus {
                    outline: none;
                    box-shadow: none;
                  }
                `}</style>
              </div>
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

export default ModificarPersonalVacaciones;