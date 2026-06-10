<template>
  <Teleport to="body">
    <div v-if="showBanner"
      class="fixed bottom-20 left-0 right-0 z-50 bg-white border-t-2 border-yellow-500 shadow-2xl p-4 animate-slide-up">
      <div class="max-w-lg mx-auto flex items-center gap-3">
        <span class="text-3xl">🔔</span>
        <div class="flex-1">
          <p class="text-sm font-bold text-yellow-700">Recibí promos y novedades</p>
          <p class="text-xs text-gray-500">Activá las notificaciones para enterarte de ofertas exclusivas</p>
        </div>
        <button @click="activar"
          class="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-yellow-600 transition-colors hover:cursor-pointer whitespace-nowrap">
          Activar
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
import { auth } from '../firebase.js'
import { useNotifications } from '../composable/useNotifications.js'

const emit = defineEmits(['permiso-concedido', 'permiso-denegado'])
const showBanner = ref(false)
const { tienePermiso, permisoPendiente, solicitarPermiso } = useNotifications()

const activar = async () => {
  const uid = auth.currentUser?.uid
  if (!uid) {
    cerrar()
    return
  }
  const token = await solicitarPermiso(uid)
  if (token) {
    emit('permiso-concedido', token)
  } else {
    emit('permiso-denegado')
  }
  showBanner.value = false
}

const cerrar = () => {
  showBanner.value = false
  localStorage.setItem('notif_banner_dismissed', 'true')
}

onMounted(() => {
  if (tienePermiso()) return
  if (!permisoPendiente()) return
  if (localStorage.getItem('notif_banner_dismissed')) return

  setTimeout(() => {
    showBanner.value = true
  }, 6000)
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
