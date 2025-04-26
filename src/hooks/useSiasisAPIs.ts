import { useState, useCallback } from "react";

import { QueryParams } from "@/interfaces/shared/CustomObjects";
import { MethodHTTP } from "@/interfaces/MethodsHTTP";
import getRandomAPI01IntanceURL from "@/lib/helpers/functions/getRandomAPI01InstanceURL";
import getRandomAPI02IntanceURL from "@/lib/helpers/functions/getRandomAPI02Instance";

import userStorage from "@/lib/utils/local/db/models/UserStorage";
import { logout } from "@/lib/helpers/logout";
import { FetchCancelable } from "@/lib/utils/FetchCancellable";
import { LogoutTypes } from "@/interfaces/LogoutTypes";
import { SiasisAPIS } from "@/interfaces/shared/SiasisComponents";
import getAPI01InstanceForRol from "@/lib/helpers/functions/getAPI01InstanceForRole";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";

interface FetchSiasisAPIs {
  endpoint: string;
  method: MethodHTTP;
  queryParams?: QueryParams;
  body?: BodyInit | string | null;
  JSONBody?: boolean;
  userAutheticated?: boolean;
}

/**
 * Este hook recibe 2 parametros, el primero es la api a usar
 * @param siasisAPI 
 * @param loggedUserRolForAPI01 
 * @returns 
 */
const useSiasisAPIs = (
  siasisAPI: SiasisAPIS,
  loggedUserRolForAPI01?: RolesSistema
) => {
  const urlAPI =
    siasisAPI === "API01"
      ? !loggedUserRolForAPI01
        ? getRandomAPI01IntanceURL
        : getAPI01InstanceForRol
      : getRandomAPI02IntanceURL;

  const [fetchCancelables, setFetchCancelables] = useState<FetchCancelable[]>(
    []
  );

  const fetchSiasisAPI = useCallback(
    async ({
      JSONBody = true,
      body = null,
      endpoint,
      method = "GET",
      queryParams,
      userAutheticated = true,
    }: FetchSiasisAPIs) => {
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
        `${urlAPI(loggedUserRolForAPI01!)}${endpoint}`,
        {
          method,
          headers,
          body,
        },
        queryParams
      );

      // Registrar la instancia para poder cancelarla posteriormente si es necesario
      setFetchCancelables((prev) => [...prev, fetchCancelable]);

      return fetchCancelable;
    },
    [urlAPI]
  );

  // Función para cancelar todas las peticiones pendientes
  const cancelAllRequests = useCallback(() => {
    fetchCancelables.forEach((fetchCancelable) => fetchCancelable.cancel());
    setFetchCancelables([]);
  }, [fetchCancelables]);

  return { fetchSiasisAPI, fetchCancelables, cancelAllRequests };
};

export default useSiasisAPIs;
