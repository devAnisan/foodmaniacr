<template>
  <footer class="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white pt-10 pb-6 px-4">
    <div class="max-w-4xl mx-auto flex flex-col items-center gap-6 text-center">
      <img src="/logoFoodmania4.PNG" alt="Foodmania" class="w-16 h-16 object-contain rounded-full border-2 border-white/40 bg-white" />

      <div class="flex gap-3">
        <a href="https://www.instagram.com/foodmaniacr/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
          class="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          <i class="fa fa-instagram text-lg"></i>
        </a>
        <a href="https://www.facebook.com/FoodManiaGuapiles" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
          class="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          <i class="fa fa-facebook text-lg"></i>
        </a>
        <a href="https://www.tiktok.com/@foodmaniacr_" target="_blank" rel="noopener noreferrer" aria-label="TikTok"
          class="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current"><path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.31 1.38V7.3s-1.88.09-3.24-1.48Z"/></svg>
        </a>
      </div>

      <RouterLink to="/menu" target="_blank"
        class="bg-white text-[var(--primary)] font-bold px-6 py-2 rounded-full hover:bg-gray-100 transition-colors hover:cursor-pointer shadow-lg">
        Ordena aquí
      </RouterLink>

      <div class="w-full border-t border-white/20 pt-4 text-xs text-white/70 space-y-1">
        <p>&copy; {{ GetYear  }} Foodmania. Todos los derechos reservados.</p>
        <p class="text-white/50">v{{ version }}</p>
        <p>
          Desarrollado por Daniel Mejía (Anisan) ·
          <a
            href="https://github.com/devAnisan"
            target="_blank"
            rel="noopener noreferrer"
            class="text-white hover:underline"
          >
            GitHub
          </a>
          ·
          <a
            href="https://portfolio-anisan.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            class="text-white hover:underline"
          >
            Portfolio
          </a>
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { version } from '../../package.json'

const dateYear = new Date();
const GetYear = dateYear.getFullYear();

</script>
