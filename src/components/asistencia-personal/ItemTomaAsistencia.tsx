import { Genero } from "@/interfaces/shared/Genero";
import FotoPerfilClientSide from "../utils/photos/FotoPerfilClientSide";
import { CheckCircle, Loader2 } from "lucide-react";

export interface PersonalParaTomarAsistencia {
  DNI: string;
  GoogleDriveFotoId: string | null;
  Nombres: string;
  Apellidos: string;
  Genero: Genero;
  Cargo?: string;
}

const ItemTomaAsistencia = ({
  handlePersonalSeleccionado,
  personal,
  disabled = false,
  loading = false,
  globalLoading = false,
}: {
  personal: PersonalParaTomarAsistencia;
  handlePersonalSeleccionado: (personal: PersonalParaTomarAsistencia) => void;
  disabled?: boolean;
  loading?: boolean;
  globalLoading?: boolean;
}) => {
  return (
    <div
      key={personal.DNI}
      onClick={() =>
        !disabled &&
        !loading &&
        !globalLoading &&
        handlePersonalSeleccionado(personal)
      }
      className={`flex items-center border rounded-lg shadow-sm transition-all p-1.5 sm-only:p-2 md-only:p-2 lg-only:p-2 xl-only:p-2 w-full sm-only:w-[48%] md-only:w-[48%] lg-only:w-[32%] xl-only:w-[32%] relative ${
        globalLoading
          ? "border-gray-300 cursor-not-allowed filter brightness-90"
          : loading
          ? "border-blue-400 bg-gradient-to-r from-blue-50 to-gray-100 animate-pulse cursor-wait shadow-md"
          : disabled
          ? "border-green-200 bg-green-50 cursor-not-allowed"
          : "border-gray-200 bg-white hover:bg-blue-50 active:bg-blue-100 cursor-pointer"
      }`}
    >
      <div
        className={`w-8 h-8 sm-only:w-9 sm-only:h-9 md-only:w-9 md-only:h-9 lg-only:w-10 lg-only:h-10 xl-only:w-10 xl-only:h-10 rounded-full overflow-hidden mr-2 flex-shrink-0 ${
          globalLoading
            ? "border-2 border-gray-300 opacity-80"
            : loading
            ? "border-2 border-blue-500"
            : disabled
            ? "border-2 border-green-300"
            : "border-2 border-blue-200"
        }`}
      >
        <FotoPerfilClientSide
          Google_Drive_Foto_ID={personal.GoogleDriveFotoId}
        />
      </div>
      <div
        title={`${personal.Nombres} ${personal.Apellidos}`}
        className={`text-xs sm-only:text-sm md-only:text-sm lg-only:text-sm xl-only:text-sm font-medium truncate leading-tight ${
          globalLoading
            ? "text-gray-600"
            : loading
            ? "text-blue-700"
            : disabled
            ? "text-green-700"
            : ""
        }`}
      >
        {personal.Nombres} {personal.Apellidos}
        {personal.Cargo && (
          <div
            className={`italic text-xs ${
              globalLoading ? "text-gray-500" : "text-gris-oscuro"
            }`}
          >
            {personal.Cargo}
          </div>
        )}
      </div>

      {disabled && !loading && !globalLoading && (
        <div className="absolute right-2 top-2">
          <CheckCircle className="text-green-500 w-5 h-5" />
        </div>
      )}

      {loading && !globalLoading && (
        <div className="absolute right-2 top-2 flex items-center">
          <div className="mr-1 bg-blue-100 text-blue-800 text-xs font-semibold px-1.5 py-0.5 rounded">
            Cargando
          </div>
          <Loader2 className="text-blue-600 w-5 h-5 animate-spin" />
        </div>
      )}

      {globalLoading && (
        <div className="absolute right-2 top-2">
          <Loader2 className="text-gray-500 w-4 h-4 animate-spin" />
        </div>
      )}
    </div>
  );
};

export default ItemTomaAsistencia;
