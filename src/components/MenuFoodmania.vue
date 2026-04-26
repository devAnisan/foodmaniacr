<template>
  <!-- modal del carrito  -->

  <section>
    <div
      v-if="loader"
      class="flex items-center justify-center h-screen fontColor text-2xl"
    >
      Cargando menú...
    </div>
  </section>
  <header class="fixed top-0 left-0 right-0 z-50 bg-white fontColor">
    <section v-if="menuOpen">
      <ul
        class="flex flex-col p-2 box-border absolute top-25 right-4 bg-white rounded-lg shadow-lg w-40 space-y-2"
      >
        <li class="p-1"><a href="#">Inicia sesión</a></li>
        <li class="p-1">
          <button @click="openMenu()">Ver carrito</button>
        </li>
      </ul>
    </section>
    <section>
      <section
        v-if="menuItems === true"
        class="border rounded-lg absolute right-4 top-20 z-50 bg-white mt-2 shadow-lg"
      >
        <div class="flex p-4 fontColor justify-between items-center">
          <section>
            <span class="text-2xl"> Carrito de compras </span>
            <span class="pi pi-shopping-cart px-1 font-bold"></span>
          </section>
          <span
            class="pi pi-times hover:cursor-pointer text-red-500 hover:text-red-700 p-2 rounded"
            @click="menuItems = false"
          ></span>
        </div>
        <div>
          <div>
            <span
              v-if="cartStore.items.length === 0"
              class="text-center text-gray-500 block p-4 fontColor border-t"
            >
              Aún no has agregado nada a tu carrito.
            </span>
          </div>
          <div
            v-for="value in cartStore.items"
            :key="value.id"
            class="flex fontColor justify-between items-center border-t p-2"
          >
            <div class="w-1/2 p-2">
              {{ value.nombre }} x{{ value.cantidad }}
            </div>
            <div class="w-1/2 p-2 text-right">
              ₡{{ value.precio * value.cantidad }}
            </div>
            <div>
              <button
                @click="cartStore.deleteItem(value.id)"
                class="text-red-500 hover:text-red-700 p-2 rounded hover:cursor-pointer"
              >
                <span class="pi pi-trash"></span>
              </button>
            </div>
            <div>
              <button
                @click="cartStore.removeItem(value.id)"
                class="text-red-500 hover:text-red-700 p-2 rounded hover:cursor-pointer"
              >
                <span class="pi pi-minus"></span>
              </button>
            </div>
            <div
              @click="cartStore.addItem(value)"
              class="hover:cursor-pointer fontColor hover:text-green-700 p-2 rounded"
            >
              <span class="pi pi-plus"></span>
            </div>
          </div>
          <div
            class="flex justify-between p-4 fontColor text-lg font-bold border-t"
          >
            <span> Total: </span>
            ₡{{ cartStore.total }}
          </div>
          <div>
            <button
              class="w-full bg-[#642d81] text-white p-2 rounded hover:bg-[#422d4d] transition-colors duration-300 hover:cursor-pointer"
            >
              <a href="/checkout" target="_blank">Finalizar compra</a>
            </button>
          </div>
        </div>
      </section>
    </section>
    <nav class="flex md:hidden items-center justify-between p-4 shadow-sm">
      <section class="flex items-center space-x-2 hover:cursor-pointer">
        <img class="w-15" :src="imageUrl" alt="Foodmania Logo" />
        <span id="extrabold">Food</span>
        <span id="extrabold" class="title">mania</span>
      </section>
      <section>
        <span
          class="material-symbols-outlined hover:cursor-pointer"
          @click="menuOpen = !menuOpen"
        >
          menu
        </span>
      </section>
    </nav>
    <!-- Pantallas medianas -->
    <nav class="hidden md:flex items-center justify-between p-4 shadow-sm">
      <section class="flex items-center space-x-2 hover:cursor-pointer">
        <img :src="imageUrl" alt="Foodmania Logo" />
        <span id="extrabold">Food</span>
        <span id="extrabold" class="title">mania</span>
      </section>

      <section class="flex space-x-6">
        <button
          id="extrabold"
          class="border my-0.5 p-2 pl-3 pr-3 rounded-full hover:cursor-pointer"
        >
          {{ user ? "Ordena aquí" : "Inicia sesión" }}
          <a href="/menu" target="_blank"></a>
        </button>

        <button
          @click="menuItems = !menuItems"
          id="extrabold"
          class="border my-0.5 p-2 pl-3 pr-3 rounded-full hover:cursor-pointer flex justify-center items-center"
        >
          <span class="pi pi-shopping-cart"></span>
          <span class="ml-2">{{ cartStore.totalItems }}</span>
          <a href="/menu" target="_blank"></a>
        </button>
      </section>
    </nav>
  </header>
  <section
    @click="menuItems = false"
    class="p-4 pt-24 fontColor"
    v-for="categoria in categorias"
    :key="categoria.coleccion"
  >
    <div class="m-4">
      <h1 class="p-2 title text-center text-4xl font-bold">
        {{ categoria.nombre }}
      </h1>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 fontColor text-center">
      <div v-for="item in categoria.productos" :key="item.id">
        <div class="bg-white rounded-lg shadow-md p-4">
          <img
            v-if="item.imageUrl"
            :src="item.imageUrl"
            alt="Imagen del producto"
            class="w-full h-32 object-cover mb-4 rounded"
          />
          <div
            v-else
            class="w-full h-32 bg-gray-300 flex items-center justify-center mb-4 rounded"
          >
            <span class="text-gray-500">🍽️</span>
          </div>
          <h2 class="font-bold mb-2">{{ item.nombre }}</h2>
          <p class="text-gray-600 mb-2">{{ item.descripcion }}</p>
          <p class="font-bold">₡{{ item.precio }}</p>
          <section>
            <button
              @click="cartStore.addItem(item)"
              class="mt-2 bg-[#642d81] text-white px-4 py-2 rounded hover:cursor-pointer hover:bg-[#422d4d] transition-colors duration-300"
            >
              Agregar al carrito
            </button>
          </section>
        </div>
      </div>
    </div>
  </section>
  <Footer />
</template>

<script setup>
import { ref as vueRef, onMounted, watch } from "vue";
import { ref as storageRef, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase.js";
import Footer from "./Footer.vue";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase.js";
import { useCartStore } from "../stores/carStores.js";
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

const loader = vueRef(true);
const menuOpen = vueRef(false);
const imageUrl = vueRef("");

const openMenu = () => {
  menuOpen.value = !menuOpen.value;
  menuItems.value = true;
};

onMounted(async () => {
  const imgRef = storageRef(storage, "FoodMania/foodManiaLogo.svg");
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
