import { ColorHexadecimal } from "@/interfaces/Colors";

/**
 * Genera un color aleatorio con alto contraste respecto al color base
 * @param baseColor - Color base en formato hexadecimal
 * @param contrastRatio - Ratio de contraste mínimo deseado (por defecto 4.5, estándar WCAG AA)
 * @returns Un color hexadecimal con alto contraste
 */
export function getRandomContrastColor(
  baseColor: ColorHexadecimal,
  contrastRatio: number = 4.5
): ColorHexadecimal {
  // Convertir hex a RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 2), 16) || r;
    const b = parseInt(cleanHex.substring(4, 2), 16) || r;
    return { r, g, b };
  };

  // Convertir RGB a valores lineales (para cálculo de luminancia)
  const toLinear = (channel: number): number => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  // Calcular luminancia según WCAG
  const getLuminance = (color: string): number => {
    const rgb = hexToRgb(color);
    const r = toLinear(rgb.r);
    const g = toLinear(rgb.g);
    const b = toLinear(rgb.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  // Calcular ratio de contraste entre dos colores
  const calculateContrastRatio = (color1: string, color2: string): number => {
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  };

  // Generar un color RGB aleatorio
  const getRandomColor = (): string => {
    const randomChannel = () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, "0");
    return `#${randomChannel()}${randomChannel()}${randomChannel()}`;
  };

  // Luminancia del color base
  const baseLuminance = getLuminance(baseColor);

  // Determinar si necesitamos un color más claro o más oscuro
  const needsDarker = baseLuminance > 0.5;

  // Intentar encontrar un color con el contraste adecuado
  let attempts = 0;
  let candidateColor: string = "";
  let currentContrast = 0;

  // Generamos hasta 50 intentos aleatorios
  while (attempts < 50 && currentContrast < contrastRatio) {
    candidateColor = getRandomColor();

    // Si necesitamos un color más oscuro y el candidato es más claro (o viceversa),
    // ajustamos el candidato
    const candidateLuminance = getLuminance(candidateColor);

    if (
      (needsDarker && candidateLuminance > baseLuminance) ||
      (!needsDarker && candidateLuminance < baseLuminance)
    ) {
      const rgb = hexToRgb(candidateColor);
      // Invertimos el color para asegurar que va en la dirección correcta
      const invertedR = Math.abs(255 - rgb.r);
      const invertedG = Math.abs(255 - rgb.g);
      const invertedB = Math.abs(255 - rgb.b);

      candidateColor = `#${invertedR.toString(16).padStart(2, "0")}${invertedG
        .toString(16)
        .padStart(2, "0")}${invertedB.toString(16).padStart(2, "0")}`;
    }

    currentContrast = calculateContrastRatio(baseColor, candidateColor);
    attempts++;
  }

  // Si no encontramos un color con suficiente contraste, generamos uno garantizado
  if (currentContrast < contrastRatio) {
    // Generamos un color en el extremo opuesto de la luminancia
    if (needsDarker) {
      // Si el base es claro, generamos uno oscuro
      const darkness = Math.floor(Math.random() * 64); // 0-63 para que sea realmente oscuro
      const r = darkness.toString(16).padStart(2, "0");
      const g = darkness.toString(16).padStart(2, "0");
      const b = darkness.toString(16).padStart(2, "0");
      candidateColor = `#${r}${g}${b}`;
    } else {
      // Si el base es oscuro, generamos uno claro
      const lightness = 192 + Math.floor(Math.random() * 64); // 192-255 para que sea realmente claro
      const r = lightness.toString(16).padStart(2, "0");
      const g = lightness.toString(16).padStart(2, "0");
      const b = lightness.toString(16).padStart(2, "0");
      candidateColor = `#${r}${g}${b}`;
    }
  }

  return candidateColor as ColorHexadecimal;
}

/**
 * Genera múltiples colores de contraste aleatorios
 * @param baseColor - Color base
 * @param count - Número de colores a generar
 * @param contrastRatio - Ratio de contraste mínimo
 * @returns Array de colores hexadecimales con alto contraste
 */
export function getMultipleContrastColors(
  baseColor: ColorHexadecimal,
  count: number = 5,
  contrastRatio: number = 4.5
): ColorHexadecimal[] {
  const colors: ColorHexadecimal[] = [];

  for (let i = 0; i < count; i++) {
    colors.push(getRandomContrastColor(baseColor, contrastRatio));
  }

  return colors;
}
