<template>
    <section v-if="loader" class="flex flex-col fontColor items-center justify-center h-screen gap-4 bg-white">
        <img src="/logoFoodmania4.PNG" alt="Foodmania" class="w-24 h-24 object-contain animate-pulse" />
        <div class="flex gap-1.5">
            <span class="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce" style="animation-delay:0ms"></span>
            <span class="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce" style="animation-delay:150ms"></span>
            <span class="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce" style="animation-delay:300ms"></span>
        </div>
    </section>
    <!-- Pantallas pequenas -->
    <header v-else class="fixed top-0 left-0 right-0 z-50 bg-white fontColor">
        <nav class="flex md:hidden items-center justify-between p-4 shadow-sm">
            <section class="flex items-center space-x-2 hover:cursor-pointer">
                <img class="w-16" :src="imageUrl" alt="Foodmania Logo" />
            </section>
            <section>
                <span class="material-symbols-outlined hover:cursor-pointer" @click="toggleMobileMenu">
                    menu
                </span>
            </section>
        </nav>
        <Dropmenu class="z-50" v-show="menuOpen" @open-login="handleOpenLogin" />
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
            <section class="flex items-center space-x-3">
                <button v-if="esAdmin" @click="irAAdmin"
                    class="border border-green-500 text-green-600 px-3 py-1.5 rounded-full text-sm font-bold hover:bg-green-50 transition-colors hover:cursor-pointer">
                    Admin
                </button>
                <button @click="handleOpenLogin"
                    class="border px-4 py-2 rounded-full hover:cursor-pointer font-bold hover:bg-gray-50 transition-colors">
                    {{ user ? user.email.split('@')[0] : "Inicia sesión" }}
                </button>
                <RouterLink to="/menu" target="_blank"
                    class="extrabold border my-0.5 px-5 py-2 rounded-full inline-block hover:cursor-pointer hover:bg-gray-50 transition-colors">
                    Ordena aquí
                </RouterLink>
            </section>
        </nav>
        <AuthModal :auth="auth" :image-url="imageUrl" />

        <UserProfileModal :auth="auth" :cumpleanos-formateado="cumpleanosFormateado" :es-cumpleanos-hoy="esCumpleanosHoy" />
    </header>

    <main v-if="!loader" @click="menuOpen = false" class="fontColor pt-20 md:pt-28">
        <div>
            <DescuentoGlobalBanner />
            <HeroCarousel />

            <!-- Donde comprar + CTA section -->
            <section class="py-16 px-4">
                

                <!-- Ordena aquí CTA -->
                <div class="mt-16 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-3xl py-12 px-6 text-center max-w-4xl mx-auto shadow-xl">
                    <p class="text-2xl md:text-3xl text-white font-bold mb-4">¿Estas listo para probar el mejor sabor de tu vida?</p>
                    <p class="text-lg md:text-xl text-white/80 mb-8">¡Ordena ahora y disfruta de una experiencia gastronómica única con Foodmania!</p>
                    <RouterLink to="/menu" target="_blank"
                        class="inline-block bg-white text-[var(--primary)] font-bold px-10 py-4 rounded-full hover:bg-gray-100 transition-all hover:cursor-pointer shadow-lg hover:shadow-xl hover:scale-105 transform">
                        Ordena aquí
                    </RouterLink>
                </div>
            </section>

            <!-- Divider -->
            <div class="flex justify-center">
                <div class="w-24 h-1 bg-[var(--primary)] rounded-full opacity-30"></div>
            </div>

            <!-- Menu section -->
            <section id="menu" class="py-16 px-4">
                <div class="text-center max-w-4xl mx-auto">
                    <h1 class="heading-font extrabold text-4xl my-8 p-1">Menú</h1>
                    <div class="flex justify-center p-4">
                        <div class="w-full max-w-4xl rounded-2xl shadow-lg overflow-hidden transition-transform duration-500 hover:scale-[1.02] hover:shadow-xl">
                            <img :src="imageUrlMenu" alt="Menú de Foodmania" class="w-full h-auto" />
                        </div>
                    </div>
                </div>
            </section>

            <!-- Divider -->
            <div class="flex justify-center">
                <div class="w-24 h-1 bg-[var(--primary)] rounded-full opacity-30"></div>
            </div>
<div class="text-center max-w-4xl mx-auto">
                    <div class="hidden md:block">
                        <h1 class="heading-font title extrabold text-4xl my-8 p-1 ">
                            ¿Dónde comprar tu <span class="heading-font title"> antojo</span> ?
                        </h1>
                    </div>
                    <div class="block md:hidden">
                        <h1 class="heading-font extrabold text-2xl my-6 p-1">
                            ¿Dónde comprar tu <span class="heading-font title"> antojo</span> ?
                        </h1>
                    </div>
                    <p class="text-lg text-gray-600 max-w-2xl mx-auto">
                        Te ofrecemos varias opciones para que puedas disfrutar de nuestros
                        productos. Puedes encontrarnos en los siguientes puntos de venta:
                    </p>
                </div>
            <!-- Sucursales section -->
            <section id="sucursales" class="py-5 px-4">
                <BranchSection />
            </section>

            <section class="flex justify-center mb-8 px-2">
                <button @click="getLocations()" :disabled="loaderBranchSection"
                    class="flex justify-center items-center shadow-lg p-3 px-6 rounded-full hover:cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 bg-white border border-[var(--primary)] text-[var(--primary)] font-bold disabled:opacity-60 disabled:cursor-not-allowed">
                    <span class="text-lg flex items-center gap-2">
                        <span v-if="loaderBranchSection" class="pi pi-spinner animate-spin"></span>
                        {{ loaderBranchSection ? 'Cargando...' : 'Conocer mi sucursal más cercana 📍' }}
                    </span>
                </button>
            </section>

            <section class="flex flex-col justify-center px-2 pb-16 items-center" v-show="branchSectionShow">
                <section v-if="loaderBranchSection" class="flex items-center justify-center w-32">
                    <section class="fontColor text-2xl animate-spin text-center">
                        <span class="pi pi-spinner"></span>
                    </section>
                </section>

                <section v-else class="p-6 text-center bg-white rounded-2xl shadow-lg border border-gray-100 max-w-lg mx-auto">
                    <h1 class="text-gray-700">
                        Tu sucursal más cercana es:
                        <span class="extrabold text-[var(--primary)] block text-2xl mt-2">{{ locationStore.sucursalCercana }}</span>
                        <span class="text-[var(--primary)] font-bold">a solo {{ locationStore.distancia }} km de ti.</span>
                    </h1>
                </section>
                <WhereBuySection :sucursal="nearestBranch" />
            </section>
        </div>
        <Footer />
    </main>
    <MartesFoodManiacos />
    <InstallPWAPrompt />
    <NotificationBanner />
</template>
<script setup>
import { ref as vueRef, computed, watch, onMounted, onUnmounted } from "vue";
import { ref as storageRef, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase.js";
import { useRouter } from "vue-router";
import HeroCarousel from "./HeroCarousel.vue";
import Dropmenu from "./Dropmenu.vue";
import BranchSection from "./BranchSection.vue";
import WhereBuySection from "./WhereBuySection.vue";
import Footer from "./Footer.vue";
import MartesFoodManiacos from "./MartesFoodManiacos.vue";
import InstallPWAPrompt from "./InstallPWAPrompt.vue";
import NotificationBanner from "./NotificationBanner.vue";
import AuthModal from "./AuthModal.vue";
import UserProfileModal from "./UserProfileModal.vue";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase.js";
import { esCumpleanos, formatearCumpleanos } from "../utils/maniacoins.js";
import { useLocationStore, useSucursales } from "../stores/cartStores.js";
import { useAuth } from "../composable/useAuth.js";
import { getLocation } from "../composable/saberDistancia.js";
import { cargarDescuentoGlobal } from "../composable/useDescuentoGlobal.js";
import DescuentoGlobalBanner from "./DescuentoGlobalBanner.vue";

const router = useRouter();
const locationStore = useLocationStore()
const sucursalesStore = useSucursales()
cargarDescuentoGlobal()

const auth = useAuth()
const {
    user, esAdmin, showUserModal, menuLogIn,
    openLogin, verificarAdmin, initAuthListener
} = auth

const sucursales = vueRef([]);
const loaderBranchSection = vueRef(false);
const menuOpen = vueRef(false);
const imageUrl = vueRef("");
const imageUrlMenu = vueRef("");
const loader = vueRef(true);
const nearestBranch = vueRef(null);
const branchSectionShow = vueRef(false);

const irAAdmin = () => {
    router.push("/adminControl")
}

// ── Overlays del header: solo uno visible a la vez ──────────────────────────
const toggleMobileMenu = () => {
    if (menuOpen.value) {
        menuOpen.value = false
    } else {
        menuLogIn.value = false
        showUserModal.value = false
        menuOpen.value = true
    }
}

const handleOpenLogin = () => {
    menuOpen.value = false
    openLogin()
}

const cumpleanosUsuario = vueRef('')
const esCumpleanosHoy = computed(() => esCumpleanos(cumpleanosUsuario.value))
const cumpleanosFormateado = computed(() => formatearCumpleanos(cumpleanosUsuario.value))

watch(showUserModal, async (val) => {
  if (val && user.value?.uid) {
    try {
      const docSnap = await getDoc(doc(db, 'clientes', user.value.uid))
      if (docSnap.exists()) {
        cumpleanosUsuario.value = docSnap.data().cumpleanos || ''
      }
    } catch (e) {
      console.error('Error cargando cumpleaños:', e)
    }
  }
})

const getLocations = async () => {
    branchSectionShow.value = true
    loaderBranchSection.value = true
    try {
        await getLocation(sucursales.value)
    } finally {
        loaderBranchSection.value = false
    }
}


let unsubAuth = null

onUnmounted(() => {
    if (unsubAuth) unsubAuth()
})

onMounted(async () => {
    unsubAuth = initAuthListener((currentUser) => {
        verificarAdmin(currentUser)
    })

    const [sucursalesSnap, logoUrl, menuUrl] = await Promise.all([
        getDocs(collection(db, "Sucursales de Foodmania")),
        getDownloadURL(storageRef(storage, "FoodMania/logoFoodmania4.PNG")),
        getDownloadURL(storageRef(storage, "FoodMania/amenuFoodmania.jpeg"))
    ])

    const sucursalesData = []
    sucursalesSnap.forEach(doc => sucursalesData.push(doc.data()))
    sucursales.value = sucursalesData
    sucursalesStore.sucursalesFoodMania = sucursalesData

    imageUrl.value = logoUrl
    imageUrlMenu.value = menuUrl

    loader.value = false
});
</script>
