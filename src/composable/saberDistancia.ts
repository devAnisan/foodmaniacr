import { useLocationStore } from "../stores/cartStores";

interface Insucursal {
    Direccion: string,
    Nombre: string,
    Whatsapp_Api: string,
    foto_local: string,
    horario: string,
    lat: string,
    lng: string,
    maps: string,
    nCelular: string,
    sinpe: string,
    aNombre: string
}
export const calcularTarifaEnvio = (distanciaKm: number): number => {
  if (distanciaKm <= 0) return 0
  if (distanciaKm <= 1.5) return 1000
  if (distanciaKm <= 2) return 1300
  if (distanciaKm <= 2.5) return 1500
  if (distanciaKm <= 3) return 1800
  if (distanciaKm <= 4) return 2000
  if (distanciaKm <= 5) return 2200
  if (distanciaKm <= 6) return 2300
  if (distanciaKm <= 7) return 2500
  if (distanciaKm <= 8) return 2700
  if (distanciaKm <= 9) return 3000
  if (distanciaKm <= 10) return 3500
  return Math.round(distanciaKm * 350)
}

export const descripcionTarifaEnvio = (distanciaKm: number): string => {
  if (distanciaKm <= 0) return ''
  if (distanciaKm <= 1.5) return '0–1.5 km'
  if (distanciaKm <= 2) return '1.5–2 km'
  if (distanciaKm <= 2.5) return '2–2.5 km'
  if (distanciaKm <= 3) return '2.5–3 km'
  if (distanciaKm <= 4) return '3–4 km'
  if (distanciaKm <= 5) return '4–5 km'
  if (distanciaKm <= 6) return '5–6 km'
  if (distanciaKm <= 7) return '6–7 km'
  if (distanciaKm <= 8) return '7–8 km'
  if (distanciaKm <= 9) return '8–9 km'
  if (distanciaKm <= 10) return '9–10 km'
  return `${distanciaKm} km — tarifa larga distancia`
}

// Haversine formula to calculate distance between two points
export const calcDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};


const findNearBranch = (lat: number, lng: number, sucursales: Insucursal[]) => {
    const locationStore = useLocationStore()
    let minDistance = Infinity;

    for (let i = 0; i < sucursales.length; i++) {
        const branch = sucursales[i]
        const distance = calcDistance(lat, lng, parseFloat(branch.lat), parseFloat(branch.lng))
        if (distance < minDistance) {
            minDistance = distance;
            locationStore.sucursalCercana = branch.Nombre;
            locationStore.distancia = distance.toFixed(2);
        }
    }
}


// and get user's current location

export const getLocation = (sucursales: Insucursal[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                findNearBranch(lat, lng, sucursales);
                resolve();
            },
            (error) => {
                console.error("Error getting geolocation:", error);
                reject(error);
            },
        );
    });
};
