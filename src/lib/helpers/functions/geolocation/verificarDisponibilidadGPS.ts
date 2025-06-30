export const verificarDisponibilidadGPS = (): boolean => {
  return "geolocation" in navigator;
};
