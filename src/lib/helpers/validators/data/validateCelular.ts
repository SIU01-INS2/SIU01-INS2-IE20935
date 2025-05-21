import { ValidationErrorTypes } from "../../../../interfaces/shared/apis/errors";
import { ValidationResult } from "./types";

/**
 * Valida un número de celular peruano
 * @param value - Valor a validar
 * @param required - Indica si el campo es obligatorio
 * @returns Resultado de la validación
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validatePhone(value: any, required: boolean): ValidationResult {
  if ((value === undefined || value === null) && required) {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.FIELD_REQUIRED,
      errorMessage: "El número de celular es requerido",
    };
  }

  if (value === undefined || value === null) {
    return { isValid: true };
  }

  if (typeof value !== "string") {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.INVALID_FORMAT,
      errorMessage: "El número de celular debe ser una cadena de texto",
    };
  }

  // Validar formato de celular peruano (9 dígitos comenzando con 9)
  const phoneRegex = /^9\d{8}$/;
  if (!phoneRegex.test(value)) {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.INVALID_PHONE,
      errorMessage:
        "El número de celular debe comenzar con 9 y tener 9 dígitos en total",
    };
  }

  return { isValid: true };
}
