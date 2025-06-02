import { EstadoPermisos } from "@/interfaces/Geolocalizacion";

export interface ResultadoPermisos {
  estado: EstadoPermisos;
  mensaje: string;
  puedeReintentar: boolean;
}

/**
 * Servicio para verificar y gestionar permisos de geolocalización
 */
export class PermissionsService {
  /**
   * Verifica si la geolocalización está soportada en el navegador
   */
  static esSoportadaGeolocalizacion(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Verifica si la API de permisos está disponible
   */
  static esSoportadaAPIPermisos(): boolean {
    return 'permissions' in navigator;
  }

  /**
   * Obtiene el estado actual de los permisos de geolocalización
   */
  static async obtenerEstadoPermisos(): Promise<ResultadoPermisos> {
    try {
      // Verificar si la geolocalización está soportada
      if (!this.esSoportadaGeolocalizacion()) {
        return {
          estado: EstadoPermisos.NO_SOPORTADO,
          mensaje: 'La geolocalización no está soportada en este navegador',
          puedeReintentar: false
        };
      }

      // Si la API de permisos está disponible, usarla
      if (this.esSoportadaAPIPermisos()) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        
        switch (permission.state) {
          case 'granted':
            return {
              estado: EstadoPermisos.CONCEDIDO,
              mensaje: 'Permisos de ubicación concedidos',
              puedeReintentar: false
            };
            
          case 'denied':
            return {
              estado: EstadoPermisos.DENEGADO,
              mensaje: 'Permisos de ubicación denegados. Por favor, habilite la ubicación en la configuración del navegador.',
              puedeReintentar: true
            };
            
          case 'prompt':
            return {
              estado: EstadoPermisos.SOLICITADO,
              mensaje: 'Se solicitarán permisos de ubicación',
              puedeReintentar: true
            };
            
          default:
            return {
              estado: EstadoPermisos.NO_SOPORTADO,
              mensaje: 'Estado de permisos desconocido',
              puedeReintentar: true
            };
        }
      }

      // Si no hay API de permisos, retornamos que se puede solicitar
      return {
        estado: EstadoPermisos.SOLICITADO,
        mensaje: 'Los permisos se verificarán al intentar obtener la ubicación',
        puedeReintentar: true
      };

    } catch (error) {
      console.error('Error al verificar permisos de geolocalización:', error);
      return {
        estado: EstadoPermisos.NO_SOPORTADO,
        mensaje: 'Error al verificar permisos de ubicación',
        puedeReintentar: true
      };
    }
  }

  /**
   * Solicita permisos de geolocalización realizando una consulta de ubicación
   */
  static async solicitarPermisos(): Promise<ResultadoPermisos> {
    return new Promise((resolve) => {
      if (!this.esSoportadaGeolocalizacion()) {
        resolve({
          estado: EstadoPermisos.NO_SOPORTADO,
          mensaje: 'La geolocalización no está soportada en este dispositivo',
          puedeReintentar: false
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          // Éxito - permisos concedidos
          resolve({
            estado: EstadoPermisos.CONCEDIDO,
            mensaje: 'Permisos de ubicación concedidos correctamente',
            puedeReintentar: false
          });
        },
        (error) => {
          // Error - permisos denegados o error
          switch (error.code) {
            case 1: // PERMISSION_DENIED
              resolve({
                estado: EstadoPermisos.DENEGADO,
                mensaje: 'Permisos de ubicación denegados por el usuario',
                puedeReintentar: true
              });
              break;
              
            case 2: // POSITION_UNAVAILABLE
              resolve({
                estado: EstadoPermisos.CONCEDIDO, // Permisos OK, pero hay problema técnico
                mensaje: 'Ubicación no disponible temporalmente',
                puedeReintentar: true
              });
              break;
              
            case 3: // TIMEOUT
              resolve({
                estado: EstadoPermisos.CONCEDIDO, // Permisos OK, pero timeout
                mensaje: 'Tiempo de espera agotado al obtener ubicación',
                puedeReintentar: true
              });
              break;
              
            default:
              resolve({
                estado: EstadoPermisos.NO_SOPORTADO,
                mensaje: 'Error desconocido al solicitar permisos',
                puedeReintentar: true
              });
          }
        },
        {
          timeout: 10000, // 10 segundos de timeout
          enableHighAccuracy: false, // No requerir alta precisión para la verificación
          maximumAge: 60000 // Aceptar ubicación de hasta 1 minuto
        }
      );
    });
  }

  /**
   * Proporciona instrucciones para habilitar permisos según el navegador
   */
  static obtenerInstruccionesPermisos(): { titulo: string; pasos: string[] } {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      return {
        titulo: 'Habilitar ubicación en Chrome',
        pasos: [
          'Haga clic en el ícono de candado o información junto a la URL',
          'Seleccione "Ubicación" y cambie a "Permitir"',
          'Recargue la página'
        ]
      };
    } else if (userAgent.includes('firefox')) {
      return {
        titulo: 'Habilitar ubicación en Firefox',
        pasos: [
          'Haga clic en el ícono de escudo junto a la URL',
          'Seleccione "Ubicación" y elija "Permitir"',
          'Recargue la página'
        ]
      };
    } else if (userAgent.includes('safari')) {
      return {
        titulo: 'Habilitar ubicación en Safari',
        pasos: [
          'Vaya a Safari > Preferencias > Sitios web',
          'Seleccione "Ubicación" en la barra lateral',
          'Configure este sitio como "Permitir"'
        ]
      };
    } else {
      return {
        titulo: 'Habilitar ubicación en el navegador',
        pasos: [
          'Busque el ícono de ubicación en la barra de direcciones',
          'Haga clic y seleccione "Permitir"',
          'Recargue la página si es necesario'
        ]
      };
    }
  }
}