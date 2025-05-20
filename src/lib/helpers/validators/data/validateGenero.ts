import { ValidationErrorTypes } from "../../../../interfaces/shared/apis/errors";
import { ValidationResult } from "./types";

/**
 * Valida el género (M o F)
 * @param value - Valor a validar
 * @param required - Indica si el campo es obligatorio
 * @returns Resultado de la validación
 */
export function validateGender(value: any, required: boolean): ValidationResult {
    if ((value === undefined || value === null) && required) {
      return {
        isValid: false,
        errorType: ValidationErrorTypes.FIELD_REQUIRED,
        errorMessage: "El género es requerido"
      };
    }
    
    if (value === undefined || value === null) {
      return { isValid: true };
    }
    
    if (typeof value !== 'string') {
      return {
        isValid: false,
        errorType: ValidationErrorTypes.INVALID_FORMAT,
        errorMessage: "El género debe ser una cadena de texto"
      };
    }
    
    if (value !== 'M' && value !== 'F') {
      return {
        isValid: false,
        errorType: ValidationErrorTypes.INVALID_GENDER,
        errorMessage: "El género debe ser 'M' para masculino o 'F' para femenino"
      };
    }
    
    return { isValid: true };
  }