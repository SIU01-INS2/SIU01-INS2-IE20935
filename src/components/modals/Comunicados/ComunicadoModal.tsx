import ModalContainer from "../ModalContainer";
import BotonConIcono from "../../buttons/BotonConIcono";
import OjoIcon from "@/components/icons/OjoIcon";

const ComunicadoModal = ({
  eliminateModal,
}: {
  eliminateModal: () => void;
}) => {
  return (
    <ModalContainer className="p-0" eliminateModal={eliminateModal}>
      <div className="bg-white max-w-[30rem]">
        <p>
          Lorem Lorem ipsum dolor sit, amet consectetur adipisicing elit. Rerum
          quam voluptatibus maiores ducimus ipsa! Placeat quia eum beatae alias
          tenetur dolore hic, deserunt facere temporibus maxime illo earum
          officiis laudantium? Lorem ipsum dolor sit, amet consectetur
          adipisicing elit. Rerum quam voluptatibus maiores ducimus ipsa!
          Placeat quia eum beatae alias tenetur dolore hic, deserunt facere
          temporibus maxime illo earum officiis laudantium? ipsum dolor sit,
          amet consectetur adipisicing elit. Rerum quam voluptatibus maiores
          ducimus ipsa! Placeat quia eum beatae alias tenetur dolore hic,
          deserunt facere temporibus maxime illo earum officiis laudantium?
        </p>
        <img className="opacity-[0.2]" src="/images/svg/Logo.svg" alt="Logo del Colegio" />
        <BotonConIcono
          className="flex items-center justify-center p-2 bg-negro text-white gap-3"
          texto="Ver imagen Adjunta"
          IconTSX={<OjoIcon className="w-[1.5rem] text-white" />}
        />
      </div>
    </ModalContainer>
  );
};

export default ComunicadoModal;
