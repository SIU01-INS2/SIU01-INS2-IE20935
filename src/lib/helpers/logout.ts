import { LogoutTypes, ErrorDetailsForLogout } from "@/interfaces/LogoutTypes";
import userStorage from "../utils/local/db/models/UserStorage";
import { formatErrorDetailsForUrl } from "./parsers/errorDetailsInURL";

/**
 * Cierra la sesión del usuario y redirige a la página de login
 * @param logoutType Tipo de cierre de sesión
 * @param errorDetails Detalles adicionales del error para debugging
 */
export const logout = async (
  logoutType: LogoutTypes = LogoutTypes.DECISION_USUARIO,
  errorDetails?: ErrorDetailsForLogout
): Promise<void> => {
  try {
    // Intentar cerrar sesión en el servidor
    await fetch("/api/auth/close", { method: "DELETE" });

    // Limpiar almacenamiento local
    localStorage.clear();
    await userStorage.clearUserData();

    // Construir URL de redirección
    let redirectUrl = "/login";

    // Agregar parámetros si no es cierre voluntario
    if (logoutType !== LogoutTypes.DECISION_USUARIO) {
      redirectUrl += `?LOGOUT_TYPE=${logoutType}`;

      // Agregar detalles de error si están disponibles
      if (errorDetails) {
        redirectUrl += `&ERROR_DETAILS=${formatErrorDetailsForUrl(
          errorDetails
        )}`;
      }
    }

    // Redirigir al usuario
    window.location.href = redirectUrl;
  } catch (error) {
    console.error("Error durante el cierre de sesión:", error);

    // En caso de error en el proceso de cierre, forzar redirección
    window.location.href = `/login?LOGOUT_TYPE=${LogoutTypes.ERROR_SISTEMA}`;
  }
};
