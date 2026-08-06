import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/vue") || id.includes("node_modules/pinia") || id.includes("node_modules/vue-router")) return "vendor"
          // firebase/messaging solo se carga por import() dinámico (ver useNotifications.js);
          // se deja fuera del chunk "firebase" para que Rollup lo separe en su propio chunk
          // cargado solo cuando se pide, en vez de ir en el bundle inicial de todas las páginas.
          if (id.includes("node_modules/firebase/messaging")) return undefined
          if (id.includes("node_modules/firebase")) return "firebase"
        },
      },
    },
    chunkSizeWarningLimit: 400,
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
