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
