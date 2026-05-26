<template>
  <div class="flex flex-col items-center p-8 gap-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
      <a
        v-for="(value, index) in whereBuyData"
        :key="index"
        :href="value.url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl shadow-md border border-transparent hover:border-[var(--primary)] hover:shadow-xl transition-all duration-300 cursor-pointer"
      >
        <img
          :src="value.logo"
          :alt="value.nombre"
          class="w-16 h-16 object-contain"
        />
        <h3 class="text-sm font-semibold text-center">{{ value.nombre }}</h3>
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref as vueRef, onMounted } from "vue";
// storage
import { ref as storageRef, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase.js";
// docs
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase.js";

const props = defineProps({
  sucursal: Object,
});
const whereBuyData = vueRef([]);

onMounted(async () => {
  const docRef = collection(db, "foodmaniaPedir");
  const docSnap = await getDocs(docRef);

  docSnap.forEach(async (doc) => {
    const docData = doc.data();
    const imgRef = storageRef(storage, docData.logo);
    const url = await getDownloadURL(imgRef);

    whereBuyData.value.push({
      ...docData,
      logo: url,
    });
  });
});
</script>
