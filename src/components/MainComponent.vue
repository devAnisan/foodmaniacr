<template>
    <section v-if="loader" class="flex fontColor items-center justify-center h-screen">
        <span class="material-symbols-outlined animate-spin">
            progress_activity
        </span>
    </section>
    <!-- Pantallas pequenas -->
    <header v-else class="fixed top-0 left-0 right-0 z-50 bg-white fontColor">
        <nav class="flex md:hidden items-center justify-between p-4 shadow-sm">
            <section class="flex items-center space-x-2 hover:cursor-pointer">
                <img class="w-16" :src="imageUrl" alt="Foodmania Logo" />
            </section>
            <section>
                <span class="material-symbols-outlined hover:cursor-pointer" @click="menuOpen = !menuOpen">
                    menu
                </span>
            </section>
        </nav>
        <Dropmenu class="z-50" v-show="menuOpen" />
        <!-- Pantallas medianas -->
        <nav class="hidden md:flex items-center justify-between p-4 shadow-sm">
            <section class="flex items-center space-x-2 hover:cursor-pointer">
                <img class="w-24" :src="imageUrl" alt="Foodmania Logo" />
            </section>
            <section>
                <ul class="flex space-x-6">
                    <li><a href="#">Inicio</a></li>
                    <li><a href="#menu">Menú</a></li>
                    <li><a href="#sucursales">Sucursales</a></li>
                    <li><a href="#dondeComprar">¿Dónde comprar?</a></li>
                </ul>
            </section>
            <section class="hover:cursor-pointer">
                <button id="extrabold"  class="border my-0.5 p-2 pl-3 pr-3 rounded-full hover:cursor-pointer">
                    <RouterLink to="/menu" target="_blank">Ordena aquí</RouterLink>
                </button>
            </section>
        </nav>
    </header>

    <body v-if="!loader" @click="menuOpen = false" class="fontColor pt-32">
        <div>
            <HeroCarousel />
            <section id="sucursales">
                <BranchSection />
            </section>
            <br />

            <div class="text-center px-4">
                <div>
                    <h1 id="extrabold" class="text-4xl my-8 p-1">
                        ¿Dónde comprar tu <span class="title"> antojo</span> ?
                    </h1>
                </div>
                <p class="text-lg w-full md:w-2/3 mx-auto">
                    Te ofrecemos varias opciones para que puedas disfrutar de nuestros
                    productos. Puedes encontrarnos en los siguientes puntos de venta:
                </p>
            </div>
            <section class="flex justify-center my-8 px-2">
                <button @click="getLocations()"
                    class="flex justify-center items-center shadow-lg p-2 px-4 rounded-full hover:cursor-pointer">
                    <span id="dondeComprar" class="text-lg">
                        Conocer mi sucursal más cercana 📍
                    </span>
                </button>
            </section>

            <section class="flex flex-col justify-center my-8 px-2 items-center" v-show="branchSectionShow">
                <section v-if="loaderBranchSection" class="flex items-center justify-center w-32">
                    <section class="fontColor text-2xl animate-spin text-center">
                        <span class="pi pi-spinner"></span>
                    </section>
                </section>

                <section v-else class="p-2 text-center text-lg">
                    <h1 class="text-center">
                        Tu sucursal más cercana es:
                        <span id="extrabold">{{ locationStore.sucursalCercana }}</span>
                        la cual esta a
                        <span id="extrabold">{{ locationStore.distancia }}</span>
                        km de ti.
                    </h1>
                </section>
                <WhereBuySection :sucursal="nearestBranch" />
            </section>
        </div>
        <section id="menu">
            <div class="text-center px-4">
                <h1 id="extrabold" class="text-4xl my-8 p-1">Menú</h1>
                <div class="flex justify-center p-4">
                    <img :src="imageUrlMenu" alt="Menú de Foodmania" />
                </div>
            </div>
            <div class="text-3xl text-center w-full md:w-2/3 mx-auto mb-8 px-4">
                <p>
                    ¿Estas listo para probar el mejor sabor de tu vida? ¡Ordena ahora y
                    disfruta de una experiencia culinaria única con Foodmania!
                </p>
                <button id="extrabold" class="border my-0.5 p-2 pl-3 pr-3 rounded-full hover:cursor-pointer">
                    <RouterLink to="/menu" target="_blank">Ordena aquí</RouterLink>
                </button>
            </div>
        </section>
        <Footer />
    </body>
</template>
<script setup>
import { ref as vueRef, onMounted, watch, toRaw } from "vue";
import { ref as storageRef, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase.js";
import HeroCarousel from "./HeroCarousel.vue";
import Dropmenu from "../composable/Dropmenu.vue";
import BranchSection from "./BranchSection.vue";
import WhereBuySection from "./WhereBuySection.vue";
import Footer from "./Footer.vue";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase.js";
import { useCartStore, useLocationStore, useSucursales } from "../stores/carStores.js";
import { getLocation } from "../composable/saberDistancia.js";
const locationStore = useLocationStore()
const sucursalesStore = useSucursales()
const sucursales = vueRef([]);
const loaderBranchSection = vueRef(true);
const menuOpen = vueRef(false);
const imageUrl = vueRef("");
const imageUrlMenu = vueRef("");
const loader = vueRef(true);
const nearestBranch = vueRef(null);
const branchSectionShow = vueRef(false);
const distance = vueRef()
const nombreSucursalMasCercana = vueRef()

const getLocations = () => {
    branchSectionShow.value = true
    const resultado = getLocation(toRaw(sucursales.value))
    setTimeout(() => {
        loaderBranchSection.value = false
        distance.value = locationStore.distancia
        nombreSucursalMasCercana.value = locationStore.sucursalCercana
    }, 2000);
}


onMounted(async () => {


    const docRef = collection(db, "Sucursales de Foodmania");
    const docSnap = await getDocs(docRef);


    docSnap.forEach(async (doc) => {
        const docData = doc.data();

        sucursales.value.push({
            ...docData,
        });
    });
    sucursalesStore.sucursalesFoodMania = sucursales.value


    const imgRefmenu = storageRef(storage, "FoodMania/amenuFoodmania.jpeg");
    const imgRef = storageRef(storage, "FoodMania/logoFoodmania4.PNG");
    imageUrlMenu.value = await getDownloadURL(imgRefmenu);
    imageUrl.value = await getDownloadURL(imgRef);
    setTimeout(() => {
        loader.value = false;
    }, 2000);
});
</script>
