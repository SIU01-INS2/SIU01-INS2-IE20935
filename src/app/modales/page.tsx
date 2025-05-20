"use client";
import { useState } from "react";
import MarcarAsistenciaPropiaDePersonalModal from "../../components/modals/AsistenciaPropiaPersonal/MarcarAsistenciaPropiaDePersonalModal";

const Modales = () => {
  const [showModal, setShowModal] = useState(true);

  return (
    <div>
      <button
        className="bg-purple-600 text-white p-4"
        onClick={() => {
          setShowModal(true);
        }}
      >
        Mostrar Modal
      </button>

      {showModal && (
        <MarcarAsistenciaPropiaDePersonalModal
          eliminateModal={() => {
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Modales;
