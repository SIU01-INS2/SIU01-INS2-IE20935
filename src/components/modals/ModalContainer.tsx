"use client";
import EquisIcon from "@/components/icons/EquisIcon";

export interface ModalContainerProps {
  children: React.ReactNode;
  eliminateModal: () => void;
  className?: string;
}

const ModalContainer = ({
  children,
  eliminateModal,
  className,
}: ModalContainerProps) => {
  return (
    <div
      onClick={eliminateModal}
      className="fixed flex-col w-screen portrait:h-[100dvh] landscape:h-screen z-[1004] top-0 left-0 bg-[#00000060] flex items-center justify-center overflow-hidden"
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`bg-white relative p-6 rounded-xl modal-content animate__animated animate__zoomIn [animation-duration:200ms] max-w-[90vw] max-h-[90vh] ${
          className ?? ""
        }`}
        style={{
          overflowY: "auto",
          overflowX: "hidden",
          // Estilos para la barra de desplazamiento personalizada
          scrollbarWidth: "thin", // Para Firefox
          scrollbarColor: "#d1d5db transparent", // Para Firefox
        }}
      >
        {/* Estilos personalizados para la barra de desplazamiento en navegadores webkit (Chrome, Safari) */}
        <style jsx>{`
          div::-webkit-scrollbar {
            width: 6px;
          }
          div::-webkit-scrollbar-track {
            background: transparent;
          }
          div::-webkit-scrollbar-thumb {
            background-color: #d1d5db;
            border-radius: 20px;
            border: 2px solid transparent;
          }
          div::-webkit-scrollbar-thumb:hover {
            background-color: #9ca3af;
          }
        `}</style>

        <button onClick={eliminateModal} className="">
          <EquisIcon className="absolute right-[1.25rem] top-[1.25rem] w-[1rem] text-gris-oscuro" />
        </button>
        <div className="pr-2">{children}</div>
      </div>
    </div>
  );
};

export default ModalContainer;
