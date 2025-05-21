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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validator: (value: any, required: boolean) => ValidationResult;
};
