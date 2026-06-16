<template>
  <Teleport to="body">
    <div v-if="showBanner"
      class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-[var(--primary)] shadow-2xl p-4 animate-slide-up">
      <div class="max-w-lg mx-auto flex items-center gap-3">
        <span class="text-3xl">📲</span>
        <div class="flex-1">
          <p class="text-sm font-bold text-[var(--primary)]">Agregá Foodmania a tu inicio</p>
          <p class="text-xs text-gray-500">Accedé más rápido a tu comida favorita</p>
        </div>
        <button @click="instalar"
          class="bg-[var(--primary)] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer whitespace-nowrap">
          Instalar
        </button>
        <button @click="cerrar"
          class="text-gray-400 hover:text-gray-600 p-1 hover:cursor-pointer">
          <span class="pi pi-times"></span>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const showBanner = ref(false)
let deferredPrompt = null
const alreadyInstalled = ref(false)

const yaInstalado = () => {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}

const cerrar = () => {
  showBanner.value = false
  localStorage.setItem('pwa_install_dismissed', 'true')
}

const instalar = async () => {
  if (!deferredPrompt) return
  deferredPrompt.prompt()
  const result = await deferredPrompt.userChoice
  if (result.outcome === 'accepted') {
    localStorage.setItem('pwa_installed', 'true')
  }
  deferredPrompt = null
  showBanner.value = false
}

onMounted(() => {
  if (yaInstalado()) return
  if (localStorage.getItem('pwa_install_dismissed')) return
  if (localStorage.getItem('pwa_installed')) return

  navigator.serviceWorker.ready.then(() => {
    if (window.deferredInstallPrompt) {
      deferredPrompt = window.deferredInstallPrompt
      showBanner.value = true
    }
  })

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    window.deferredInstallPrompt = e
    showBanner.value = true
  })

  window.addEventListener('appinstalled', () => {
    showBanner.value = false
    deferredPrompt = null
    localStorage.setItem('pwa_installed', 'true')
  })
})
</script>

<style scoped>
@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-slide-up {
  animation: slide-up 0.4s ease-out;
}
</style>
