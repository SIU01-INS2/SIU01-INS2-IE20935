import { ModoRegistro } from "@/interfaces/shared/ModoRegistroPersonal";
import EntradaIcon from "../icons/EntradaIcon";
import SalidaIcon from "../icons/SalidaIcon";
import { RolBoton } from "../shared/buttons/RolButton";

export const SeleccionEntradaSalida = ({
  onSeleccion,
}: {
  onSeleccion: (modo: ModoRegistro | null) => void;
}) => {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto">
        <h2 className="text-xl sm-only:text-2xl md-only:text-2xl lg-only:text-3xl xl-only:text-3xl font-bold text-center text-blue-800 mb-8">
          ¿Qué deseas registrar?
        </h2>
        <div className="flex justify-center gap-6">
          <RolBoton
            className="justify-self-center"
            onClick={() => onSeleccion(ModoRegistro.Entrada)}
            icon={
              <EntradaIcon className="max-lg:short-height:h-[7.5vh] max-sm:w-[1.65rem] sm-only:w-[2.1rem] md-only:w-[2rem] lg-only:w-[2.4rem] xl-only:w-[3rem] text-negro" />
            }
            label="Entrada"
          />
          <RolBoton
            className="justify-self-center"
            onClick={() => onSeleccion(ModoRegistro.Salida)}
            icon={
              <SalidaIcon className="max-lg:short-height:h-[7.5vh] max-sm:w-[1.65rem] sm-only:w-[2.1rem] md-only:w-[2rem] lg-only:w-[2.4rem] xl-only:w-[3rem] text-negro" />
            }
            label="Salida"
          />
        </div>
      </div>
    </div>
  );
};
