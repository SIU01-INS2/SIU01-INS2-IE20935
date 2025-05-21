import { ValidationErrorTypes } from "../../../../interfaces/shared/apis/errors";
import { ValidationResult, ValidatorConfig } from "./types";

/**
 * Validador que agrupa múltiples validaciones
 * @param data - Datos a validar
 * @param validators - Array de configuraciones de validadores
 * @returns Resultado de la validación
 */
export function validateData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>,
  validators: ValidatorConfig[]
): ValidationResult {
  if (!data || typeof data !== "object") {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.INVALID_FORMAT,
      errorMessage: "Se esperaba un objeto con datos para validar",
    };
  }

  // Validamos cada campo según corresponda
  for (const { field, validator } of validators) {
    // Determinar si el campo está presente en los datos
    const value = data[field];
    const required = Object.keys(data).includes(field);

    // Validar el campo
    const result = validator(value, required);
    if (!result.isValid) {
      return {
        isValid: false,
        errorType: result.errorType,
        errorMessage: result.errorMessage,
      };
    }
  }

  return { isValid: true };
}
