"use client";
import ComunicadoModal from "@/components/modals/Comunicados/ComunicadoModal";
import ModuloEnDesarrollo from "@/components/shared/MensajeModuloEnDesarrollo";
import { useState } from "react";

const Comunicados = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <ModuloEnDesarrollo />

      <button
        onClick={() => {
          setShowModal(true);
        }}
        className="bg-purple-700 text-white p-4 "
      >
        Mostrar Modal
      </button>

      {showModal && (
        <ComunicadoModal
          eliminateModal={() => {
            setShowModal(false);
          }}
        />
      )}
    </>
  );
};

export default Comunicados;
