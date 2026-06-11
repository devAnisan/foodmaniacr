<template>
  <footer class="bg-[var(--primary)] text-white py-4">
    <div class="container mx-auto text-center">
      <p>&copy; {{ GetYear  }} Foodmania. Todos los derechos reservados.</p>
      <p class="text-xs text-white/60 mt-1">v{{ version }}</p>
      <p>
        Desarrollado por Daniel Mejía |
        <a
          href="https://github.com/devAnisan"
          target="_blank"
          rel="noopener noreferrer"
          class="text-white hover:underline"
        >
          GitHub
        </a>
      </p>
    </div>
  </footer>
</template>

<script setup>
import { version } from '../../package.json'

const dateYear = new Date();
const GetYear = dateYear.getFullYear();

</script>
