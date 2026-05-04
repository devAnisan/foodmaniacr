<template>
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
            <span class="text-sm font-bold">{{ user.emailVerified ? '✅ Email verificado' : '⚠️ Email no verificado'
                }}</span>
            <button @click="auth.signOut()"
                class="w-full bg-[#642d81] text-white px-4 py-2 rounded-lg hover:bg-[#422d4d] transition-colors hover:cursor-pointer">
                Cerrar sesión
            </button>
        </section>
    </section>

    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white fontColor shadow-sm">
        <!-- Mobile dropdown -->
        <section v-if="menuOpen">
            <ul class="flex flex-col p-2 absolute top-20 right-4 bg-white rounded-xl shadow-lg w-44 space-y-1 border">
                <li class="p-2">
                    <button @click="openLogin" class="w-full text-left font-bold">
                        {{ user ? user.email.split('@')[0] : "Inicia sesión" }}
                    </button>
                </li>
                <li class="p-2 border-t">
                    <button @click="openMenu()" class="w-full text-left">🛒 Ver carrito</button>
                </li>
            </ul>
        </section>

        <!-- Carrito -->
        <section v-if="menuItems"
            class="border rounded-2xl absolute right-4 top-20 z-50 bg-white shadow-xl w-80 max-h-[80vh] overflow-y-auto">
            <div class="flex p-4 fontColor justify-between items-center border-b">
                <span class="text-xl font-bold">Carrito 🛒</span>
                <span class="pi pi-times hover:cursor-pointer text-red-500 p-2" @click="menuItems = false"></span>
            </div>
            <div>
                <span v-if="cartStore.items.length === 0" class="text-center text-gray-400 block p-6">
                    Aún no agregaste nada 😋
                </span>
                <div v-for="value in cartStore.items" :key="value.id"
                    class="flex fontColor justify-between items-center border-b p-3">
                    <div class="flex-1 text-sm font-bold">{{ value.nombre }} <span class="text-gray-400">x{{
                            value.cantidad }}</span></div>
                    <div class="text-sm mr-2">₡{{ value.precio * value.cantidad }}</div>
                    <div class="flex items-center gap-1">
                        <button @click="cartStore.removeItem(value.id)" class="text-gray-400 hover:text-red-500 p-1">
                            <span class="pi pi-minus text-xs"></span>
                        </button>
                        <button @click="cartStore.addItem(value)" class="text-gray-400 hover:text-green-500 p-1">
                            <span class="pi pi-plus text-xs"></span>
                        </button>
                        <button @click="cartStore.deleteItem(value.id)" class="text-red-400 hover:text-red-600 p-1">
                            <span class="pi pi-trash text-xs"></span>
                        </button>
                    </div>
                </div>
                <div class="flex justify-between p-4 font-bold border-t text-lg">
                    <span>Total</span>
                    <span>₡{{ cartStore.total }}</span>
                </div>
                <div class="p-3">
                    <button @click="showCheckout = true; menuItems = false"
                        class="w-full bg-[#642d81] text-white p-3 rounded-xl font-bold hover:bg-[#422d4d] transition-colors hover:cursor-pointer">
                        Finalizar compra 🎉
                    </button>
                </div>
            </div>
        </section>

        <!-- Nav mobile -->
        <nav class="flex md:hidden items-center justify-between p-4">
            <img class="w-14 object-contain" :src="imageUrl" alt="Foodmania Logo" />
            <span class="material-symbols-outlined hover:cursor-pointer" @click="menuOpen = !menuOpen">menu</span>
        </nav>

        <!-- Nav desktop -->
        <nav class="hidden md:flex items-center justify-between px-8 py-3">
            <img class="w-20 object-contain" :src="imageUrl" alt="Foodmania Logo" />
            <section class="flex space-x-6">
                <button @click="openLogin"
                    class="border px-4 py-2 rounded-full hover:cursor-pointer font-bold hover:bg-gray-50 transition-colors">
                    {{ user ? user.email.split('@')[0] : "Inicia sesión" }}
                </button>
                <button @click="menuItems = !menuItems"
                    class="border px-4 py-2 rounded-full hover:cursor-pointer font-bold hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <span class="pi pi-shopping-cart"></span>
                    <span v-if="cartStore.totalItems > 0"
                        class="bg-[#642d81] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {{ cartStore.totalItems }}
                    </span>
                </button>
            </section>
        </nav>
    </header>

    <!-- Checkout Modal -->
    <CheckoutModal v-model="showCheckout" />

    <!-- Main -->
    <main class="pt-24 fontColor min-h-screen bg-gray-50">

        <!-- Loader general -->
        <div v-if="loader" class="flex flex-col items-center justify-center min-h-screen gap-4">
            <!-- Skeleton navbar tabs -->
            <div class="flex gap-3 mb-4">
                <div v-for="i in 4" :key="i" class="h-9 w-24 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <!-- Skeleton cards -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 w-full px-4 max-w-6xl">
                <div v-for="i in 10" :key="i" class="bg-white rounded-xl shadow p-4">
                    <div class="w-full h-32 bg-gray-200 rounded-lg animate-pulse mb-3"></div>
                    <div class="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div class="h-3 bg-gray-200 rounded animate-pulse w-2/3 mb-3"></div>
                    <div class="h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
            </div>
        </div>

        <div v-else>
            <!-- Barra de búsqueda -->
            <div class="sticky top-20 z-40 bg-gray-50 px-4 py-3 shadow-sm">
                <div class="max-w-6xl mx-auto flex flex-col md:flex-row gap-3 items-center">
                    <!-- Search -->
                    <div class="relative w-full md:w-80">
                        <span class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></span>
                        <input v-model="busqueda" type="text" placeholder="Buscar producto..."
                            class="w-full pl-9 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#642d81] bg-white" />
                        <button v-if="busqueda" @click="busqueda = ''"
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <span class="pi pi-times text-sm"></span>
                        </button>
                    </div>

                    <!-- Pestañas de categorías -->
                    <div class="flex gap-2 overflow-x-auto pb-1 w-full scrollbar-hide">
                        <button @click="categoriaActiva = null; busqueda = ''"
                            :class="categoriaActiva === null && !busqueda ? 'bg-[#642d81] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'"
                            class="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border transition-all duration-200 flex-shrink-0">
                            🍽️ Todo
                        </button>
                        <button v-for="cat in categorias" :key="cat.coleccion" @click="seleccionarCategoria(cat)"
                            :class="categoriaActiva?.coleccion === cat.coleccion ? 'bg-[#642d81] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'"
                            class="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border transition-all duration-200 flex-shrink-0 flex items-center gap-1">
                            <span v-if="cat.cargando" class="pi pi-spinner animate-spin text-xs"></span>
                            {{ cat.emoji }} {{ cat.nombre }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Resultados de búsqueda -->
            <div v-if="busqueda" class="max-w-6xl mx-auto px-4 py-6">
                <h2 class="text-xl font-bold mb-4">
                    Resultados para "<span class="text-[#642d81]">{{ busqueda }}</span>"
                    <span class="text-gray-400 text-base font-normal">({{ resultadosBusqueda.length }})</span>
                </h2>
                <div v-if="resultadosBusqueda.length === 0" class="text-center py-16 text-gray-400">
                    <p class="text-4xl mb-3">🔍</p>
                    <p class="text-lg">No encontramos "{{ busqueda }}"</p>
                    <button @click="busqueda = ''" class="mt-4 text-[#642d81] font-bold hover:underline">Limpiar
                        búsqueda</button>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <ProductCard v-for="item in resultadosBusqueda" :key="item.id" :item="item"
                        @agregar="cartStore.addItem(item)" />
                </div>
            </div>

            <!-- Categorías -->
            <div v-else class="max-w-6xl mx-auto px-4 py-6">

                <!-- Una sola categoría activa -->
                <div v-if="categoriaActiva">
                    <h2 class="text-3xl font-bold mb-6 text-center">
                        {{ categoriaActiva.emoji }} {{ categoriaActiva.nombre }}
                    </h2>

                    <!-- Skeleton de categoría cargando -->
                    <div v-if="categoriaActiva.cargando" class="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div v-for="i in 5" :key="i" class="bg-white rounded-xl shadow p-4">
                            <div class="w-full h-32 bg-gray-200 rounded-lg animate-pulse mb-3"></div>
                            <div class="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                            <div class="h-3 bg-gray-200 rounded animate-pulse w-2/3 mb-3"></div>
                            <div class="h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                    </div>

                    <div v-else class="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <ProductCard v-for="item in categoriaActiva.productos" :key="item.id" :item="item"
                            @agregar="cartStore.addItem(item)" />
                    </div>
                </div>

                <!-- Todas las categorías -->
                <div v-else>
                    <div v-for="cat in categorias" :key="cat.coleccion" class="mb-10">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="text-2xl font-bold">{{ cat.emoji }} {{ cat.nombre }}</h2>
                            <button @click="seleccionarCategoria(cat)"
                                class="text-[#642d81] text-sm font-bold hover:underline hover:cursor-pointer">
                                Ver todos →
                            </button>
                        </div>

                        <!-- Skeleton -->
                        <div v-if="cat.cargando" class="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div v-for="i in 5" :key="i" class="bg-white rounded-xl shadow p-4">
                                <div class="w-full h-32 bg-gray-200 rounded-lg animate-pulse mb-3"></div>
                                <div class="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                                <div class="h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                            </div>
                        </div>

                        <!-- Productos (solo los primeros 5 en vista general) -->
                        <div v-else class="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <ProductCard v-for="item in cat.productos.slice(0, 5)" :key="item.id" :item="item"
                                @agregar="cartStore.addItem(item)" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <Footer />
</template>

<script setup>
import { ref as vueRef, computed, watch, onMounted, defineComponent, h } from 'vue'
import { ref as storageRef, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase.js'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase.js'
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase.js'
import { useCartStore, useLocationStore, useSucursales } from '../stores/carStores.js'
import Footer from './Footer.vue'
import CheckoutModal from './Checkoutmodal.vue'

// ── Componente inline ProductCard ──────────────────────────────────────────
const ProductCard = defineComponent({
    props: { item: Object },
    emits: ['agregar'],
    setup(props, { emit }) {
        return () => h('div', { class: 'bg-white rounded-xl shadow-md p-3 flex flex-col hover:shadow-lg transition-shadow duration-200' }, [
            props.item.imageUrl
                ? h('img', { src: props.item.imageUrl, alt: props.item.nombre, loading: 'lazy', class: 'w-full h-32 object-cover rounded-lg mb-3' })
                : h('div', { class: 'w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-3xl' }, '🍽️'),
            h('h3', { class: 'font-bold text-sm mb-1 flex-1 line-clamp-2' }, props.item.nombre),
            props.item.descripcion ? h('p', { class: 'text-gray-400 text-xs mb-2 line-clamp-1' }, props.item.descripcion) : null,
            h('p', { class: 'font-bold text-[#642d81] mb-3' }, `₡${props.item.precio}`),
            h('button', {
                class: 'w-full bg-[#642d81] text-white py-2 rounded-lg text-sm font-bold hover:bg-[#422d4d] transition-colors hover:cursor-pointer',
                onClick: () => emit('agregar')
            }, '+ Agregar')
        ])
    }
})

// ── Stores ─────────────────────────────────────────────────────────────────
const cartStore = useCartStore()
const locationStore = useLocationStore()
const sucursalesStore = useSucursales()

// ── Estado ─────────────────────────────────────────────────────────────────
const loader = vueRef(true)
const imageUrl = vueRef('')
const menuOpen = vueRef(false)
const menuItems = vueRef(false)
const showCheckout = vueRef(false)
const showUserModal = vueRef(false)
const user = vueRef(null)
const busqueda = vueRef('')
const categoriaActiva = vueRef(null)

// Auth
const justLogin = vueRef(true)
const forgotPassword = vueRef(false)
const email = vueRef('')
const password1 = vueRef('')
const password2 = vueRef('')
const successMsg = vueRef('')
const errorMsg = vueRef('')
const menuLogIn = vueRef(false)

onAuthStateChanged(auth, (currentUser) => { user.value = currentUser })

// ── Categorías con emoji y lazy loading ────────────────────────────────────
const categorias = vueRef([
    { nombre: 'Comida China', coleccion: 'comidachina', emoji: '🥡', productos: [], cargando: false, cargada: false },
    { nombre: 'Comida Rápida', coleccion: 'comidarapida', emoji: '🍟', productos: [], cargando: false, cargada: false },
    { nombre: 'Hamburguesas', coleccion: 'hamburguesas', emoji: '🍔', productos: [], cargando: false, cargada: false },
    { nombre: 'Pollo Frito', coleccion: 'pollofrito', emoji: '🍗', productos: [], cargando: false, cargada: false },
    { nombre: 'Promociones', coleccion: 'promociones', emoji: '🔥', productos: [], cargando: false, cargada: false },
    { nombre: 'Supremos', coleccion: 'supremos', emoji: '👑', productos: [], cargando: false, cargada: false },
    { nombre: 'Surtidos', coleccion: 'surtidos', emoji: '🎁', productos: [], cargando: false, cargada: false },
])

// ── Cargar una categoría (lazy) ────────────────────────────────────────────
const cargarCategoria = async (cat) => {
    if (cat.cargada || cat.cargando) return
    cat.cargando = true
    try {
        const snap = await getDocs(collection(db, cat.coleccion))
        for (const doc of snap.docs) {
            const data = doc.data()
            let itemImageUrl = null
            if (data.imagen) {
                const imgRef = storageRef(storage, data.imagen)
                itemImageUrl = await getDownloadURL(imgRef)
            }
            cat.productos.push({ id: doc.id, ...data, imageUrl: itemImageUrl })
        }
        cat.cargada = true
    } catch (error) {
        console.error(`Error cargando ${cat.nombre}:`, error)
    } finally {
        cat.cargando = false
    }
}

// ── Seleccionar categoría (carga lazy) ────────────────────────────────────
const seleccionarCategoria = async (cat) => {
    categoriaActiva.value = cat
    busqueda.value = ''
    await cargarCategoria(cat)
}

// ── Búsqueda en todos los productos cargados ──────────────────────────────
const resultadosBusqueda = computed(() => {
    if (!busqueda.value.trim()) return []
    const q = busqueda.value.toLowerCase()
    return categorias.value
        .flatMap(cat => cat.productos)
        .filter(p => p.nombre?.toLowerCase().includes(q) || p.descripcion?.toLowerCase().includes(q))
})

// ── onMounted: carga logo + primera categoría ─────────────────────────────
onMounted(async () => {
    const imgRef = storageRef(storage, 'FoodMania/logoFoodmania4.PNG')
    imageUrl.value = await getDownloadURL(imgRef)

    // Cargar sucursales para el store
    const docSnap = await getDocs(collection(db, 'Sucursales de Foodmania'))
    const sucursales = []
    docSnap.forEach(doc => sucursales.push({ ...doc.data() }))
    sucursalesStore.sucursalesFoodMania = sucursales

    // Carga la primera categoría inmediatamente
    await cargarCategoria(categorias.value[0])

    loader.value = false

    // Carga el resto en segundo plano sin bloquear la UI
    for (const cat of categorias.value.slice(1)) {
        cargarCategoria(cat)
    }
})

// ── Auth helpers ───────────────────────────────────────────────────────────
watch(menuLogIn, val => { document.body.style.overflow = val ? 'hidden' : '' })

const openLogin = () => {
    if (user.value) showUserModal.value = !showUserModal.value
    else menuLogIn.value = true
}

const openMenu = () => { menuOpen.value = false; menuItems.value = true }

const resetPassword = async (em) => {
    try {
        await sendPasswordResetEmail(auth, em)
        successMsg.value = 'Correo de recuperación enviado 📧'
        errorMsg.value = ''
    } catch { errorMsg.value = 'Error al enviar el correo.'; successMsg.value = '' }
}

const register = async (em, p1, p2) => {
    if (p1 !== p2) { errorMsg.value = 'Las contraseñas no coinciden.'; return }
    try {
        const uc = await createUserWithEmailAndPassword(auth, em, p1)
        await sendEmailVerification(uc.user)
        successMsg.value = 'Cuenta creada. Verificá tu correo 📧'
        errorMsg.value = ''
        setTimeout(() => window.location.reload(), 2000)
    } catch { errorMsg.value = 'Error al crear la cuenta.'; successMsg.value = '' }
}

const login = async (em, p1) => {
    try {
        await signInWithEmailAndPassword(auth, em, p1)
        successMsg.value = 'Inicio de sesión exitoso ✅'
        errorMsg.value = ''
        setTimeout(() => window.location.reload(), 1000)
    } catch { errorMsg.value = 'Credenciales incorrectas.'; successMsg.value = '' }
}
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
