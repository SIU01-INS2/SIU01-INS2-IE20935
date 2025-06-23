import { RolesTextos } from "@/Assets/RolesTextos";
import { useDelegacionEventos } from "@/hooks/useDelegacionDeEventos";
import useRequestAPIFeatures from "@/hooks/useRequestSiasisAPIFeatures";
import { GetGenericUsersSuccessResponse } from "@/interfaces/shared/apis/api01/usuarios-genericos/types";
import { GenericUser } from "@/interfaces/shared/GenericUser";
import { Genero } from "@/interfaces/shared/Genero";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { SiasisAPIS } from "@/interfaces/shared/SiasisComponents";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Loader from "../shared/loaders/Loader";
import { Search, Users, AlertCircle, ChevronDown } from "lucide-react";
import FotoPerfilClientSide from "../utils/photos/FotoPerfilClientSide";

interface SiasisUserSelectorProps {
  rolUsuariosABuscar?: RolesSistema;
  siasisAPI: SiasisAPIS;
  setUsuarioSeleccionado: Dispatch<SetStateAction<GenericUser | undefined>>;
  usuarioSeleccionado: GenericUser | undefined;
  ID_SELECTOR_USUARIO_GENERICO_HTML: string;
  disabled?: boolean;
}

const UsuarioGenericoEncontrado = ({
  usuarioGenerico,
  handleUsuarioSeleccionado,
}: {
  usuarioGenerico: GenericUser;
  handleUsuarioSeleccionado: (usuarioSeleccionado: GenericUser) => void;
}) => {
  return (
    <li
      className="px-3 py-2.5 text-sm text-gray-700 select-none cursor-pointer transition-all duration-200 
                 hover:bg-blue-50 hover:text-blue-700 hover:border-l-4 hover:border-blue-500
                 border-b border-gray-100 last:border-b-0 group"
      onClick={() => {
        handleUsuarioSeleccionado(usuarioGenerico);
      }}
    >
      <div className="flex items-center space-x-2.5">
        <FotoPerfilClientSide
          Google_Drive_Foto_ID={usuarioGenerico.Google_Drive_Foto_ID}
          className="w-8 h-8 shadow-none"
        />

        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 group-hover:text-blue-700 truncate text-sm">
              {usuarioGenerico.Nombres} {usuarioGenerico.Apellidos}
            </span>
            <span className="text-xs text-gray-500 group-hover:text-blue-500">
              DNI:{" "}
              {usuarioGenerico.ID_O_DNI_Usuario.length === 8
                ? usuarioGenerico.ID_O_DNI_Usuario
                : usuarioGenerico.DNI_Directivo}
            </span>
          </div>
        </div>

        {/* Icono de selección */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </li>
  );
};

const LIMITE_USUARIOS_GENERICOS_A_TRAER = 5;

const SiasisUserSelector = ({
  rolUsuariosABuscar,
  siasisAPI,
  ID_SELECTOR_USUARIO_GENERICO_HTML,
  setUsuarioSeleccionado,
  usuarioSeleccionado,
  disabled = false,
}: SiasisUserSelectorProps) => {
  const {
    error,
    fetchSiasisAPI,
    isSomethingLoading,
    setError,
    cancelAllRequests,
    setIsSomethingLoading,
  } = useRequestAPIFeatures(siasisAPI);

  const [usuariosGenericosObtenidos, setUsuariosGenericosObtenidos] = useState<
    GenericUser[]
  >([]);
  const [estaDesplegado, setEstaDesplegado] = useState(false);
  const [criterioDeBusqueda, setCriterioDeBusqueda] = useState<string>("");

  const { delegarEvento } = useDelegacionEventos();

  // Función segura para establecer usuarios obtenidos
  const setUsuariosSeguro = (usuarios: GenericUser[] | undefined | null) => {
    setUsuariosGenericosObtenidos(Array.isArray(usuarios) ? usuarios : []);
  };

  const fetchUsuariosGenericos = async () => {
    try {
      setIsSomethingLoading(true);
      setError(null);

      if (
        criterioDeBusqueda.trim().length > 0 &&
        criterioDeBusqueda.trim().length < 2
      ) {
        setError({
          success: false,
          message: "El criterio de búsqueda debe tener al menos 2 caracteres",
        });
        setUsuariosSeguro([]);
        setIsSomethingLoading(false);
        return;
      }

      const fetchCancellable = await fetchSiasisAPI({
        endpoint: "/api/usuarios-genericos",
        method: "GET",
        queryParams: {
          Rol: rolUsuariosABuscar!,
          Criterio: criterioDeBusqueda.trim() || "",
          Limite: LIMITE_USUARIOS_GENERICOS_A_TRAER,
        },
      });

      if (!fetchCancellable) throw new Error("No se pudo crear la petición");

      const res = await fetchCancellable.fetch();

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error en la petición");
      }

      const { data: usuariosGenericosEncontrados } =
        (await res.json()) as GetGenericUsersSuccessResponse;

      setUsuariosSeguro(usuariosGenericosEncontrados);
      setIsSomethingLoading(false);
    } catch (e) {
      setUsuariosSeguro([]);
      if (e instanceof Error) {
        setError({
          success: false,
          message: e.message,
        });
      } else {
        setError({
          success: false,
          message: "Error inesperado al buscar usuarios",
        });
      }
      setIsSomethingLoading(false);
    }
  };

  useEffect(() => {
    if (!delegarEvento) return;

    delegarEvento(
      "mousedown",
      `#${ID_SELECTOR_USUARIO_GENERICO_HTML}, #${ID_SELECTOR_USUARIO_GENERICO_HTML} *, #${ID_SELECTOR_USUARIO_GENERICO_HTML}-buscador, #${ID_SELECTOR_USUARIO_GENERICO_HTML}-buscador *, #${ID_SELECTOR_USUARIO_GENERICO_HTML}-users-founded-list, #${ID_SELECTOR_USUARIO_GENERICO_HTML}-users-founded-list *`,
      () => {
        setEstaDesplegado(false);
      },
      true
    );
  }, [delegarEvento]);

  // Determinar si el componente está deshabilitado
  const estaDeshabilitado = disabled || !rolUsuariosABuscar;

  useEffect(() => {
    if (!estaDesplegado || estaDeshabilitado) {
      cancelAllRequests();
      setUsuariosSeguro(usuariosGenericosObtenidos);
      return;
    }

    fetchUsuariosGenericos();
  }, [
    rolUsuariosABuscar,
    criterioDeBusqueda,
    estaDesplegado,
    estaDeshabilitado,
  ]);

  const handleUsuarioSeleccionado = (usuarioSeleccionado: GenericUser) => {
    setUsuarioSeleccionado(usuarioSeleccionado);
    setEstaDesplegado(false);
    setCriterioDeBusqueda("");
  };

  const DENOMINACION_USUARIOS = rolUsuariosABuscar
    ? RolesTextos[rolUsuariosABuscar]["desktop"][Genero.Masculino]
    : "Usuario";

  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-gray-700 mb-1">
        Seleccionar {DENOMINACION_USUARIOS}
      </label>

      <div className="relative w-full">
        {/* Selector principal */}
        <div
          className={`w-full px-3 py-2.5 border-2 rounded-lg cursor-pointer transition-all duration-200
                      bg-white min-h-[3rem] flex items-center justify-between shadow-sm
                      ${
                        estaDeshabilitado
                          ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                          : estaDesplegado
                          ? "border-blue-500 ring-2 ring-blue-100 shadow-md"
                          : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                      }`}
          id={ID_SELECTOR_USUARIO_GENERICO_HTML}
          onClick={() => {
            if (!estaDeshabilitado) {
              setEstaDesplegado((state) => !state);
            }
          }}
        >
          <div className="flex-1 min-w-0">
            {!rolUsuariosABuscar ? (
              // Estado: No hay rol seleccionado
              <div className="flex items-center space-x-2.5">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-sm font-medium text-amber-600 block truncate">
                    Selecciona un rol primero
                  </span>
                  <p className="text-xs text-amber-500 truncate">
                    Debes elegir un rol antes de seleccionar un usuario
                  </p>
                </div>
              </div>
            ) : usuarioSeleccionado ? (
              // Estado: Usuario seleccionado
              <div className="flex items-center space-x-2.5">
                <FotoPerfilClientSide
                  Google_Drive_Foto_ID={
                    usuarioSeleccionado.Google_Drive_Foto_ID
                  }
                  className="border-1 border-[rgba(0,0,0,0.2)] w-9 shadow-none flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-900 block truncate">
                    {usuarioSeleccionado.Nombres}{" "}
                    {usuarioSeleccionado.Apellidos}
                  </span>
                  <span className="text-xs text-gray-500 block truncate">
                    DNI:{" "}
                    {usuarioSeleccionado.DNI_Directivo ??
                      usuarioSeleccionado.ID_O_DNI_Usuario}
                  </span>
                </div>
              </div>
            ) : (
              // Estado: Rol seleccionado pero sin usuario
              <div className="flex items-center space-x-2.5">
                <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-sm font-medium text-gray-600 block truncate">
                    Seleccionar {DENOMINACION_USUARIOS}
                  </span>
                  <p className="text-xs text-gray-400 truncate">
                    Busca y selecciona un usuario
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Icono de flecha */}
          <div className="flex-shrink-0 ml-2">
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                estaDesplegado ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {/* Dropdown */}
        {estaDesplegado && rolUsuariosABuscar && (
          <div
            id={`${ID_SELECTOR_USUARIO_GENERICO_HTML}-dropdown`}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl 
                       max-h-80 overflow-hidden"
          >
            {/* Buscador mejorado */}
            <div
              id={`${ID_SELECTOR_USUARIO_GENERICO_HTML}-buscador`}
              className="p-3 border-b border-gray-100 bg-gray-200  rounded-t-lg"
            >
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gris-oscuro rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           placeholder-gray-400 transition-all duration-200 bg-white"
                  type="search"
                  placeholder={`Buscar ${DENOMINACION_USUARIOS.toLowerCase()}...`}
                  value={criterioDeBusqueda}
                  onChange={(e) => {
                    setCriterioDeBusqueda(e.target.value);
                  }}
                />
              </div>
            </div>

            {/* Resultados */}
            <div
              id={`${ID_SELECTOR_USUARIO_GENERICO_HTML}-users-founded-list`}
              className="overflow-y-auto max-h-64"
            >
              {!isSomethingLoading ? (
                <>
                  {(usuariosGenericosObtenidos?.length ?? 0) > 0 ? (
                    <ul>
                      {(usuariosGenericosObtenidos || []).map(
                        (usuarioGenerico) => (
                          <UsuarioGenericoEncontrado
                            handleUsuarioSeleccionado={
                              handleUsuarioSeleccionado
                            }
                            key={usuarioGenerico.ID_O_DNI_Usuario}
                            usuarioGenerico={usuarioGenerico}
                          />
                        )
                      )}
                    </ul>
                  ) : (
                    <div className="px-3 py-6 text-center">
                      <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm font-medium">
                        No se encontraron usuarios
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Intenta con otro criterio de búsqueda
                      </p>
                    </div>
                  )}

                  {/* Mensaje informativo */}
                  {!error && (usuariosGenericosObtenidos?.length ?? 0) > 0 && (
                    <div className="px-3 py-2 text-center bg-blue-50 border-t border-blue-100">
                      <p className="text-blue-600 text-xs">
                        💡 Si no encuentras al{" "}
                        {DENOMINACION_USUARIOS.toLowerCase()}, especifica más tu
                        búsqueda
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="px-3 py-3 text-center bg-red-50 border-t border-red-100">
                      <AlertCircle className="w-4 h-4 text-red-500 mx-auto mb-1" />
                      <p className="text-red-600 text-sm font-medium">
                        {error.message}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-6">
                  <Loader className="w-5 h-5 mr-2" />
                  <span className="text-gray-500 text-sm">
                    Buscando usuarios...
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SiasisUserSelector;
