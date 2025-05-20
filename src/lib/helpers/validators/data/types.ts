import { ValidationErrorTypes } from "../../../../interfaces/shared/apis/errors";

/**
 * Tipo para los resultados de validación
 */
export type ValidationResult = {
  isValid: boolean;
  errorType?: ValidationErrorTypes;
  errorMessage?: string;
};

/**
 * Tipo para los validadores configurados en el sistema
 */
export type ValidatorConfig = {
  field: string;
  validator: (value: any, required: boolean) => ValidationResult;
};
