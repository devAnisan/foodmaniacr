<template>
  <!-- Pantallas pequeñas -->
  <section class="flex flex-col justify-center items-center p-4 pt-20 pb-3">
    <div class="flex space-x-2 mb-4 items-center">
      <div class="hidden md:block">
        <span class="heading-font extrabold text-4xl mr-2">Nuestras</span>
        <span class="heading-font extrabold text-4xl title">sucursales</span>
      </div>
      <div class="block md:hidden">
        <span class="heading-font extrabold text-2xl mr-1">Nuestras</span>
        <span class="heading-font extrabold text-2xl title">sucursales</span>
      </div>
    </div>
    <div class="flex flex-wrap justify-center gap-6">
      <div
        class="w-full md:w-72 flex flex-col items-center p-5 shadow-lg rounded-2xl border border-gray-100 hover:shadow-xl hover:border-[var(--primary)]/20 transition-all duration-300"
        v-for="value in sucursales"
        :key="value.Nombre"
      >
        <img
          :src="value.foto_local"
          :alt="value.Nombre"
          class="w-full h-44 object-cover rounded-xl"
        />
        <h2 class="extrabold text-[var(--primary)] text-2xl mt-4 mb-3">
          {{ value.Nombre }}
        </h2>
        <div class="w-full space-y-1.5 text-sm text-gray-600">
          <p>📍 {{ value.Direccion }}</p>
          <p>🕛 {{ value.horario }}</p>
          <p>📞 {{ value.nCelular }}</p>
        </div>
        <div class="flex space-x-3 mt-4 w-full">
          <a
            :href="value.maps"
            target="_blank"
            class="flex-1 flex items-center justify-center border border-[var(--primary)]/30 text-[var(--primary)] py-2 rounded-xl hover:bg-[var(--primary)] hover:text-white transition-all duration-300"
          >
            <i class="fa fa-map"></i>
          </a>
          <a
            :href="value.Whatsapp_Api"
            target="_blank"
            class="flex-1 flex items-center justify-center border border-[var(--primary)]/30 text-[var(--primary)] py-2 rounded-xl hover:bg-[var(--primary)] hover:text-white transition-all duration-300"
          >
            <i class="fa fa-whatsapp text-xl"></i>
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
