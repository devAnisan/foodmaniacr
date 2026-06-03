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
            <section class="flex items-center space-x-3">
                <button v-if="esAdmin" @click="irAAdmin"
                    class="border border-green-500 text-green-600 px-3 py-1.5 rounded-full text-sm font-bold hover:bg-green-50 transition-colors hover:cursor-pointer">
                    Admin
                </button>
                <button @click="openLogin"
                    class="border px-4 py-2 rounded-full hover:cursor-pointer font-bold hover:bg-gray-50 transition-colors">
                    {{ user ? user.email.split('@')[0] : "Inicia sesión" }}
                </button>
                <button class="extrabold border my-0.5 p-2 pl-3 pr-3 rounded-full hover:cursor-pointer">
                    <RouterLink to="/menu" target="_blank">Ordena aquí</RouterLink>
                </button>
            </section>
        </nav>
        <!-- Modal de inicio de sesión -->
        <div v-if="menuLogIn" class="fixed inset-0 z-60 bg-black/50 h-full w-full flex items-center justify-center">
            <div class="p-4 rounded-2xl shadow-2xl z-80 w-80 bg-white fontColor">
                <section class="flex justify-between border-b text-center pb-3">
                    <span class="text-2xl font-bold">{{ showCompleteProfile ? 'Completá tu perfil' : showVerifyCode ? 'Verificá tu correo' : 'Iniciar Sesión' }}</span>
                    <button @click="menuLogIn = false; forgotPassword = false; justLogin = true; resetState()"
                        class="text-red-500 hover:text-red-700 p-2 rounded hover:cursor-pointer">
                        <span class="pi pi-times"></span>
                    </button>
                </section>

                <!-- Código de verificación -->
                <section v-if="showVerifyCode" class="flex flex-col p-4 text-center gap-3">
                    <p class="text-sm text-green-600 font-bold">{{ successMsg }}</p>
                    <p class="text-sm text-gray-500">Ingresá el código de 6 dígitos que te enviamos</p>
                    <input v-model="codigoInput" type="text" maxlength="6" placeholder="000000"
                        class="p-2 border w-full rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                    <p v-if="errorMsg" class="text-red-500 text-sm">{{ errorMsg }}</p>
                    <button @click="verificarCodigo"
                        class="bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
                        Verificar código
                    </button>
                    <button @click="register(email, password1, password2)"
                        class="text-sm text-[var(--primary)] hover:cursor-pointer">
                        Reenviar código
                    </button>
                </section>

                <!-- Completar perfil -->
                <section v-else-if="showCompleteProfile" class="flex flex-col p-4 text-center gap-3">
                    <p class="text-sm text-green-600 font-bold">{{ successMsg }}</p>
                    <p class="text-sm text-gray-500">Contanos de vos para terminar</p>
                    <input v-model="datosNuevos.nombre" type="text" placeholder="Nombre completo"
                        class="p-2 border w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                    <input v-model="datosNuevos.telefono" type="tel" placeholder="Teléfono"
                        class="p-2 border w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                    <input v-model="datosNuevos.direccion" type="text" placeholder="Dirección"
                        class="p-2 border w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                    <label class="text-sm text-gray-500 text-left block -mb-2">🎂 Fecha de cumpleaños</label>
                    <input v-model="datosNuevos.cumpleanos" type="date"
                        class="p-2 border w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                    <button @click="obtenerUbicacionPerfil"
                        class="w-full py-2 border-2 border-dashed border-[var(--primary)] rounded-lg text-[var(--primary)] font-bold hover:bg-purple-50 transition-colors hover:cursor-pointer text-sm">
                        📍 Usar mi ubicación actual
                    </button>
                    <p v-if="errorMsg" class="text-red-500 text-sm">{{ errorMsg }}</p>
                    <button @click="completarPerfil"
                        class="bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
                        Finalizar
                    </button>
                </section>

                <!-- Login / Register -->
                <section v-else class="flex flex-col p-4 text-center gap-3">
                    <img :src="imageUrl" alt="logo_foodmania" class="w-20 mx-auto mb-2" />
                    <input v-model="email" type="email" placeholder="Correo electrónico"
                        class="p-2 border w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                    <section v-if="justLogin && !forgotPassword">
                        <input v-model="password1" type="password" placeholder="Contraseña"
                            class="p-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                    </section>
                    <section class="flex flex-col gap-2" v-else-if="!justLogin && !forgotPassword">
                        <input v-model="password1" type="password" placeholder="Crear contraseña"
                            class="p-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                        <input v-model="password2" type="password" placeholder="Confirmar contraseña"
                            class="p-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                        <p class="text-xs text-red-500">Mínimo 8 caracteres, mayúscula, minúscula y número.</p>
                    </section>
                    <p v-if="successMsg" class="text-green-500 text-sm">{{ successMsg }}</p>
                    <p v-if="errorMsg" class="text-red-500 text-sm">{{ errorMsg }}</p>
                    <button v-if="justLogin && !forgotPassword" @click="login(email, password1)"
                        class="bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
                        Iniciar sesión
                    </button>
                    <button v-else-if="!justLogin && !forgotPassword" @click="register(email, password1, password2)"
                        class="bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
                        Crear cuenta
                    </button>
                    <button v-if="forgotPassword" @click="resetPassword(email)"
                        class="bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
                        Enviar correo de recuperación
                    </button>
                </section>
                <section v-if="justLogin && !showVerifyCode && !showCompleteProfile" class="text-center text-sm border-t pt-3">
                    <p class="text-gray-600">¿No tenés cuenta? <a href="#"
                            @click="justLogin = false; forgotPassword = false"
                            class="text-[var(--primary)] font-bold">Regístrate</a></p>
                    <button class="text-[var(--primary)] text-sm mt-2 hover:cursor-pointer"
                        @click="forgotPassword = true">¿Olvidaste tu contraseña?</button>
                </section>
                <section v-if="!justLogin && !showVerifyCode && !showCompleteProfile" class="text-center text-sm border-t pt-3">
                    <p class="text-gray-600">¿Ya tenés cuenta? <a href="#" @click="justLogin = true"
                            class="text-[var(--primary)] font-bold">Iniciá sesión</a></p>
                </section>
            </div>
        </div>

        <!-- Modal usuario -->
        <section v-if="showUserModal && user"
            class="fixed top-20 right-4 z-90 bg-white p-4 rounded-2xl shadow-xl fontColor w-64 text-center">
            <section class="flex justify-between border-b p-2 mb-3">
                <span class="font-bold">Hola, {{ user.email.split('@')[0] }} 👋</span>
                <span class="pi pi-times text-red-500 hover:cursor-pointer" @click="showUserModal = false"></span>
            </section>
            <section class="flex flex-col items-center gap-3">
                <span class="text-sm text-gray-500">{{ user.email }}</span>
                <span> </span>
                <span class="text-sm font-bold">{{ user.emailVerified ? '✅ Email verificado' : '⚠️ Email no verificado'
                }}</span>
                <button @click="cerrarSesion"
                    class="w-full bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
                    Cerrar sesión
                </button>
            </section>
        </section>
    </header>

    <main v-if="!loader" @click="menuOpen = false" class="fontColor pt-20 md:pt-28">
        <div>
            <HeroCarousel />
            <section id="sucursales">
                <BranchSection />
            </section>
            <br />

            <div class="text-center px-4">
                <div class="hidden md:block">
                    <h1 id="title" class="extrabold text-4xl my-8 p-1">
                        ¿Dónde comprar tu <span id="title" class="title"> antojo</span> ?
                    </h1>
                </div>
                <div class="block md:hidden">
                    <h1 id="title" class="extrabold text-1xl my-8 p-1">
                        ¿Dónde comprar tu <span id="title" class="title"> antojo</span> ?
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
                        <span class="extrabold">{{ locationStore.sucursalCercana }}</span>
                        la cual esta a
                        <span class="extrabold">{{ locationStore.distancia }}</span>
                        km de ti.
                    </h1>
                </section>
                <WhereBuySection :sucursal="nearestBranch" />
            </section>
        </div>
        <section id="menu">
            <div class="text-center px-4">
                <h1 id="title" class="extrabold text-4xl my-8 p-1">Menú</h1>
                <div class="flex justify-center p-4">
                    <div class="w-full max-w-4xl rounded-2xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
                        <img :src="imageUrlMenu" alt="Menú de Foodmania" class="w-full h-auto" />
                    </div>
                </div>
            </div>
            <div class="text-3xl text-center w-full md:w-2/3 mx-auto mb-12 px-4">
                <p class="mb-6">
                    ¿Estas listo para probar el mejor sabor de tu vida? ¡Ordena ahora y
                    disfruta de una experiencia culinaria única con Foodmania!
                </p>
                <button class="bg-[var(--primary)] text-white font-bold px-8 py-3 rounded-full hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer shadow-md">
                    <RouterLink to="/menu" target="_blank">Ordena aquí</RouterLink>
                </button>
            </div>
        </section>
        <Footer />
    </main>
    <MartesFoodManiacos />
</template>
<script setup>
import { ref as vueRef, onMounted } from "vue";
import { ref as storageRef, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase.js";
import { useRouter } from "vue-router";
import HeroCarousel from "./HeroCarousel.vue";
import Dropmenu from "./Dropmenu.vue";
import BranchSection from "./BranchSection.vue";
import WhereBuySection from "./WhereBuySection.vue";
import Footer from "./Footer.vue";
import MartesFoodManiacos from "./MartesFoodManiacos.vue";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase.js";
import { useLocationStore, useSucursales } from "../stores/cartStores.js";
import { useAuth } from "../composable/useAuth.js";
import { getLocation } from "../composable/saberDistancia.js";

const router = useRouter();
const locationStore = useLocationStore()
const sucursalesStore = useSucursales()

const {
    user, esAdmin, showUserModal, menuLogIn, justLogin, forgotPassword,
    email, password1, password2, successMsg, errorMsg,
    showVerifyCode, showCompleteProfile, codigoInput, datosNuevos,
    openLogin, cerrarSesion, resetPassword, register, login,
    verificarCodigo, completarPerfil, obtenerUbicacionPerfil, resetState,
    verificarAdmin, initAuthListener
} = useAuth()

const sucursales = vueRef([]);
const loaderBranchSection = vueRef(true);
const menuOpen = vueRef(false);
const imageUrl = vueRef("");
const imageUrlMenu = vueRef("");
const loader = vueRef(true);
const nearestBranch = vueRef(null);
const branchSectionShow = vueRef(false);

const irAAdmin = () => {
    router.push("/adminControl")
}

const getLocations = () => {
    branchSectionShow.value = true
    getLocation(sucursales.value)
    setTimeout(() => {
        loaderBranchSection.value = false
    }, 2000);
}


onMounted(async () => {
    initAuthListener((currentUser) => {
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
