import { ValidationErrorTypes } from "../../../../interfaces/shared/apis/errors";
import { ValidationResult } from "./types";

/**
 * Valida un correo electrónico
 * @param value - Valor a validar
 * @param required - Indica si el campo es obligatorio
 * @returns Resultado de la validación
 */
export function validateEmail(value: any, required: boolean): ValidationResult {
  if ((value === undefined || value === null) && required) {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.FIELD_REQUIRED,
      errorMessage: "El correo electrónico es requerido",
    };
  }

  if (value === undefined || value === null) {
    return { isValid: true };
  }

  if (typeof value !== "string") {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.INVALID_FORMAT,
      errorMessage: "El correo electrónico debe ser una cadena de texto",
    };
  }

  // RFC 5322 compliant email regex
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(value)) {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.INVALID_EMAIL,
      errorMessage: "El formato del correo electrónico es inválido",
    };
  }

  if (value.length > 70) {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.STRING_TOO_LONG,
      errorMessage: "El correo electrónico no puede exceder los 70 caracteres",
    };
  }

  return { isValid: true };
}
