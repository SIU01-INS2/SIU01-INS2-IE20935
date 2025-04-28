import { RDP02 } from "../RDP02Instancias";
import { RDP03 } from "../RDP03Instancias";

// Interfaz para la carga útil del webhook
export interface EMCS01Payload {
  event_type: string;
  client_payload: {
    sql: string;
    params: any[];
    instanciasAActualizar: (RDP02 | RDP03)[];
    timestamp: number;
  };
}
