import { QueryParams } from "@/interfaces/shared/CustomObjects";
import { MethodHTTP } from "@/interfaces/MethodsHTTP";
import getRandomAPI01IntanceURL from "@/lib/helpers/functions/getRandomAPI01InstanceURL";
import getRandomAPI02IntanceURL from "@/lib/helpers/functions/getRandomAPI02Instance";
import userStorage from "@/lib/utils/local/db/models/UserStorage";
import { logout } from "@/lib/helpers/logout";
import { FetchCancelable } from "@/lib/utils/FetchCancellable";
import { LogoutTypes } from "@/interfaces/LogoutTypes";
import { SiasisAPIS } from "@/interfaces/shared/SiasisComponents";

interface FetchSiasisAPIs {
  endpoint: string;
  method: MethodHTTP;
  queryParams?: QueryParams;
  body?: BodyInit | string | null;
  JSONBody?: boolean;
  userAutheticated?: boolean;
}

interface FetchSiasisResult {
  fetchSiasisAPI: (config: FetchSiasisAPIs) => Promise<FetchCancelable | undefined>;
  fetchCancelables: FetchCancelable[];
  cancelAllRequests: () => void;
}

/**
 * Genera funciones para realizar peticiones a las APIs del sistema
 * @param siasisAPI API a la que se realizarán las peticiones (API01 o API02)
 * @returns Objeto con funciones para realizar peticiones y gestionar cancelaciones
 */
const fetchSiasisApiGenerator = (siasisAPI: SiasisAPIS): FetchSiasisResult => {
  const urlAPI =
    siasisAPI === "API01" ? getRandomAPI01IntanceURL : getRandomAPI02IntanceURL;

  // Almacenamos las peticiones cancelables en una variable local
  let fetchCancelables: FetchCancelable[] = [];

  /**
   * Realiza una petición a la API correspondiente
   */
  const fetchSiasisAPI = async ({
    JSONBody = true,
    body = null,
    endpoint,
    method = "GET",
    queryParams,
    userAutheticated = true,
  }: FetchSiasisAPIs): Promise<FetchCancelable | undefined> => {
    // Obtener token de manera asíncrona si el usuario debe estar autenticado
    let token: string | null = null;

    if (userAutheticated) {
      try {
        token = await userStorage.getAuthToken();

        // Si se requiere autenticación pero no hay token, hacer logout
        if (!token) {
          logout(LogoutTypes.SESION_EXPIRADA);
          return;
        }
      } catch (error) {
        console.error("Error al obtener el token:", error);
        logout(LogoutTypes.ERROR_SISTEMA);
        return;
      }
    }

    // Preparar headers
    const headers: Record<string, string> = {};

    if (JSONBody) {
      headers["Content-Type"] = "application/json";
    }

    if (token && userAutheticated) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Crear la instancia FetchCancelable
    const fetchCancelable = new FetchCancelable(
      `${urlAPI()}${endpoint}`,
      {
        method,
        headers,
        body,
      },
      queryParams
    );

    // Registrar la instancia para poder cancelarla posteriormente si es necesario
    fetchCancelables.push(fetchCancelable);

    return fetchCancelable;
  };

  /**
   * Cancela todas las peticiones pendientes
   */
  const cancelAllRequests = () => {
    fetchCancelables.forEach((fetchCancelable) => fetchCancelable.cancel());
    fetchCancelables = [];
  };

  return { fetchSiasisAPI, fetchCancelables, cancelAllRequests };
};

export default fetchSiasisApiGenerator;