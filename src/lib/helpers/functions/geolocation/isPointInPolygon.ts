
import { PuntoGeografico } from "@/interfaces/Geolocalizacion";

/**
 * Determina si un punto está dentro de un polígono usando el algoritmo de ray casting.
 */
export function isPointInPolygon(
  point: PuntoGeografico,
  polygon: PuntoGeografico[]
): boolean {
  const x = point.longitud; // Longitud como x
  const y = point.latitud; // latitud como y
  const n = polygon.length;
  let inside = false;

  let p1x = polygon[0].longitud;
  let p1y = polygon[0].latitud;

  for (let i = 0; i <= n; i++) {
    const p2x = polygon[i % n].longitud;
    const p2y = polygon[i % n].latitud;

    // Verificamos si el punto está sobre un vértice o borde
    if ((x === p1x && y === p1y) || (x === p2x && y === p2y)) {
      return true;
    }

    // Verificamos si está en un borde horizontal
    if (p1y === p2y && y === p1y) {
      if (Math.min(p1x, p2x) <= x && x <= Math.max(p1x, p2x)) {
        return true;
      }
    }

    // Verificamos si el rayo cruza este borde
    if (
      y > Math.min(p1y, p2y) &&
      y <= Math.max(p1y, p2y) &&
      x <= Math.max(p1x, p2x)
    ) {
      if (p1y !== p2y) {
        const xIntersect = ((y - p1y) * (p2x - p1x)) / (p2y - p1y) + p1x;
        if (p1x === p2x || x <= xIntersect) {
          inside = !inside;
        }
      }
    }

    p1x = p2x;
    p1y = p2y;
  }

  return inside;
}

