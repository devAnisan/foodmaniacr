<template>
    <div v-if="descuentoGlobalStore.activo"
        class="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white text-center py-2 px-4 text-sm font-bold shadow-sm">
        🎉 ¡Descuento especial del {{ descuentoGlobalStore.porcentaje }}% en todo tu pedido!
    </div>
</template>

<script setup>
import { useDescuentoGlobalStore } from '../stores/cartStores.js'

const descuentoGlobalStore = useDescuentoGlobalStore()
</script>
