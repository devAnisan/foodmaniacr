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
                <button id="extrabold" class="border my-0.5 p-2 pl-3 pr-3 rounded-full hover:cursor-pointer">
                    <RouterLink to="/menu" target="_blank">Ordena aquí</RouterLink>
                </button>
            </section>
        </nav>
        <!-- Modal de inicio de sesión -->
        <div v-if="menuLogIn" class="fixed inset-0 z-60 bg-black/50 h-full w-full flex items-center justify-center">
            <div class="p-4 rounded-2xl shadow-2xl z-80 w-80 bg-white fontColor">
                <section class="flex justify-between border-b text-center pb-3">
                    <span class="text-2xl font-bold">Iniciar Sesión</span>
                    <button @click="menuLogIn = false; forgotPassword = false; justLogin = true"
                        class="text-red-500 hover:text-red-700 p-2 rounded hover:cursor-pointer">
                        <span class="pi pi-times"></span>
                    </button>
                </section>
                <section class="flex flex-col p-4 text-center gap-3">
                    <img :src="imageUrl" alt="logo_foodmania" class="w-20 mx-auto mb-2" />
                    <input v-model="email" type="email" placeholder="Correo electrónico"
                        class="p-2 border w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-[#642d81]" />
                    <section v-if="justLogin && !forgotPassword">
                        <input v-model="password1" type="password" placeholder="Contraseña"
                            class="p-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#642d81]" />
                    </section>
                    <section class="flex flex-col gap-2" v-else-if="!justLogin && !forgotPassword">
                        <input v-model="password1" type="password" placeholder="Crear contraseña"
                            class="p-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#642d81]" />
                        <input v-model="password2" type="password" placeholder="Confirmar contraseña"
                            class="p-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#642d81]" />
                        <p class="text-xs text-red-500">Mínimo 8 caracteres, mayúscula, minúscula y número.</p>
                    </section>
                    <p v-if="successMsg" class="text-green-500 text-sm">{{ successMsg }}</p>
                    <p v-if="errorMsg" class="text-red-500 text-sm">{{ errorMsg }}</p>
                    <button v-if="justLogin && !forgotPassword" @click="login(email, password1)"
                        class="bg-[#642d81] text-white px-4 py-2 rounded-lg hover:bg-[#422d4d] transition-colors hover:cursor-pointer">
                        Iniciar sesión
                    </button>
                    <button v-else-if="!justLogin && !forgotPassword" @click="register(email, password1, password2)"
                        class="bg-[#642d81] text-white px-4 py-2 rounded-lg hover:bg-[#422d4d] transition-colors hover:cursor-pointer">
                        Crear cuenta
                    </button>
                    <button v-if="forgotPassword" @click="resetPassword(email)"
                        class="bg-[#642d81] text-white px-4 py-2 rounded-lg hover:bg-[#422d4d] transition-colors hover:cursor-pointer">
                        Enviar correo de recuperación
                    </button>
                </section>
                <section v-if="justLogin" class="text-center text-sm border-t pt-3">
                    <p class="text-gray-600">¿No tenés cuenta? <a href="#"
                            @click="justLogin = false; forgotPassword = false"
                            class="text-[#642d81] font-bold">Regístrate</a></p>
                    <button class="text-[#642d81] text-sm mt-2 hover:cursor-pointer"
                        @click="forgotPassword = true">¿Olvidaste tu contraseña?</button>
                </section>
                <section v-if="!justLogin" class="text-center text-sm border-t pt-3">
                    <p class="text-gray-600">¿Ya tenés cuenta? <a href="#" @click="justLogin = true"
                            class="text-[#642d81] font-bold">Iniciá sesión</a></p>
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
                    class="w-full bg-[#642d81] text-white px-4 py-2 rounded-lg hover:bg-[#422d4d] transition-colors hover:cursor-pointer">
                    Cerrar sesión
                </button>
            </section>
        </section>
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
import { useRouter } from "vue-router";
import HeroCarousel from "./HeroCarousel.vue";
import Dropmenu from "../composable/Dropmenu.vue";
import BranchSection from "./BranchSection.vue";
import WhereBuySection from "./WhereBuySection.vue";
import Footer from "./Footer.vue";
import { collection, doc, getDoc, getDocs, query, setDoc, Timestamp, where } from "firebase/firestore";
import { auth, db } from "../firebase.js";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signOut } from "firebase/auth";
import { useCartStore, useLocationStore, useSucursales } from "../stores/carStores.js";
import { getLocation } from "../composable/saberDistancia.js";
const router = useRouter();
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
const showUserModal = vueRef(false)
const editProfileModal = vueRef(false)
const user = vueRef(null)
const esAdmin = vueRef(false)

// Auth
const justLogin = vueRef(true)
const forgotPassword = vueRef(false)
const email = vueRef('')
const password1 = vueRef('')
const password2 = vueRef('')
const successMsg = vueRef('')
const errorMsg = vueRef('')
const menuLogIn = vueRef(false)

watch(menuLogIn, val => { document.body.style.overflow = val ? 'hidden' : '' })

const openLogin = () => {
    if (user.value) showUserModal.value = !showUserModal.value
    else menuLogIn.value = true
}

const cerrarSesion = async () => {
    useCartStore().items = []
    await signOut(auth)
    showUserModal.value = false
}

const resetPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email)
        successMsg.value = 'Correo de recuperación enviado 📧'
        errorMsg.value = ''
    } catch { errorMsg.value = 'Error al enviar el correo.'; successMsg.value = '' }
}

const register = async (email, password1, password2) => {
    if (password1 !== password2) {
        errorMsg.value = "Las contraseñas no coinciden. Por favor, intentalo de nuevo."
        return
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password1)
        await sendEmailVerification(userCredential.user)
        successMsg.value = "Cuenta creada exitosamente. Por favor verificá tu correo electrónico 📧"
        errorMsg.value = ""
    } catch (error) {
        console.error("Error en Auth:", error.code)
        errorMsg.value = "Error al crear la cuenta. Verificá que los datos sean correctos."
        return
    }

    try {
        await setDoc(doc(db, 'clientes', auth.currentUser.uid), {
            email: email,
            creadoEn: Timestamp.now(),
            telefono: '',
            nombre: '',
            direccion: '',
            lat: '',
            lng: ''
        })
    } catch (error) {
        console.error("Error en Firestore:", error)
    }

    setTimeout(() => {
        successMsg.value = "Cuenta creada exitosamente. Por favor verificá tu correo electrónico 📧"
        menuLogIn.value = false
    }, 2000)
}

const login = async (email, password) => {
    try {
        await signInWithEmailAndPassword(auth, email, password)
        successMsg.value = 'Inicio de sesión exitoso ✅'
        errorMsg.value = ''
        setTimeout(() => {
        successMsg.value = 'Inicio de sesión exitoso ✅'
        menuLogIn.value = false
    }, 1000)
    } catch { errorMsg.value = 'Credenciales incorrectas.'; successMsg.value = '' }
}

const irAAdmin = () => {
    router.push("/adminControl")
}

const verificarAdmin = async (currentUser) => {
    if (!currentUser) {
        esAdmin.value = false
        return
    }
    try {
        const docRef = doc(db, "superUser", currentUser.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
            const superUserData = docSnap.data()
            esAdmin.value = superUserData.rol === "administrador"
        }
    } catch (error) {
        console.error("Error verificando admin:", error)
        esAdmin.value = false
    }
}

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
    onAuthStateChanged(auth, (currentUser) => {
        user.value = currentUser
        if (currentUser) {
            verificarAdmin(currentUser)
        } else {
            esAdmin.value = false
        }
    })

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
