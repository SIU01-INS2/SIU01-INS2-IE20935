import { ValidationErrorTypes } from "../../../../interfaces/shared/apis/errors";
import { ValidationResult } from "./types";

/**
 * Valida apellidos
 * @param value - Valor a validar
 * @param required - Indica si el campo es obligatorio
 * @returns Resultado de la validación
 */
export function validateLastNames(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  required: boolean
): ValidationResult {
  if ((value === undefined || value === null) && required) {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.FIELD_REQUIRED,
      errorMessage: "El campo Apellidos es requerido",
    };
  }

  if (value === undefined || value === null) {
    return { isValid: true };
  }

  if (typeof value !== "string") {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.INVALID_FORMAT,
      errorMessage: "El campo Apellidos debe ser una cadena de texto",
    };
  }

  // Permite letras, espacios, apóstrofes y guiones (para apellidos compuestos)
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]{2,60}$/;
  if (!nameRegex.test(value)) {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.INVALID_LASTNAME,
      errorMessage:
        "El campo Apellidos debe tener entre 2 y 60 caracteres y solo puede contener letras, espacios, apóstrofes y guiones",
    };
  }

  return { isValid: true };
}
