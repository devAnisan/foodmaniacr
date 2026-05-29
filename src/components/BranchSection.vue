<template>
  <!-- Pantallas pequeñas -->
  <section class="flex flex-col justify-center items-center p-4 pt-20 pb-3">
    <div class="flex space-x-2 mb-4 items-center">
      <div class="hidden md:block">
        <span id="title" class="extrabold text-4xl mr-2">Nuestras</span>
        <span id="title" class="extrabold text-4xl title">sucursales</span>
      </div>
      <div class="block md:hidden">
        <span id="title" class="extrabold text-1xl mr-1">Nuestras</span>
        
        <span id="title" class="extrabold text-1xl title">sucursales</span>
      </div>
    </div>
    <div class="flex flex-wrap justify-center gap-4">
      <div
        class="w-full md:w-72 flex flex-col justify-center items-center p-4 shadow-lg rounded-lg mb-4"
        v-for="value in sucursales"
        :key="value.Nombre"
      >
        <img
          :src="value.foto_local"
          :alt="value.Nombre"
          class="w-full h-40 object-cover rounded-lg"
        />
        <h2 class="extrabold text-2xl mt-4 mb-2">
          {{ value.Nombre }}
        </h2>
        <p>📍 Dirección: {{ value.Direccion }}</p>
        <p>🕛 Horario: {{ value.horario }}</p>
        <p>📞 Teléfono: {{ value.nCelular }}</p>
        <div class="flex space-x-2 mt-2">
          <a
            :href="value.maps"
            target="_blank"
            class="flex items-center justify-center border py-1 pl-5 pr-5 rounded-2xl hover:bg-[#ccbcd4]"
          >
            <i class="fa fa-map"></i>
          </a>
          <a
            :href="value.Whatsapp_Api"
            target="_blank"
            class="flex items-center justify-center border py-1 pl-5 pr-5 rounded-2xl hover:bg-[#ccbcd4]"
          >
            <i class="fa fa-whatsapp" style="font-size: 26px"></i>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref as vueRef, onMounted } from "vue";
import { ref as storageRef, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase.js";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase.js";
import { useSucursales } from "../stores/cartStores.js";

const sucursalesStore = useSucursales()
const sucursales = vueRef([]);

onMounted(async () => {
  let data = sucursalesStore.sucursalesFoodMania

  if (data.length === 0) {
    const docSnap = await getDocs(collection(db, "Sucursales de Foodmania"));
    data = []
    docSnap.forEach(doc => data.push(doc.data()))
    sucursalesStore.sucursalesFoodMania = data
  }

  const results = await Promise.all(data.map(async (item) => {
    const imgRef = storageRef(storage, item.foto_local);
    const url = await getDownloadURL(imgRef);
    return { ...item, foto_local: url };
  }))

  sucursales.value = results;
});
</script>
