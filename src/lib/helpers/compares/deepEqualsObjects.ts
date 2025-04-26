/**
 * Compara dos valores a profundidad para determinar si son iguales
 * @param obj1 - Primer valor para comparar
 * @param obj2 - Segundo valor para comparar
 * @returns Verdadero si los valores son iguales, falso en caso contrario
 */
export default function deepEqualsObjects<T>(obj1: T, obj2: T): boolean {
  // Comparar valores primitivos o si ambos son la misma referencia
  if (obj1 === obj2) {
    return true;
  }

  // Si alguno es null o undefined
  if (obj1 == null || obj2 == null) {
    return obj1 === obj2;
  }

  // Si no son objetos, y no son iguales (ya verificado arriba)
  if (typeof obj1 !== "object" || typeof obj2 !== "object") {
    return false;
  }

  // Manejar arrays
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      return false;
    }

    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqualsObjects(obj1[i], obj2[i])) {
        return false;
      }
    }

    return true;
  }

  // Si uno es array pero el otro no
  if (Array.isArray(obj1) !== Array.isArray(obj2)) {
    return false;
  }

  // Manejar fechas
  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime();
  }

  // Si uno es Date pero el otro no
  if (obj1 instanceof Date !== obj2 instanceof Date) {
    return false;
  }

  // Comparar objetos regulares
  const keys1 = Object.keys(obj1 as object);
  const keys2 = Object.keys(obj2 as object);

  if (keys1.length !== keys2.length) {
    return false;
  }

  // Verificar que todas las propiedades del primer objeto existan en el segundo
  // y que tengan el mismo valor
  return keys1.every((key) => {
    if (!Object.prototype.hasOwnProperty.call(obj2, key)) {
      return false;
    }
    return deepEqualsObjects(
      (obj1 as Record<string, unknown>)[key],
      (obj2 as Record<string, unknown>)[key]
    );
  });
}
