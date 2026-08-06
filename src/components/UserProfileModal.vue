<template>
    <section v-if="auth.showUserModal.value && auth.user.value"
        class="fixed top-20 right-4 z-90 bg-white p-4 rounded-2xl shadow-xl fontColor w-64 text-center">
        <section class="flex justify-between border-b p-2 mb-3">
            <span class="font-bold">Hola, {{ auth.user.value.email.split('@')[0] }} 👋</span>
            <span class="pi pi-times text-red-500 hover:cursor-pointer" @click="auth.showUserModal.value = false"></span>
        </section>
        <section class="flex flex-col items-center gap-3">
            <span class="text-sm text-gray-500">{{ auth.user.value.email }}</span>
            <span> </span>
            <span class="text-sm font-bold">{{ auth.user.value.emailVerified ? '✅ Email verificado' : '⚠️ Email no verificado'
                }}</span>
            <div v-if="maniaCoins && maniaCoins.puntosUsuario !== null" class="bg-gradient-to-r from-purple-50 to-yellow-50 border border-purple-200 rounded-lg px-4 py-2 w-full">
              <div class="flex items-center justify-center gap-2">
                <img :src="assets.coinIconUrl" alt="ManiaCoins" class="w-5 h-5 object-contain" />
                <span class="font-bold text-yellow-700">{{ maniaCoins.coinsValidos }} ManiaCoins</span>
              </div>
              <p v-if="maniaCoins.tiempoRestante" class="text-[10px] text-gray-400 text-center mt-0.5">
                ⏳ Expiran en {{ maniaCoins.tiempoRestante }}
              </p>
              <p v-if="maniaCoins.nivelUsuario" class="text-[10px] text-purple-600 font-bold text-center mt-0.5">
                👑 {{ maniaCoins.nivelUsuario.nombre }} — {{ maniaCoins.nivelUsuario.beneficios }}
              </p>
              <p v-else-if="maniaCoins.puntosUsuario >= 500" class="text-[10px] text-red-400 text-center mt-0.5">
                ⚠️ Coins vencidos o sin compras recientes
              </p>
              <p v-else class="text-[10px] text-gray-400 text-center mt-0.5 flex items-center justify-center gap-1">
                Faltan {{ 500 - maniaCoins.puntosUsuario }} <img :src="assets.coinIconUrl" alt="ManiaCoins" class="w-3 h-3 inline-block" /> para Rookie
              </p>
            </div>
            <div v-if="cumpleanosFormateado" class="bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 rounded-lg px-4 py-2 w-full">
              <div class="flex items-center justify-center gap-2">
                <span class="text-lg">🎂</span>
                <span class="font-bold text-pink-600">{{ cumpleanosFormateado }}</span>
              </div>
              <p v-if="esCumpleanosHoy" class="text-[10px] text-red-500 font-bold text-center mt-0.5">
                🎉 {{ mensajeCumpleanos }}
              </p>
            </div>
            <button v-if="maniaCoins" @click="$emit('editar-perfil')"
                class="w-full bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
                Editar perfil
            </button>
            <button @click="auth.cerrarSesion"
                class="w-full bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
                Cerrar sesión
            </button>
        </section>
    </section>
</template>

<script setup>
import { useAssets } from '../stores/cartStores.js'

defineProps({
    auth: { type: Object, required: true },
    cumpleanosFormateado: { type: String, default: '' },
    esCumpleanosHoy: { type: Boolean, default: false },
    mensajeCumpleanos: { type: String, default: '¡Feliz cumpleaños! Hoy tenés beneficios especiales' },
    // null en la landing (sin ManiaCoins); objeto { puntosUsuario, coinsValidos, nivelUsuario, tiempoRestante } en /menu
    maniaCoins: { type: Object, default: null }
})

defineEmits(['editar-perfil'])

const assets = useAssets()
</script>
