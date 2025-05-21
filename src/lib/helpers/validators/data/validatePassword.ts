import { ValidationErrorTypes } from "../../../../interfaces/shared/apis/errors";
import { ValidationResult } from "./types";

/**
 * Valida la contraseña actual (solo verifica longitud)
 * @param value - Valor a validar
 * @param required - Indica si el campo es obligatorio
 * @returns Resultado de la validación
 */
export function validateCurrentPassword(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  required: boolean
): ValidationResult {
  if ((value === undefined || value === null) && required) {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.FIELD_REQUIRED,
      errorMessage: "La contraseña actual es requerida",
    };
  }

  if (value === undefined || value === null) {
    return { isValid: true };
  }

  if (typeof value !== "string") {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.INVALID_FORMAT,
      errorMessage: "La contraseña actual debe ser una cadena de texto",
    };
  }

  // Solo validamos longitud para contraseña actual
  if (value.length < 8) {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.INVALID_FORMAT,
      errorMessage: "La contraseña actual debe tener al menos 8 caracteres",
    };
  }

  return { isValid: true };
}

/**
 * Valida una nueva contraseña con requisitos básicos
 * @param value - Valor a validar
 * @param required - Indica si el campo es obligatorio
 * @returns Resultado de la validación
 */
export function validatePassword(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  required: boolean
): ValidationResult {
  if ((value === undefined || value === null) && required) {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.FIELD_REQUIRED,
      errorMessage: "La contraseña es requerida",
    };
  }

  if (value === undefined || value === null) {
    return { isValid: true };
  }

  if (typeof value !== "string") {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.INVALID_FORMAT,
      errorMessage: "Las contraseñas deben ser una cadena de texto",
    };
  }

  // Validar longitud (entre 8 y 20 caracteres)
  if (value.length < 8 || value.length > 20) {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.INVALID_FORMAT,
      errorMessage: "Las contraseñas deben tener entre 8 y 20 caracteres",
    };
  }

  // Validar que contenga al menos una letra y un número (requisito mínimo)
  if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.INVALID_FORMAT,
      errorMessage:
        "Las contraseñas deben contener al menos una letra y un número",
    };
  }

  return { isValid: true };
}
