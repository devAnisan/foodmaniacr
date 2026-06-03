<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 bg-black/50 z-90 flex items-center justify-center p-4" @click="cerrar">
      <div @click.stop class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-bounce-in">
        <div class="bg-gradient-to-br from-purple-700 to-yellow-500 p-6 text-center relative">
          <button @click="cerrar" class="absolute top-3 right-3 text-white/80 hover:text-white text-2xl hover:cursor-pointer pi pi-times"></button>
          <p class="text-6xl mb-2">🔥</p>
          <p class="text-white font-bold text-3xl">¡Martes FoodManiacos!</p>
          <p class="text-yellow-200 font-bold text-lg mt-1">🪙 ManiaCoins x2</p>
        </div>
        <div class="p-6 text-center">
          <p class="text-gray-700 text-base">
            Todos los <strong>martes</strong>, todas tus compras por la página acumulan
            <strong class="text-purple-700">el doble de ManiaCoins</strong> 🪙
          </p>
          <div class="bg-purple-50 border border-purple-200 rounded-xl p-4 mt-4">
            <p class="text-sm text-purple-800">
              💡 Ejemplo: Gastá ₡10,000 → ganá <strong>200 ManiaCoins</strong> en vez de 100
            </p>
          </div>
          <button @click="cerrar"
            class="mt-5 w-full bg-gradient-to-r from-purple-700 to-yellow-500 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity hover:cursor-pointer">
            ¡Aprovechar! 🎉
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const visible = ref(false)

const esMartes = () => new Date().getDay() === 2

const mostrarModal = () => {
  if (esMartes()) {
    const visto = localStorage.getItem('martesFoodManiacos_visto')
    if (!visto) {
      visible.value = true
    }
  }
}

const cerrar = () => {
  visible.value = false
  localStorage.setItem('martesFoodManiacos_visto', 'true')
}

onMounted(() => {
  setTimeout(mostrarModal, 1000)
})
</script>
