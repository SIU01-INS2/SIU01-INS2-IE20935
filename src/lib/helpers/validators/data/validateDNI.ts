import { ValidationErrorTypes } from "../../../../interfaces/shared/apis/errors";
import { ValidationResult } from "./types";

/**
 * Valida un DNI peruano
 * @param value - Valor a validar
 * @param required - Indica si el campo es obligatorio
 * @returns Resultado de la validación
 */
export function validateDNI(value: any, required: boolean): ValidationResult {
    if ((value === undefined || value === null) && required) {
      return {
        isValid: false,
        errorType: ValidationErrorTypes.FIELD_REQUIRED,
        errorMessage: "El DNI es requerido"
      };
    }
    
    if (value === undefined || value === null) {
      return { isValid: true };
    }
    
    if (typeof value !== 'string') {
      return {
        isValid: false,
        errorType: ValidationErrorTypes.INVALID_FORMAT,
        errorMessage: "El DNI debe ser una cadena de texto"
      };
    }
    
    const dniRegex = /^\d{8}$/;
    if (!dniRegex.test(value)) {
      return {
        isValid: false,
        errorType: ValidationErrorTypes.INVALID_DNI,
        errorMessage: "El DNI debe contener exactamente 8 dígitos numéricos"
      };
    }
    
    return { isValid: true };
  }
  