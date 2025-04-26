import { ErrorDetailsForLogout } from "@/interfaces/LogoutTypes";

/**
 * Formatea los detalles de error para ser incluidos como query parameter
 * @param details Detalles del error para incluir en la URL de logout
 * @returns String codificado para usar como query parameter
 */
export const formatErrorDetailsForUrl = (
  details: ErrorDetailsForLogout
): string => {
  // Convertir el objeto a string y codificarlo para URL
  return encodeURIComponent(JSON.stringify(details));
};
