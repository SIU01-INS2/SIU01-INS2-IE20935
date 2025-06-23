import ModalContainer from "../../ModalContainer";
import BotonConIcono from "@/components/buttons/BotonConIcono";
import CheackIcon from "@/components/icons/CheckIcon";
import RechazarEquisIcon from "@/components/icons/RechazarEquisIcon";

const EliminarVacacionesInteescolares = ({
  eliminateModal,
}: {
  eliminateModal: () => void;
}) => {
  return (
    <ModalContainer
      className="w-[95vw] sm:w-[400px] max-w-[90vw] sm:max-w-[400px] mx-auto"
      eliminateModal={eliminateModal}
    >
      <div className="pt-6 px-6 pb-4 text-center">
        <p className="text-base sm:text-lg text-black font-medium mb-8 leading-6">
          Se eliminará el periodo de vacaciones agregado, ¿Deseas continuar?
        </p>

        <div className="flex justify-center gap-6">
            <BotonConIcono
            texto="Si"
            IconTSX={<CheackIcon className="w-4 ml-2" />}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors xs-only:w-[80px]"
          />
          <BotonConIcono
            texto="No"
            IconTSX={<RechazarEquisIcon className="w-4 ml-2" />}
            className="bg-gray-300 hover:bg-gray-400 text-black font-semibold px-6 py-3 rounded-lg transition-colors xs-only:w-[85px]"
          />
        </div><br></br>
      </div>
    </ModalContainer>
  );
};

export default EliminarVacacionesInteescolares;
