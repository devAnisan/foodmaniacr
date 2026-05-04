<template>
    <!-- Modal de inicio de sesión -->
    <div v-if="menuLogIn" class="fixed inset-0 z-60 bg-white h-full w-full flex items-center justify-center fontColor">
        <div class="p-4 rounded-lg shadow-lg z-80 w-80 bg-white">
            <section class="flex justify-between border-b text-center">
                <span class="text-2xl"> Iniciar Sesión </span>
                <span>
                    <button @click="menuLogIn = false; forgotPassword = false; justLogin = true"
                        class="text-red-500 hover:text-red-700 p-2 rounded hover:cursor-pointer">
                        <span class="pi pi-times"></span>
                    </button>
                </span>
            </section>
            <section class="flex flex-col p-4 text-center">
                <img :src="imageUrl" alt="logo_foodmania" class="w-20 mx-auto mb-4" />
                <h1>Correo electrónico</h1>

                <input v-model="email" type="email" placeholder="Ingresa tu correo electrónico"
                    class="p-2 border  w-full rounded" />
                <div v-if="!forgotPassword">
                    <h2>Contraseña</h2>
                </div>
                <section v-if="justLogin && !forgotPassword" class="flex flex-col">
                    <input v-model="password1" type="password" placeholder="Ingresa tu contraseña"
                        class="p-2  w-full border rounded" />
                </section>
                <section class="flex flex-col" v-else-if="!justLogin && !forgotLogin">
                    <input v-model="password1" type="password" placeholder="Crear contraseña"
                        class="p-2 border rounded w-full" />
                    <input v-model="password2" type="password" placeholder="Confirmar contraseña"
                        class="p-2 border rounded mt-2  w-full" />
                    <p class="text-sm  mt-2 text-red-500  w-full">
                        Debe contener al menos 8 caracteres, una letra mayúscula, una letra minúscula y un número.
                    </p>
                </section>
                <div v-if="justLogin && !forgotPassword">
                    <button @click="login(email, password1)"
                        class="mt-4 bg-[#642d81] text-white px-4 py-2 rounded hover:bg-[#422d4d] transition-colors duration-300 hover:cursor-pointer">
                        Iniciar sesión
                    </button>

                </div>
                <div v-else-if="!justLogin && !forgotPassword">
                    <button @click="register(email, password1, password2)"
                        class="mt-4 bg-[#642d81] text-white px-4 py-2 rounded hover:bg-[#422d4d] transition-colors duration-300 hover:cursor-pointer">
                        Crear cuenta
                    </button>
                </div>
                <div v-if="forgotPassword">
                    <button @click="resetPassword(email)"
                        class="mt-4 bg-[#642d81] text-white px-4 py-2 rounded hover:bg-[#422d4d] transition-colors duration-300 hover:cursor-pointer">
                        Enviar correo de recuperación
                    </button>
                </div>
            </section>
            <section v-if="justLogin" class="text-center">
                <p class="text-sm text-gray-600 mt-4 border-b p-2">
                    ¿No tienes una cuenta?
                <pre></pre>
                <a href="#" @click="justLogin = false; forgotPassword = false" class="text-blue-500">Regístrate</a>
                </p>
                <p>
                    <button class="text-blue-500 text-sm hover:text-blue-700 hover:cursor-pointer"
                        @click="forgotPassword = true">¿Olvidaste tu contraseña?</button>
                </p>
            </section>
            <section v-if="!justLogin" class="text-center">
                <p class="text-sm text-gray-600 mt-4">
                    ¿Ya tienes una cuenta?
                <pre></pre>
                <a href="#" @click="justLogin = true" class="text-blue-500">Inicia sesión</a>
                </p>
            </section>
        </div>
    </div>
    <!-- Fin Modal de inicio de sesión -->

    <!-- Informacion de usuario y cierre de sesión -->
    <section v-if="showUserModal && user"
        class="fixed top-20 right-4 z-90 bg-white p-4 rounded-lg shadow-lg fontColor w-60 text-center">
        <section class="flex justify-between border-b p-2" @click="showUserModal = false">
            <span>Hola{{ user ? ` , ${user.email.split('@')[0]}.` : ", Buen día." }}</span>
            <span class="pi pi-times text-red-500 hover:text-red-700 hover:cursor-pointer"></span>
        </section>
        <section class="flex justify-center flex-col items-center">
            <span>Correo: {{ user.email }}</span>
            <span class="font-bold">{{ user.emailVerified ? 'Email verificado ✓' : 'Email no verificado ✗' }} </span>

            <button v-if="user" @click="auth.signOut()"
                class="mt-4 bg-[#642d81] text-white px-4 py-2 rounded hover:bg-[#422d4d] transition-colors duration-300 hover:cursor-pointer">
                Cerrar sesión
            </button>
        </section>
    </section>
    <!-- Fin Informacion de usuario y cierre de sesión -->

    <header class="fixed top-0 left-0 right-0 z-50 bg-white fontColor">
        <section v-if="menuOpen">
            <ul
                class="flex flex-col p-2 box-border absolute top-25 right-4 bg-white rounded-lg shadow-lg w-40 space-y-2">
                <li class="p-1">
                    <button @click="openLogin" class="w-full text-left">
                        {{ user ? user.email.split('@')[0] : "Inicia sesión" }}

                    </button>
                </li>
                <li class="p-1">
                    <button @click="openMenu()">Ver carrito</button>
                </li>
            </ul>
        </section>
        <!-- Carrito de compras -->
        <section>
            <section v-if="menuItems === true"
                class="border rounded-lg absolute right-4 top-20 z-50 bg-white mt-2 shadow-lg">
                <div class="flex p-4 fontColor justify-between items-center">
                    <section>
                        <span class="text-2xl"> Carrito de compras </span>
                        <span class="pi pi-shopping-cart px-1 font-bold"></span>
                    </section>
                    <span class="pi pi-times hover:cursor-pointer text-red-500 hover:text-red-700 p-2 rounded"
                        @click="menuItems = false"></span>
                </div>
                <div>
                    <div>
                        <span v-if="cartStore.items.length === 0"
                            class="text-center text-gray-500 block p-4 fontColor border-t">
                            Aún no has agregado nada a tu carrito.
                        </span>
                    </div>
                    <div v-for="value in cartStore.items" :key="value.id"
                        class="flex fontColor justify-between items-center border-t p-2">
                        <div class="w-1/2 p-2">
                            {{ value.nombre }} x{{ value.cantidad }}
                        </div>
                        <div class="w-1/2 p-2 text-right">
                            ₡{{ value.precio * value.cantidad }}
                        </div>
                        <div>
                            <button @click="cartStore.deleteItem(value.id)"
                                class="text-red-500 hover:text-red-700 p-2 rounded hover:cursor-pointer">
                                <span class="pi pi-trash"></span>
                            </button>
                        </div>
                        <div>
                            <button @click="cartStore.removeItem(value.id)"
                                class="text-red-500 hover:text-red-700 p-2 rounded hover:cursor-pointer">
                                <span class="pi pi-minus"></span>
                            </button>
                        </div>
                        <div @click="cartStore.addItem(value)"
                            class="hover:cursor-pointer fontColor hover:text-green-700 p-2 rounded">
                            <span class="pi pi-plus"></span>
                        </div>
                    </div>
                    <div class="flex justify-between p-4 fontColor text-lg font-bold border-t">
                        <span> Total: </span>
                        ₡{{ cartStore.total }}
                    </div>
                    <div>
                        <button
                            class="w-full bg-[#642d81] text-white p-2 rounded hover:bg-[#422d4d] transition-colors duration-300 hover:cursor-pointer">
                            <a href="/checkout" target="_blank">Finalizar compra</a>
                        </button>
                    </div>
                </div>
            </section>

            <!-- Fin Carrito de compras -->
        </section>
        <nav class="flex md:hidden items-center justify-between p-4 shadow-sm">
            <section class="flex items-center space-x-2 hover:cursor-pointer">
                <img class="w-15" :src="imageUrl" alt="Foodmania Logo" />
            </section>
            <section>
                <span class="material-symbols-outlined hover:cursor-pointer" @click="menuOpen = !menuOpen">
                    menu
                </span>
            </section>
        </nav>
        <nav class="hidden md:flex items-center justify-between p-4 shadow-sm">
            <section class="flex items-center space-x-2 hover:cursor-pointer">
                <img class="w-24" :src="imageUrl" alt="Foodmania Logo" />
            </section>

            <section class="flex space-x-6">
                <button @click="openLogin" id="extrabold"
                    class="border my-0.5 p-2 pl-3 pr-3 rounded-full hover:cursor-pointer">
                    {{ user ? user.email.split('@')[0] : "Inicia sesión" }}
                    <a href="/menu" target="_blank"></a>
                </button>

                <button @click="menuItems = !menuItems" id="extrabold"
                    class="border my-0.5 p-2 pl-3 pr-3 rounded-full hover:cursor-pointer flex justify-center items-center">
                    <span class="pi pi-shopping-cart"></span>
                    <span class="ml-2">{{ cartStore.totalItems }}</span>
                    <a href="/menu" target="_blank"></a>
                </button>
            </section>
        </nav>
    </header>
    <!-- ---- -->

    <body>

        <section>
            <div v-if="loader" class="flex items-center justify-center h-screen fontColor text-2xl">
                Cargando menú...
            </div>
        </section>
        <div class="flex flex-row pt-32">
            <section class="w-64 flex flex-col items-center justify-center p-4 rounded-lg mb-4">
                <h1 class="text-center">Retiro en {{ withDrawType.type }}</h1>
                <section>
                    <button @click="withDrawType.type = 'sucursal'"
                        :class="withDrawType.type === 'sucursal' ? 'bg-[#642d81] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
                        class="px-4 py-2 rounded hover:cursor-pointer transition-colors duration-300">
                        Sucursal
                    </button>
                    <button @click="withDrawType.type = 'domicilio'"
                        :class="withDrawType.type === 'domicilio' ? 'bg-[#642d81] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
                        class="px-4 py-2 rounded hover:cursor-pointer transition-colors duration-300 ml-2">
                        Domicilio
                    </button>
                </section>
            </section>
            <section class="flex justify-center items-center w-64">
                <section v-if="withDrawType.type === 'sucursal'">

                    <h1 >¿Donde deseas retirar tu pedido?</h1>
                    <select name="sucursales" id="sucursales" class="p-1 border rounded-lg">
                        <option value="pavasSucursal">Pavas</option>
                        <option value="guapilesSucursal">Guapiles</option>
                        <option value="laTrinidadSucursal">La trinididad Alajuela</option>
                    </select>
                </section>
                <section v-else>
                    <section v-if="locationStore.distancia > 10 && locationStore.distancia != null">
                        <h1 class="text-red-600"> Fuera de la zona de reparto. Por favor, hazlo por retiro en tienda.</h1>
                    </section>
                    <section v-else>
                        <button @click="getLocations()"
                    class="flex justify-center items-center shadow-lg p-2 px-4 rounded-full hover:cursor-pointer">
                    <span id="dondeComprar" class="text-lg">
                        Conocer mi sucursal más cercana 📍
                    </span>
                </button>
                    </section>
                </section>
            </section>
        </div>
        <section v-if="!loader" @click="menuItems = false" class="p-4 fontColor" v-for="categoria in categorias"
            :key="categoria.coleccion">
            <div>


            </div>
            <div class="m-4">
                <h1 class="p-2 title text-center text-4xl font-bold">
                    {{ categoria.nombre }}
                </h1>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 fontColor text-center">
                <div v-for="item in categoria.productos" :key="item.id">
                    <div class="bg-white rounded-lg shadow-md p-4">
                        <img v-if="item.imageUrl" :src="item.imageUrl" alt="Imagen del producto"
                            class="w-full h-32 object-cover mb-4 rounded" />
                        <div v-else class="w-full h-32 bg-gray-300 flex items-center justify-center mb-4 rounded">
                            <span class="text-gray-500">🍽️</span>
                        </div>
                        <h2 class="font-bold mb-2">{{ item.nombre }}</h2>
                        <p class="text-gray-600 mb-2">{{ item.descripcion }}</p>
                        <p class="font-bold">₡{{ item.precio }}</p>
                        <section>
                            <button @click="cartStore.addItem(item)"
                        class="mt-2 bg-[#642d81] text-white px-4 py-2 rounded hover:cursor-pointer hover:bg-[#422d4d] transition-colors duration-300">
                                Agregar al carrito
                            </button>
                        </section>
                    </div>
                </div>
            </div>
        </section>
    </body>
    <Footer />
</template>

<script setup>


import { ref as vueRef, onMounted, watch } from "vue";
import { ref as storageRef, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase.js";
import Footer from "./Footer.vue";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase.js";
import { useCartStore, useLocationStore } from "../stores/carStores.js";
const justLogin = vueRef(true);

const locationStore = useLocationStore()
const showUserModal = vueRef(true);
const user = vueRef(null);
onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser;
});
const cartStore = useCartStore();
const menuItems = vueRef(false);
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase.js";
const categorias = vueRef([
    { nombre: "Comida China", coleccion: "comidachina", productos: [] },
    { nombre: "Comida Rápida", coleccion: "comidarapida", productos: [] },
    { nombre: "Hamburguesas", coleccion: "hamburguesas", productos: [] },
    { nombre: "Pollo Frito", coleccion: "pollofrito", productos: [] },
    { nombre: "Promociones", coleccion: "promociones", productos: [] },
    { nombre: "Supremos", coleccion: "supremos", productos: [] },
    { nombre: "Surtidos", coleccion: "surtidos", productos: [] },
]);
const password1 = vueRef("");
const password2 = vueRef("");
const email = vueRef("");
const forgotPassword = vueRef(false);
const withDrawType = vueRef({ type: "sucursal" });
// Restablecer contraseña
const resetPassword = async (email) => {
    const send = await sendPasswordResetEmail(auth, email).then(() => {
        return true;
    }).catch((error) => {
        return false;
    });
    if (send) {
        alert("Correo de recuperación enviado. Por favor revisa tu bandeja de entrada. Si no lo ves, revisa tu carpeta de spam.");
    } else {
        alert("Error al enviar el correo de recuperación. Verifica que el correo sea correcto.");
    }
}
// Crear una cuenta de usuario
const register = async (email, password1, password2) => {

    if (password1 !== password2) {
        alert("Las contraseñas no coinciden. Por favor, inténtalo de nuevo.");
        return;
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password1);
        await sendEmailVerification(userCredential.user);
        alert("Cuenta creada exitosamente. Por favor verifica tu correo electrónico.");
        window.location.reload();
    } catch (error) {
        alert("Error al crear la cuenta. Verifica que los datos sean correctos.");
    }
};

// Iniciar sesión de usuario
const login = async (email, password1) => {
    try {
        await signInWithEmailAndPassword(auth, email, password1);


        window.location.reload();
        alert("Inicio de sesión exitoso.");
    } catch (error) {
        alert("Error al iniciar sesión. Verifica tus credenciales.");
    }
};

const loader = vueRef(true);
const menuOpen = vueRef(false);
const imageUrl = vueRef("");
const menuLogIn = vueRef(false);
const openMenu = () => {
    menuOpen.value = !menuOpen.value;
    menuItems.value = true;
};

const openLogin = () => {
    if (user.value) {
        showUserModal.value = !showUserModal.value;
    } else {
        menuLogIn.value = true;
    }
};

watch(menuLogIn, (newValue) => {
    document.body.style.overflow = newValue ? "hidden" : "";
});

onMounted(async () => {
    const imgRef = storageRef(storage, "FoodMania/logoFoodmania4.PNG");
    imageUrl.value = await getDownloadURL(imgRef);
    for (const categoria of categorias.value) {
        const snap = await getDocs(collection(db, categoria.coleccion));
        snap.forEach(async (doc) => {
            const data = doc.data();

            let imageUrl = null;
            if (data.imagen) {
                const imgRef = storageRef(storage, data.imagen);
                imageUrl = await getDownloadURL(imgRef);
            }

            categoria.productos.push({
                id: doc.id,
                ...data,
                imageUrl,
            });
        });
    }

    loader.value = false;

});
</script>
