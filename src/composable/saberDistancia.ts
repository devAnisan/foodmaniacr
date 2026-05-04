import { useLocationStore } from "../stores/carStores";

import { ref as vueRef } from "vue";
interface Insucursal {
    Direccion: string,
    Nombre: string,
    Whatsapp_Api: string,
    foto_local: string,
    horario: string,
    lat: string,
    lng: string,
    maps: string,
    nCelular: string
}
const sucursal = vueRef([])
// Haversine formula to calculate distance between two points
const calcDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
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


// find the nearest branch based on user's current location
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
    console.log(locationStore.sucursalCercana)
}


// and get user's current location

export const getLocation = (sucursales: Insucursal[]) => {

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            findNearBranch(lat, lng, sucursales);
            const local = useLocationStore()


            return false;
        },
        (error) => {
            console.error("Error getting geolocation:", error);
            return false;
        },
    );
};
