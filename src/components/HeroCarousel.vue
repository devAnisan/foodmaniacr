<template>
  <div class="w-full relative h-64 md:h-150">
    <img
      v-if="images.length > 0"
      :src="images[currentIndex]"
      alt="heroImages"
      class="w-full h-full object-cover"
    />
    <button
      class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white text-black p-2 rounded-full shadow-lg"
      @click="emitBackCarousel()"
    >
      ←
    </button>
    <button
      class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white text-black p-2 rounded-full shadow-lg"
      @click="emitNextCarousel()"
    >
      →
    </button>

    <div
      class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 shadow-lg bg-white pr-2 pl-2 rounded-full"
    >
      <span
        v-for="(_, index) in images"
        :key="index"
        class="cursor-pointer"
        @click="currentIndex = index"
      >
        {{ index === currentIndex ? "●" : "○" }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref as storageRef, getDownloadURL, listAll } from "firebase/storage";
import { storage } from "../firebase.js";

import { ref as refVue, onMounted, onUnmounted } from "vue";
const images = refVue([]);
const currentIndex = refVue(0);

let intervalo = null;

function emitNextCarousel() {
  currentIndex.value = (currentIndex.value + 1) % images.value.length;
}

function emitBackCarousel() {
  currentIndex.value =
    (currentIndex.value - 1 + images.value.length) % images.value.length;
}

onMounted(async () => {
  const carpetaRef = storageRef(storage, "FoodMania/FoodMania_Carrousel/");
  const resultado = await listAll(carpetaRef);
  for (const itemRef of resultado.items) {
    const url = await getDownloadURL(itemRef);
    images.value.push(url);
  }
  setInterval(emitNextCarousel, 5000);
});

onUnmounted(() => {
  clearInterval(intervalo);
});
</script>
