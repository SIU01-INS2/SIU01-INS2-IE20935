import { ValidationErrorTypes } from "../../../../interfaces/shared/apis/errors";
import { ValidationResult } from "./types";

/**
 * Valida nombres
 * @param value - Valor a validar
 * @param required - Indica si el campo es obligatorio
 * @returns Resultado de la validación
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateNames(value: any, required: boolean): ValidationResult {
  if ((value === undefined || value === null) && required) {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.FIELD_REQUIRED,
      errorMessage: "El campo Nombres es requerido",
    };
  }

  if (value === undefined || value === null) {
    return { isValid: true };
  }

  if (typeof value !== "string") {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.INVALID_FORMAT,
      errorMessage: "El campo Nombres debe ser una cadena de texto",
    };
  }

  // Permite letras, espacios, apóstrofes y guiones (para nombres compuestos)
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]{2,60}$/;
  if (!nameRegex.test(value)) {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.INVALID_NAME,
      errorMessage:
        "El campo Nombres debe tener entre 2 y 60 caracteres y solo puede contener letras, espacios, apóstrofes y guiones",
    };
  }

  return { isValid: true };
}
