<template>
    <!-- Overlay -->
    <div v-if="modelValue" class="fixed inset-0 bg-black/50 z-70" @click="$emit('update:modelValue', false)"></div>

    <!-- Modal -->
    <div v-if="modelValue" class="fixed inset-0 z-80 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md fontColor overflow-y-auto max-h-[90vh]">

            <!-- Header -->
            <div class="flex justify-between items-center p-5 border-b">
                <div class="flex items-center gap-2">
                    <span class="pi pi-shopping-bag text-xl"></span>
                    <span class="text-2xl font-bold">Finalizar compra</span>
                </div>
                <button @click="$emit('update:modelValue', false)"
                    class="pi pi-times text-red-500 hover:text-red-700 hover:cursor-pointer p-2 rounded"></button>
            </div>

            <!-- Loader -->
            <div v-if="loadingUsuario" class="flex justify-center items-center p-6">
                <span class="pi pi-spinner animate-spin text-3xl text-[#642d81]"></span>
            </div>

            <div v-else>

                <!-- ✅ Carrito vacío -->
                <div v-if="cartStore.items.length === 0"
                    class="flex flex-col items-center justify-center p-10 gap-4 text-center">
                    <p class="text-5xl">🛒</p>
                    <p class="text-lg font-bold text-gray-500">Tu carrito está vacío</p>
                    <p class="text-sm text-gray-400">Agregá productos al carrito antes de finalizar la compra.</p>
                    <button @click="$emit('update:modelValue', false)"
                        class="bg-[#642d81] text-white px-6 py-2 rounded-full font-bold hover:bg-[#422d4d] transition-colors hover:cursor-pointer">
                        Ver menú
                    </button>
                </div>

                <!-- ✅ Fuera de horario (solo si es domicilio o no ha decidido programar) -->
                <div v-else-if="fueraDeHorario && withDrawType === 'domicilio'"
                    class="flex flex-col items-center justify-center p-10 gap-4 text-center">
                    <p class="text-5xl">🕐</p>
                    <p class="text-lg font-bold text-gray-500">Estamos cerrados</p>
                    <p class="text-sm text-gray-400">
                        Nuestro horario de delivery es <strong>Lunes a Domingo, 11am a 11pm</strong>.<br />
                        Podés programar un retiro en sucursal para otra hora.
                    </p>
                    <button @click="withDrawType = 'sucursal'"
                        class="bg-[#642d81] text-white px-6 py-2 rounded-full font-bold hover:bg-[#422d4d] transition-colors hover:cursor-pointer">
                        Programar retiro en sucursal
                    </button>
                </div>

                <!-- Contenido normal -->
                <div v-else>

                    <!-- Resumen del pedido -->
                    <div class="p-5 border-b bg-gray-50">
                        <h2 class="font-bold mb-3">Resumen del pedido</h2>
                        <div v-for="item in cartStore.items" :key="item.id" class="flex justify-between text-sm mb-1">
                            <span>{{ item.nombre }} x{{ item.cantidad }}</span>
                            <span>₡{{ item.precio * item.cantidad }}</span>
                        </div>
                        <!-- ✅ Envío solo en domicilio -->
                        <div v-if="withDrawType === 'domicilio' && costoEnvio > 0"
                            class="flex justify-between text-sm text-gray-500 mt-2 pt-2 border-t border-dashed">
                            <span>🛵 Envío ({{ locationStore.distancia }} km)</span>
                            <span>₡{{ costoEnvio }}</span>
                        </div>
                        <div class="flex justify-between font-bold mt-3 pt-3 border-t">
                            <span>Total</span>
                            <span>₡{{ totalConEnvio }}</span>
                        </div>
                    </div>

                    <!-- Datos del cliente -->
                    <div class="p-5 border-b">
                        <h2 class="font-bold mb-3">Tus datos</h2>
                        <div class="flex flex-col gap-3">
                            <div>
                                <label class="text-sm text-gray-500 block mb-1">Nombre</label>
                                <input v-model="datosCliente.nombre" type="text" placeholder="Tu nombre completo"
                                    class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#642d81]" />
                            </div>
                            <div>
                                <label class="text-sm text-gray-500 block mb-1">Teléfono</label>
                                <input v-model="datosCliente.telefono" type="tel" placeholder="Ej: 8888-0000"
                                    class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#642d81]" />
                            </div>
                        </div>
                    </div>

                    <!-- Tipo de retiro -->
                    <div class="p-5 border-b">
                        <h2 class="font-bold mb-3">Tipo de retiro</h2>
                        <div class="flex gap-2">
                            <button @click="withDrawType = 'sucursal'"
                                :class="withDrawType === 'sucursal' ? 'bg-[#642d81] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
                                class="flex-1 py-2 rounded transition-colors duration-300 hover:cursor-pointer">
                                🏪 Sucursal
                            </button>
                            <button @click="withDrawType = 'domicilio'"
                                :class="withDrawType === 'domicilio' ? 'bg-[#642d81] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
                                class="flex-1 py-2 rounded transition-colors duration-300 hover:cursor-pointer">
                                🛵 Domicilio
                            </button>
                        </div>
                    </div>

                    <!-- Datos según tipo de retiro -->
                    <div class="p-5 border-b">

                        <!-- SUCURSAL -->
                        <div v-if="withDrawType === 'sucursal'" class="flex flex-col gap-4">
                            <div>
                                <label class="text-sm text-gray-500 block mb-1">Sucursal de retiro</label>
                                <select v-model="sucursalSeleccionada" @change="actualizarNcelularPorSucursal"
                                    class="w-full p-2 border rounded-lg">
                                    <option value="">Seleccioná una sucursal</option>
                                    <option v-for="suc in sucursalesStore.sucursalesFoodMania" :key="suc.Nombre"
                                        :value="suc.Nombre">
                                        {{ suc.Nombre }}
                                    </option>
                                </select>
                            </div>
                            <div>
                                <label class="text-sm text-gray-500 block mb-1">¿Qué día pasarás?</label>
                                <input v-model="fechaRetiro" type="date" :min="hoy"
                                    class="w-full p-2 border rounded-lg" />
                            </div>
                            <div>
                                <label class="text-sm text-gray-500 block mb-1">¿A qué hora pasarás?</label>
                                <input v-model="horaRetiro" type="time" min="11:00" max="23:00"
                                    class="w-full p-2 border rounded-lg" />
                                <p class="text-xs text-gray-400 mt-1">Horario: Lun–Dom, 11:00am – 11:00pm</p>
                            </div>
                        </div>

                        <!-- DOMICILIO -->
                        <div v-else class="flex flex-col gap-4">
                            <div>
                                <label class="text-sm text-gray-500 block mb-1">Dirección exacta de entrega</label>
                                <textarea v-model="datosCliente.direccion"
                                    placeholder="Ej: 100m norte del parque central, casa azul con portón negro"
                                    class="w-full p-2 border rounded-lg resize-none" rows="3"></textarea>
                            </div>
                            <div>
                                <label class="text-sm text-gray-500 block mb-1">Tu ubicación GPS</label>
                                <button @click="obtenerUbicacion()"
                                    class="w-full py-2 border-2 border-dashed border-[#642d81] rounded-lg text-[#642d81] font-bold hover:bg-purple-50 transition-colors hover:cursor-pointer">
                                    📍 Usar mi ubicación actual
                                </button>
                                <div v-if="ubicacionObtenida"
                                    class="mt-2 bg-green-50 border border-green-200 rounded-lg p-3 text-sm flex justify-between items-center">
                                    <div>
                                        <p class="text-green-600 font-bold">✅ Ubicación obtenida</p>
                                        <p class="text-gray-500 mt-1">Sucursal más cercana: <strong>{{
                                                locationStore.sucursalCercana }}</strong></p>
                                        <p class="text-gray-500">Distancia: {{ locationStore.distancia }} km</p>
                                    </div>
                                    <button @click="abrirEnMaps"
                                        class="ml-2 bg-[#642d81] text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-[#422d4d] transition-colors hover:cursor-pointer flex items-center gap-1">
                                        <span class="pi pi-map-marker"></span>
                                        Ver en Maps
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Método de pago -->
                    <div class="p-5 border-b">
                        <h2 class="font-bold mb-3">Método de pago</h2>
                        <div class="flex gap-2 mb-4">
                            <button @click="metodoPago = 'efectivo'"
                                :class="metodoPago === 'efectivo' ? 'bg-[#642d81] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
                                class="flex-1 py-2 rounded transition-colors duration-300 hover:cursor-pointer">
                                💵 Efectivo
                            </button>
                            <button @click="metodoPago = 'sinpe'"
                                :class="metodoPago === 'sinpe' ? 'bg-[#642d81] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
                                class="flex-1 py-2 rounded transition-colors duration-300 hover:cursor-pointer">
                                📱 SINPE Móvil
                            </button>
                        </div>

                        <!-- Efectivo -->
                        <div v-if="metodoPago === 'efectivo'" class="flex flex-col gap-2">
                            <label class="text-sm text-gray-500">¿Con cuánto vas a pagar?</label>
                            <input v-model="montoEfectivo" type="number" placeholder="Ej: 10000"
                                class="w-full p-2 border rounded-lg" />
                            <div v-if="montoEfectivo && Number(montoEfectivo) >= totalConEnvio"
                                class="text-green-600 text-sm font-bold">
                                Vuelto estimado: ₡{{ Number(montoEfectivo) - totalConEnvio }}
                            </div>
                            <div v-else-if="montoEfectivo && Number(montoEfectivo) < totalConEnvio"
                                class="text-red-500 text-sm">
                                El monto es menor al total del pedido.
                            </div>
                        </div>

                        <!-- SINPE -->
                        <div v-if="metodoPago === 'sinpe'" class="bg-gray-50 rounded-lg p-3 text-sm text-center">
                            <p class="font-bold mb-1">SINPE Móvil al número:</p>
                            <p class="text-2xl font-bold text-[#642d81]">{{ nCelular || '—' }}</p>
                            <p class="text-xs text-gray-400 mt-1">
                                {{ withDrawType.value === 'sucursal' ? 'Número de la sucursal seleccionada' : 'Número de la sucursal más cercana' }}
                            </p>
                            <p class="text-gray-500 mt-2">Enviá el comprobante por WhatsApp al finalizar 📲</p>
                        </div>
                    </div>

                    <!-- Mensajes -->
                    <div class="px-5 pt-3">
                        <p v-if="errorMsg" class="text-red-500 text-sm">{{ errorMsg }}</p>
                        <p v-if="successMsg" class="text-green-500 text-sm">{{ successMsg }}</p>
                    </div>

                    <!-- Botón confirmar -->
                    <div class="p-5">
                        <button @click="confirmarPedido" :disabled="loading"
                            class="w-full bg-[#642d81] text-white py-3 rounded-xl font-bold hover:bg-[#422d4d] transition-colors duration-300 hover:cursor-pointer disabled:opacity-50">
                            <span v-if="loading" class="pi pi-spinner animate-spin mr-2"></span>
                            {{ loading ? 'Enviando pedido...' : 'Confirmar pedido 🎉' }}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref as vueRef, computed, watch } from 'vue'
import { useCartStore, useLocationStore, useSucursales } from '../stores/carStores.js'
import { db, auth } from '../firebase.js'
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore'
import { getLocation } from '../composable/saberDistancia.js'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])
const cartStore = useCartStore()
const locationStore = useLocationStore()
const sucursalesStore = useSucursales()

const hoy = new Date().toISOString().split('T')[0]

// ✅ Validación de horario — 11am a 11pm
const fueraDeHorario = computed(() => {
    const hora = new Date().getHours()
    return hora < 11 || hora >= 23
})

// Form
const withDrawType = vueRef('sucursal')
const sucursalSeleccionada = vueRef('')
const fechaRetiro = vueRef('')
const horaRetiro = vueRef('')
const metodoPago = vueRef('efectivo')
const montoEfectivo = vueRef('')
const nCelular = vueRef('')
const ubicacionObtenida = vueRef(false)
const loading = vueRef(false)
const loadingUsuario = vueRef(false)
const errorMsg = vueRef('')
const successMsg = vueRef('')

const datosCliente = vueRef({
    nombre: '',
    telefono: '',
    direccion: '',
    lat: '',
    lng: '',
    emailVerified: false
})

// ✅ Envío solo aplica en domicilio
const costoEnvio = computed(() => {
    if (withDrawType.value === 'domicilio' && locationStore.distancia) {
        return Math.round(locationStore.distancia * 300)
    }
    return 0
})

const totalConEnvio = computed(() => cartStore.total + costoEnvio.value)

// Cargar datos del usuario
const cargarDatosUsuario = async () => {
    if (!auth.currentUser) return
    loadingUsuario.value = true
    try {
        const docRef = doc(db, 'clientes', auth.currentUser.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
            const data = docSnap.data()
            datosCliente.value.nombre = data.nombre || ''
            datosCliente.value.telefono = data.telefono || ''
            datosCliente.value.direccion = data.direccion || ''
            datosCliente.value.lat = data.lat || ''
            datosCliente.value.lng = data.lng || ''
            datosCliente.value.emailVerified = data.emailVerified || false
        }
    } catch (error) {
        console.error('Error cargando datos:', error)
    } finally {
        loadingUsuario.value = false
    }
}

// ✅ nCelular de la sucursal SELECCIONADA (retiro en sucursal)
const actualizarNcelularPorSucursal = () => {
    const suc = sucursalesStore.sucursalesFoodMania.find(
        s => s.Nombre === sucursalSeleccionada.value
    )
    if (suc) nCelular.value = suc.nCelular
}

// ✅ Cuando cambia el tipo de retiro, actualiza el nCelular
watch(withDrawType, (tipo) => {
    if (tipo === 'sucursal') {
        actualizarNcelularPorSucursal()
    } else {
        // Domicilio → usar sucursal más cercana
        const suc = sucursalesStore.sucursalesFoodMania.find(
            s => s.Nombre === locationStore.sucursalCercana
        )
        if (suc) nCelular.value = suc.nCelular
    }
})

// Obtener ubicación GPS (domicilio → sucursal más cercana)
const obtenerUbicacion = () => {
    getLocation(sucursalesStore.sucursalesFoodMania)
    ubicacionObtenida.value = true
    sucursalesStore.sucursalesFoodMania.forEach((item) => {
        if (item.Nombre === locationStore.sucursalCercana) {
            nCelular.value = item.nCelular
        }
    })
}

const abrirEnMaps = () => {
    if (!datosCliente.value.lat || !datosCliente.value.lng) return
    window.open(`https://www.google.com/maps?q=${datosCliente.value.lat},${datosCliente.value.lng}`, '_blank')
}

const armarMensajeWhatsApp = () => {
    const items = cartStore.items
        .map(i => `• ${i.nombre} x${i.cantidad} — ₡${i.precio * i.cantidad}`)
        .join('\n')
    const pagoCadena = metodoPago.value === 'efectivo'
        ? `Efectivo (paga con ₡${montoEfectivo.value}, vuelto ₡${Number(montoEfectivo.value) - totalConEnvio.value})`
        : 'SINPE Móvil'

    if (withDrawType.value === 'sucursal') {
        return `🍔 *Nuevo pedido en Foodmania*\n\n` +
            `👤 Cliente: ${datosCliente.value.nombre}\n` +
            `📞 Teléfono: ${datosCliente.value.telefono}\n\n` +
            `📋 *Pedido:*\n${items}\n\n` +
            `💰 Total: ₡${totalConEnvio.value}\n` +
            `💳 Pago: ${pagoCadena}\n\n` +
            `🏪 Retiro en: ${sucursalSeleccionada.value}\n` +
            `📅 Fecha: ${fechaRetiro.value}\n` +
            `🕐 Hora: ${horaRetiro.value}`
    } else {
        return `🍔 *Nuevo pedido en Foodmania*\n\n` +
            `👤 Cliente: ${datosCliente.value.nombre}\n` +
            `📞 Teléfono: ${datosCliente.value.telefono}\n\n` +
            `📋 *Pedido:*\n${items}\n\n` +
            `💰 Subtotal: ₡${cartStore.total}\n` +
            `🛵 Envío (${locationStore.distancia} km): ₡${costoEnvio.value}\n` +
            `💰 Total: ₡${totalConEnvio.value}\n` +
            `💳 Pago: ${pagoCadena}\n\n` +
            `📍 Dirección: ${datosCliente.value.direccion}\n` +
            `🗺️ Ubicación: https://www.google.com/maps?q=${datosCliente.value.lat},${datosCliente.value.lng}`
    }
}

const confirmarPedido = async () => {
    errorMsg.value = ''
    successMsg.value = ''

    // ✅ Carrito vacío
    if (cartStore.items.length === 0)
        return errorMsg.value = 'Tu carrito está vacío. Agregá productos antes de continuar.'

    if (!datosCliente.value.nombre) return errorMsg.value = 'Ingresá tu nombre.'
    if (!datosCliente.value.telefono) return errorMsg.value = 'Ingresá tu teléfono.'

    if (withDrawType.value === 'sucursal') {
        if (!sucursalSeleccionada.value) return errorMsg.value = 'Seleccioná una sucursal.'
        if (!fechaRetiro.value) return errorMsg.value = 'Seleccioná una fecha de retiro.'
        if (!horaRetiro.value) return errorMsg.value = 'Seleccioná una hora de retiro.'
        // ✅ Validar hora dentro del horario
        const [hh] = horaRetiro.value.split(':').map(Number)
        if (hh < 11 || hh >= 23)
            return errorMsg.value = 'La hora de retiro debe ser entre 11:00am y 11:00pm.'
    } else {
        if (!datosCliente.value.direccion) return errorMsg.value = 'Ingresá la dirección de entrega.'
        if (!ubicacionObtenida.value) return errorMsg.value = 'Debés compartir tu ubicación para el envío a domicilio. 📍'
        if (!datosCliente.value.verifiedEmail) return errorMsg.value = 'Tu email no está verificado. Por favor, verificá tu email antes de realizar el pedido.'
    }

    if (metodoPago.value === 'efectivo') {
        if (!montoEfectivo.value) return errorMsg.value = 'Ingresá el monto con el que pagarás.'
        if (Number(montoEfectivo.value) < totalConEnvio.value)
            return errorMsg.value = 'El monto es menor al total del pedido.'
    }

    try {
        loading.value = true
        const pedido = {
            usuario: auth.currentUser?.email || 'Anónimo',
            nombre: datosCliente.value.nombre,
            telefono: datosCliente.value.telefono,
            items: cartStore.items,
            subtotal: cartStore.total,
            costoEnvio: costoEnvio.value,
            total: totalConEnvio.value,
            metodoPago: metodoPago.value,
            montoEfectivo: metodoPago.value === 'efectivo' ? Number(montoEfectivo.value) : null,
            vuelto: metodoPago.value === 'efectivo' ? Number(montoEfectivo.value) - totalConEnvio.value : null,
            tipoRetiro: withDrawType.value,
            sucursal: withDrawType.value === 'sucursal' ? sucursalSeleccionada.value : null,
            fechaRetiro: withDrawType.value === 'sucursal' ? fechaRetiro.value : null,
            horaRetiro: withDrawType.value === 'sucursal' ? horaRetiro.value : null,
            direccion: withDrawType.value === 'domicilio' ? datosCliente.value.direccion : null,
            ubicacionLat: datosCliente.value.lat || null,
            ubicacionLng: datosCliente.value.lng || null,
            sucursalCercana: locationStore.sucursalCercana || null,
            distanciaKm: locationStore.distancia || null,
            creadoEn: Timestamp.now(),
            estado: 'pendiente'
        }

        await addDoc(collection(db, 'pedidos'), pedido)

        const mensaje = armarMensajeWhatsApp()
        const numeroLimpio = nCelular.value.replace(/[^0-9]/g, '')
        window.open(`https://wa.me/506${numeroLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank')

        successMsg.value = '¡Pedido confirmado! 🎉 Se abrirá WhatsApp para completar el pedido.'
        cartStore.items = []
        setTimeout(() => emit('update:modelValue', false), 2500)

    } catch (error) {
        console.error(error)
        errorMsg.value = 'Hubo un error al enviar el pedido. Intentá de nuevo.'
    } finally {
        loading.value = false
    }
}

watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        errorMsg.value = ''
        successMsg.value = ''
        cargarDatosUsuario()
    }
})
</script>
