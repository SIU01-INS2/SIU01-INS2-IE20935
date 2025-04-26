import { AuthBlockedDetails } from "./AuthBloquedDetails";

export type ErrorObjectGeneric = Record<string, unknown>;
export type ErrorDetails = AuthBlockedDetails | ErrorObjectGeneric; // Para otros tipos de errores con estructura desconocida
