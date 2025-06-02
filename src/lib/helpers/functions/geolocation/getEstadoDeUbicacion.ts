
import { POLIGONO_DELIMITADOR } from "@/Assets/geolocation/POLIGONO_DELIMITADOR";
import { PuntoGeografico } from "@/interfaces/Geolocalizacion";
import { isPointInPolygon } from "./isPointInPolygon";


export function estaDentroDelColegioIE20935(
  punto: PuntoGeografico
): boolean {
  return isPointInPolygon(punto, POLIGONO_DELIMITADOR);
} 


