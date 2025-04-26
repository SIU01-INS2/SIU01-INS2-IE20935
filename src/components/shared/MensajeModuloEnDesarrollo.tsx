import { Link } from "next-view-transitions";
import React from "react";

const ModuloEnDesarrollo = () => {
  return (
    <div className="w-full max-w-lg mx-auto bg-white border border-gray-200 rounded-lg shadow-sm p-6 sm-only:p-5 xs-only:p-4 sxs-only:p-3">
      <div className="flex items-center mb-4">
        <div className="mr-4 flex-shrink-0">
          <svg
            className="w-8 h-8 text-azul-principal"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800">
          Módulo en Desarrollo
        </h2>
      </div>

      <div className="mb-6 text-gray-600">
        <p className="mb-2">
          Este módulo aún está en desarrollo y no está disponible actualmente.
        </p>
        <p>Estará implementado próximamente.</p>
      </div>

      <div className="flex space-x-3">
        <Link
          href="/"
          className="px-4 py-2 bg-azul-principal hover:bg-azul-principal/90 text-white rounded font-medium transition-colors"
        >
          Inicio
        </Link>
      </div>
    </div>
  );
};

export default ModuloEnDesarrollo;
