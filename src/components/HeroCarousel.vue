<template>
  <div class="w-full relative aspect-video overflow-hidden bg-gradient-to-br from-[var(--primary)] via-[var(--primary-dark)] to-[var(--accent-dark)]">
    <!-- Manchas decorativas de fondo, visibles cuando aun no hay imagenes cargadas -->
    <div class="absolute -top-10 -left-10 w-56 h-56 rounded-full bg-[var(--accent)]/30 blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>

    <Transition name="fade">
      <img
        :key="currentIndex"
        v-if="images.length > 0"
        :src="images[currentIndex]"
        alt="heroImages"
        class="w-full h-full object-cover absolute inset-0"
      />
    </Transition>

    <!-- Degradado inferior para legibilidad del tagline -->
    <div class="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none"></div>

    <!-- Tagline de marca -->
    <div class="absolute left-0 right-0 bottom-10 px-6 text-center pointer-events-none">
      <h2 class="heading-font extrabold text-white text-2xl md:text-4xl drop-shadow-lg">
        ¡El sabor que se te antoja!
      </h2>
      <p class="text-white/90 text-sm md:text-base mt-1 drop-shadow">
        Pedí en línea y recibilo donde estés
      </p>
    </div>

    <template v-if="images.length > 0">
      <button
        class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-[var(--primary)] w-9 h-9 flex items-center justify-center rounded-full shadow-lg transition-colors hover:cursor-pointer"
        @click="emitBackCarousel()"
      >
        <span class="pi pi-chevron-left text-sm"></span>
      </button>
      <button
        class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-[var(--primary)] w-9 h-9 flex items-center justify-center rounded-full shadow-lg transition-colors hover:cursor-pointer"
        @click="emitNextCarousel()"
      >
        <span class="pi pi-chevron-right text-sm"></span>
      </button>

      <div
        class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1.5"
      >
        <span
          v-for="(_, index) in images"
          :key="index"
          class="h-1.5 rounded-full cursor-pointer transition-all duration-300"
          :class="index === currentIndex ? 'w-6 bg-[var(--accent)]' : 'w-1.5 bg-white/60 hover:bg-white/90'"
          @click="currentIndex = index"
        ></span>
      </div>
    </template>
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
  intervalo = setInterval(emitNextCarousel, 5000);
});

onUnmounted(() => {
  clearInterval(intervalo);
});
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
