import AllErrorTypes from "./errors";
import { ErrorDetails } from "./errors/details";

export interface MessageProperty {
  message: string;
}

/**
 * Base para todas las respuestas de la API
 */
export interface ApiResponseBase extends MessageProperty {
  success: boolean;
}

export interface SuccessResponseAPIBase extends ApiResponseBase {
  success: true;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

export interface ErrorResponseAPIBase extends ApiResponseBase {
  message: string;
  success: false;
  details?: ErrorDetails;
  errorType?: AllErrorTypes;
  conflictField?: string;
}
