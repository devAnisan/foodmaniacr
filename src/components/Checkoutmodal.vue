<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black/50 z-70" @click="$emit('update:modelValue', false)"></div>

  <div v-if="modelValue" class="fixed inset-0 z-80 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md fontColor overflow-y-auto max-h-[90vh]">

      <div class="flex justify-between items-center p-5 border-b">
        <div class="flex items-center gap-2">
          <span class="pi pi-shopping-bag text-xl"></span>
          <span class="text-2xl font-bold">Finalizar compra</span>
        </div>
        <button @click="$emit('update:modelValue', false)"
          class="pi pi-times text-red-500 hover:text-red-700 hover:cursor-pointer p-2 rounded"></button>
      </div>

      <div v-if="loadingUsuario" class="flex justify-center items-center p-6">
        <span class="pi pi-spinner animate-spin text-3xl text-[var(--primary)]"></span>
      </div>

      <div v-else>

        <div v-if="cartStore.items.length === 0"
          class="flex flex-col items-center justify-center p-10 gap-4 text-center">
          <p class="text-5xl">🛒</p>
          <p class="text-lg font-bold text-gray-500">Tu carrito está vacío</p>
          <p class="text-sm text-gray-400">Agregá productos al carrito antes de finalizar la compra.</p>
          <button @click="$emit('update:modelValue', false)"
            class="bg-[var(--primary)] text-white px-6 py-2 rounded-full font-bold hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
            Ver menú
          </button>
        </div>

        <div v-else-if="fueraDeHorario && withDrawType === 'domicilio'"
          class="flex flex-col items-center justify-center p-10 gap-4 text-center">
          <p class="text-5xl">🕐</p>
          <p class="text-lg font-bold text-gray-500">Estamos cerrados</p>
          <p class="text-sm text-gray-400">
            Nuestro horario de delivery es <strong>Lunes a Domingo, 11am a 11pm</strong>.<br />
            Podés programar un retiro en sucursal para otra hora.
          </p>
          <button @click="withDrawType = 'sucursal'"
            class="bg-[var(--primary)] text-white px-6 py-2 rounded-full font-bold hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
            Programar retiro en sucursal
          </button>
        </div>

        <div v-else>

          <!-- Resumen del pedido -->
          <div class="p-5 border-b bg-gray-50">
            <h2 class="font-bold mb-3">Resumen del pedido</h2>
            <div v-for="item in cartStore.items" :key="item._uid" class="mb-3 pb-3 border-b border-dashed last:border-0">
              <div class="flex justify-between text-sm">
                <div>
                  <span class="font-bold">{{ item.nombre }}</span>
                  <span class="text-gray-400"> x{{ item.cantidad }}</span>
                  <!-- Canje para bebida independiente o producto normal -->
                  <button v-if="userLogueado && item.esBebida" @click="toggleItemPuntos(item)"
                    :class="itemPuntosMap[item._uid] ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-200'"
                    class="text-[10px] px-2 py-0.5 rounded-full border font-bold ml-2 hover:cursor-pointer transition-colors">
                    {{ itemPuntosMap[item._uid] ? '⭐ Canjeado' : 'Canjear ⭐' }}
                  </button>
                </div>
                <span :class="itemPuntosMap[item._uid] ? 'text-green-600 line-through' : ''">
                  ₡{{ item.precio * item.cantidad }}
                  <span v-if="itemPuntosMap[item._uid]" class="text-green-600 font-bold ml-1 no-underline">
                    ({{ puntosItem(item) }} pts)
                  </span>
                </span>
              </div>

              <!-- Bebida asociada a un producto -->
              <div v-if="item.bebida" class="flex justify-between text-xs text-gray-500 mt-1 ml-2">
                <div class="flex items-center gap-1">
                  <span>🥤 {{ item.bebida.nombre }} x{{ item.cantidad }}</span>
                  <button v-if="userLogueado" @click="toggleBebidaPuntos(item)"
                    :class="bebidaPuntosMap[item._uid] ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-200'"
                    class="text-[10px] px-2 py-0.5 rounded-full border font-bold ml-2 hover:cursor-pointer transition-colors">
                    {{ bebidaPuntosMap[item._uid] ? '⭐ Canjeado' : 'Canjear ⭐' }}
                  </button>
                </div>
                <span :class="bebidaPuntosMap[item._uid] ? 'text-green-600 line-through' : ''">
                  +₡{{ item.bebida.precio * item.cantidad }}
                  <span v-if="bebidaPuntosMap[item._uid]" class="text-green-600 font-bold ml-1 no-underline">
                    ({{ puntosBebida(item) }} pts)
                  </span>
                </span>
              </div>

              <!-- Papas con salsa -->
              <div v-if="item.papasConSalsa" class="text-xs text-gray-500 mt-1 ml-2">🍟 Papas con salsa</div>

              <!-- Salsas Alitas Mania -->
              <div v-if="item.salsasAlitas?.length" class="text-xs text-gray-500 mt-1 ml-2">
                🌶️ {{ item.salsasAlitas.join(', ') }}
              </div>

              <!-- Agrandar papas (pollofrito con papas == true) -->
              <div v-if="item.papas === true" class="mt-2 ml-2 flex flex-wrap items-center gap-2">
                <label class="flex items-center gap-1 text-xs text-gray-600 hover:cursor-pointer">
                  <input type="checkbox" v-model="agrandarMap[item._uid]" class="accent-[var(--primary)]" />
                  Agrandar papas
                </label>
                <div v-if="agrandarMap[item._uid]" class="flex gap-1">
                  <button @click="toggleAgrandarPuntos(item, false)"
                    :class="!agrandarPuntosMap[item._uid] ? 'bg-[var(--primary)] text-white' : 'bg-gray-200 text-gray-600'"
                    class="text-[10px] px-2 py-0.5 rounded-full font-bold hover:cursor-pointer transition-colors">
                    ₡{{ AGRANDAR_COSTO }}
                  </button>
                  <button v-if="userLogueado" @click="toggleAgrandarPuntos(item, true)"
                    :class="agrandarPuntosMap[item._uid] ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'"
                    class="text-[10px] px-2 py-0.5 rounded-full font-bold hover:cursor-pointer transition-colors">
                    ⭐ {{ AGRANDAR_PUNTOS }} pts
                  </button>
                </div>
              </div>
            </div>

            <!-- Envío -->
            <div v-if="withDrawType === 'domicilio' && costoEnvio > 0"
              class="flex justify-between text-sm text-gray-500 mt-2 pt-2 border-t border-dashed">
              <div>
                <span>🛵 Envío</span>
                <span class="text-xs text-gray-400 ml-1">
                  (base ₡1,000 + {{ kmAdicionales }} km × ₡400)
                </span>
              </div>
              <span>₡{{ costoEnvio }}</span>
            </div>

            <div class="flex justify-between font-bold mt-3 pt-3 border-t">
              <span>Total</span>
              <span>₡{{ totalConEnvio }}</span>
            </div>

            <!-- Resumen de canje -->
            <div v-if="userLogueado && totalPuntosAGastar > 0 && puntosActuales !== null"
              class="mt-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <p class="text-xs font-bold text-yellow-700">
                ⭐ Canjeando con puntos: {{ totalPuntosAGastar }} pts
              </p>
              <p v-if="puntosActuales < totalPuntosAGastar" class="text-xs text-red-600 font-bold">
                ⚠️ Tenés {{ puntosActuales }} pts acumulados, necesitás {{ totalPuntosAGastar }} pts.
              </p>
              <p v-else class="text-xs text-green-700">Puntos acumulados disponibles: {{ puntosActuales }} pts ✅</p>
            </div>

            <!-- Puntos a ganar -->
            <div class="mt-3 bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center gap-3">
              <span class="text-2xl">⭐</span>
              <div>
                <p class="text-sm font-bold text-[var(--primary)]">
                  Ganarás {{ puntosAGanar }} punto{{ puntosAGanar !== 1 ? 's' : '' }} con esta compra
                </p>
                <p class="text-xs text-gray-400">
                  Calculado sobre ₡{{ baseCashTotal }} en productos (₡500 = 1 punto)
                </p>
                <p v-if="puntosActuales !== null && totalPuntosAGastar > 0" class="text-xs text-yellow-700 font-bold mt-0.5">
                  ⚡ Los {{ puntosAGanar }} puntos de esta compra se suman después del canje
                </p>
                <p v-if="puntosActuales !== null" class="text-xs text-[var(--primary)] font-bold mt-0.5">
                  Saldo final estimado: {{ puntosActuales - totalPuntosAGastar + puntosAGanar }} puntos
                </p>
              </div>
            </div>
          </div>

          <!-- Datos del cliente -->
          <div class="p-5 border-b">
            <h2 class="font-bold mb-3">Tus datos</h2>
            <div class="flex flex-col gap-3">
              <div>
                <label class="text-sm text-gray-500 block mb-1">Nombre</label>
                <input v-model="datosCliente.nombre" type="text" placeholder="Tu nombre completo"
                  class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label class="text-sm text-gray-500 block mb-1">Teléfono</label>
                <input v-model="datosCliente.telefono" type="tel" placeholder="Ej: 8888-0000"
                  class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
            </div>
          </div>

          <!-- Tipo de retiro -->
          <div class="p-5 border-b">
            <h2 class="font-bold mb-3">Tipo de retiro</h2>
            <div class="flex gap-2">
              <button @click="withDrawType = 'sucursal'"
                :class="withDrawType === 'sucursal' ? 'bg-[var(--primary)] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
                class="flex-1 py-2 rounded transition-colors duration-300 hover:cursor-pointer">
                🏪 Sucursal
              </button>
              <button @click="withDrawType = 'domicilio'"
                :class="withDrawType === 'domicilio' ? 'bg-[var(--primary)] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
                class="flex-1 py-2 rounded transition-colors duration-300 hover:cursor-pointer">
                🛵 Domicilio
              </button>
            </div>
          </div>

          <!-- Datos según tipo de retiro -->
          <div class="p-5 border-b">
            <div v-if="withDrawType === 'sucursal'" class="flex flex-col gap-4">
              <div>
                <label class="text-sm text-gray-500 block mb-1">Sucursal de retiro</label>
                <select v-model="sucursalSeleccionada" @change="actualizarDatosSinpe"
                  class="w-full p-2 border rounded-lg">
                  <option value="">Seleccioná una sucursal</option>
                  <option v-for="suc in sucursalesStore.sucursalesFoodMania" :key="suc.Nombre" :value="suc.Nombre">
                    {{ suc.Nombre }}
                  </option>
                </select>
              </div>
              <div>
                <label class="text-sm text-gray-500 block mb-1">¿Qué día pasarás?</label>
                <input v-model="fechaRetiro" type="date" :min="hoy" class="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label class="text-sm text-gray-500 block mb-1">¿A qué hora pasarás?</label>
                <input v-model="horaRetiro" type="time" min="11:00" max="23:00"
                  class="w-full p-2 border rounded-lg" />
                <p class="text-xs text-gray-400 mt-1">Horario: Lun–Dom, 11:00am – 11:00pm</p>
              </div>
            </div>

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
                  class="w-full py-2 border-2 border-dashed border-[var(--primary)] rounded-lg text-[var(--primary)] font-bold hover:bg-purple-50 transition-colors hover:cursor-pointer">
                  📍 Usar mi ubicación actual
                </button>
                <div v-if="ubicacionObtenida"
                  class="mt-2 bg-green-50 border border-green-200 rounded-lg p-3 text-sm flex justify-between items-center">
                  <div>
                    <p class="text-green-600 font-bold">✅ Ubicación obtenida</p>
                    <p class="text-gray-500 mt-1">Sucursal más cercana: <strong>{{ locationStore.sucursalCercana }}</strong></p>
                    <p class="text-gray-500">Distancia: {{ locationStore.distancia }} km</p>
                    <p class="text-[var(--primary)] text-xs font-bold mt-1">
                      Envío: ₡1,000 base
                      <span v-if="kmAdicionales > 0"> + {{ kmAdicionales }} km × ₡400 = ₡{{ costoEnvio }}</span>
                      <span v-else> = ₡{{ costoEnvio }}</span>
                    </p>
                  </div>
                  <button @click="abrirEnMaps"
                    class="ml-2 bg-[var(--primary)] text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer flex items-center gap-1">
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
                :class="metodoPago === 'efectivo' ? 'bg-[var(--primary)] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
                class="flex-1 py-2 rounded transition-colors duration-300 hover:cursor-pointer">
                💵 Efectivo
              </button>
              <button @click="metodoPago = 'sinpe'"
                :class="metodoPago === 'sinpe' ? 'bg-[var(--primary)] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
                class="flex-1 py-2 rounded transition-colors duration-300 hover:cursor-pointer">
                📱 SINPE Móvil
              </button>
            </div>

            <div v-if="metodoPago === 'efectivo'" class="flex flex-col gap-2">
              <label class="text-sm text-gray-500">¿Con cuánto vas a pagar?</label>
              <input v-model="montoEfectivo" type="number" placeholder="Ej: 10000"
                class="w-full p-2 border rounded-lg" />
              <div v-if="montoEfectivo && Number(montoEfectivo) >= totalConEnvio"
                class="text-green-600 text-sm font-bold">
                Vuelto estimado: ₡{{ Number(montoEfectivo) - totalConEnvio }}
              </div>
              <div v-else-if="montoEfectivo && Number(montoEfectivo) < totalConEnvio" class="text-red-500 text-sm">
                El monto es menor al total del pedido.
              </div>
            </div>

            <div v-if="metodoPago === 'sinpe'" class="bg-gray-50 rounded-lg p-3 text-sm text-center">
              <p class="font-bold mb-1">SINPE Móvil</p>
              <p class="text-2xl font-bold text-[var(--primary)]">{{ sinpeNumero || '—' }}</p>
              <p v-if="sinpeTitular" class="text-sm text-gray-500 mt-1">A nombre de: <strong>{{ sinpeTitular }}</strong></p>
              <p class="text-xs text-gray-400 mt-1">
                {{ withDrawType === 'sucursal' ? 'Datos de la sucursal seleccionada' : 'Datos de la sucursal más cercana' }}
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
              class="w-full bg-[var(--primary)] text-white py-3 rounded-xl font-bold hover:bg-[var(--primary-dark)] transition-colors duration-300 hover:cursor-pointer disabled:opacity-50">
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
import { ref as vueRef, computed, watch, reactive } from 'vue'
import { useCartStore, useLocationStore, useSucursales } from '../stores/cartStores.js'
import { db, auth } from '../firebase.js'
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getLocation } from '../composable/saberDistancia.js'

const createOrder = httpsCallable(getFunctions(), 'createOrder')

const AGRANDAR_COSTO = 500
const AGRANDAR_PUNTOS = 25
const PUNTOS_BEBIDA_REGULAR = 35
const PUNTOS_BEBIDA_GRANDE = 55

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const cartStore = useCartStore()
const locationStore = useLocationStore()
const sucursalesStore = useSucursales()

const hoy = new Date().toISOString().split('T')[0]
const userLogueado = vueRef(!!auth.currentUser)

const fueraDeHorario = computed(() => {
  const hora = new Date().getHours()
  return hora < 11 || hora >= 23
})

const withDrawType = vueRef('sucursal')
const sucursalSeleccionada = vueRef('')
const fechaRetiro = vueRef('')
const horaRetiro = vueRef('')
const metodoPago = vueRef('efectivo')
const montoEfectivo = vueRef('')
const nCelular = vueRef('')
const sinpeNumero = vueRef('')
const sinpeTitular = vueRef('')
const ubicacionObtenida = vueRef(false)
const loading = vueRef(false)
const loadingUsuario = vueRef(false)
const errorMsg = vueRef('')
const successMsg = vueRef('')
const puntosActuales = vueRef(null)

const datosCliente = vueRef({
  nombre: '',
  telefono: '',
  direccion: '',
  lat: '',
  lng: ''
})

// Per-item state
const agrandarMap = reactive({})
const agrandarPuntosMap = reactive({})
const bebidaPuntosMap = reactive({})
const itemPuntosMap = reactive({})

const puntosBebida = (item) => {
  const precio = item.bebida?.precio || 0
  return precio >= 2500 ? PUNTOS_BEBIDA_GRANDE : PUNTOS_BEBIDA_REGULAR
}
const puntosItem = (item) => {
  return item.precio >= 2500 ? PUNTOS_BEBIDA_GRANDE : PUNTOS_BEBIDA_REGULAR
}

const toggleBebidaPuntos = (item) => {
  bebidaPuntosMap[item._uid] = !bebidaPuntosMap[item._uid]
}

const toggleItemPuntos = (item) => {
  itemPuntosMap[item._uid] = !itemPuntosMap[item._uid]
}

const toggleAgrandarPuntos = (item, val) => {
  agrandarPuntosMap[item._uid] = val
}

const baseCashTotal = computed(() => {
  return cartStore.items.reduce((acc, item) => {
    if (itemPuntosMap[item._uid]) return acc
    return acc + item.precio * item.cantidad
  }, 0)
})

const totalBebidasCash = computed(() => {
  return cartStore.items.reduce((acc, item) => {
    if (item.bebida && !bebidaPuntosMap[item._uid]) {
      return acc + (item.bebida.precio * item.cantidad)
    }
    return acc
  }, 0)
})

const totalAgrandarCash = computed(() => {
  return cartStore.items.reduce((acc, item) => {
    if (agrandarMap[item._uid] && !agrandarPuntosMap[item._uid]) {
      return acc + (AGRANDAR_COSTO * item.cantidad)
    }
    return acc
  }, 0)
})

const totalPuntosAGastar = computed(() => {
  let pts = 0
  for (const item of cartStore.items) {
    if (itemPuntosMap[item._uid]) {
      pts += puntosItem(item) * item.cantidad
    }
    if (bebidaPuntosMap[item._uid] && item.bebida) {
      pts += puntosBebida(item) * item.cantidad
    }
    if (agrandarMap[item._uid] && agrandarPuntosMap[item._uid]) {
      pts += AGRANDAR_PUNTOS * item.cantidad
    }
  }
  return pts
})

const cashTotalSinEnvio = computed(() => {
  return baseCashTotal.value + totalBebidasCash.value + totalAgrandarCash.value
})

const kmAdicionales = computed(() => {
  const distancia = parseFloat(locationStore.distancia) || 0
  return distancia > 1 ? Math.ceil(distancia - 1) : 0
})

const costoEnvio = computed(() => {
  if (withDrawType.value !== 'domicilio' || !locationStore.distancia) return 0
  return 1000 + (kmAdicionales.value * 400)
})

const totalConEnvio = computed(() => cashTotalSinEnvio.value + costoEnvio.value)

const puntosAGanar = computed(() => Math.floor(cashTotalSinEnvio.value / 500))

const cargarDatosUsuario = async () => {
  if (!auth.currentUser) {
    userLogueado.value = false
    return
  }
  userLogueado.value = true
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
      puntosActuales.value = data.puntos || 0
    }
  } catch (error) {
    console.error('Error cargando datos:', error)
  } finally {
    loadingUsuario.value = false
  }
}

const actualizarDatosSinpe = () => {
  const suc = sucursalesStore.sucursalesFoodMania.find(s => s.Nombre === sucursalSeleccionada.value)
  if (suc) {
    nCelular.value = suc.nCelular || ''
    sinpeNumero.value = suc.sinpe || ''
    sinpeTitular.value = suc.aNombre || ''
  }
}

watch(withDrawType, (tipo) => {
  if (tipo === 'sucursal') {
    actualizarDatosSinpe()
  } else {
    const suc = sucursalesStore.sucursalesFoodMania.find(s => s.Nombre === locationStore.sucursalCercana)
    if (suc) {
      nCelular.value = suc.nCelular || ''
      sinpeNumero.value = suc.sinpe || ''
      sinpeTitular.value = suc.aNombre || ''
    }
  }
})

const obtenerUbicacion = () => {
  getLocation(sucursalesStore.sucursalesFoodMania)
  ubicacionObtenida.value = true
  sucursalesStore.sucursalesFoodMania.forEach((item) => {
    if (item.Nombre === locationStore.sucursalCercana) {
      nCelular.value = item.nCelular || ''
      sinpeNumero.value = item.sinpe || ''
      sinpeTitular.value = item.aNombre || ''
    }
  })
}

const abrirEnMaps = () => {
  if (!datosCliente.value.lat || !datosCliente.value.lng) return
  window.open(`https://www.google.com/maps?q=${datosCliente.value.lat},${datosCliente.value.lng}`, '_blank')
}

const armarLineaItem = (item) => {
  let linea = `• ${item.nombre} x${item.cantidad}`
  if (itemPuntosMap[item._uid]) {
    linea += ` (⭐ ${puntosItem(item) * item.cantidad} pts)`
  } else {
    linea += ` — ₡${item.precio * item.cantidad}`
  }
  if (item.bebida) {
    const esCanje = bebidaPuntosMap[item._uid]
    linea += `\n  🥤 ${item.bebida.nombre} x${item.cantidad}${esCanje ? ` (⭐ ${puntosBebida(item) * item.cantidad} pts)` : ` — ₡${item.bebida.precio * item.cantidad}`}`
  }
  if (item.papasConSalsa) {
    linea += `\n  🍟 Papas con salsa`
  }
  if (item.salsasAlitas?.length) {
    linea += `\n  🌶️ Salsas: ${item.salsasAlitas.join(', ')}`
  }
  if (agrandarMap[item._uid]) {
    const esCanje = agrandarPuntosMap[item._uid]
    linea += `\n  ⬆️ Papas agrandadas${esCanje ? ` (⭐ ${AGRANDAR_PUNTOS * item.cantidad} pts)` : ` (+₡${AGRANDAR_COSTO * item.cantidad})`}`
  }
  return linea
}

const armarMensajeWhatsApp = () => {
  const items = cartStore.items.map(armarLineaItem).join('\n')
  const pagoCadena = metodoPago.value === 'efectivo'
    ? `Efectivo (paga con ₡${montoEfectivo.value}, vuelto ₡${Number(montoEfectivo.value) - totalConEnvio.value})`
    : 'SINPE Móvil'

  const puntosCadena = totalPuntosAGastar.value > 0
    ? `\n⭐ Puntos canjeados: ${totalPuntosAGastar.value} pts`
    : ''

  const base = `🍔 *Nuevo pedido en Foodmania*\n\n` +
    `👤 Cliente: ${datosCliente.value.nombre}\n` +
    `📞 Teléfono: ${datosCliente.value.telefono}\n\n` +
    `📋 *Pedido:*\n${items}\n` +
    `💰 Total: ₡${totalConEnvio.value}${puntosCadena}\n` +
    `⭐ Puntos ganados: ${puntosAGanar.value}\n` +
    `💳 Pago: ${pagoCadena}\n\n`

  if (withDrawType.value === 'sucursal') {
    return base +
      `🏪 Retiro en: ${sucursalSeleccionada.value}\n` +
      `📅 Fecha: ${fechaRetiro.value}\n` +
      `🕐 Hora: ${horaRetiro.value}`
  } else {
    return base +
      `📍 Dirección: ${datosCliente.value.direccion}\n` +
      `🗺️ Ubicación: https://www.google.com/maps?q=${datosCliente.value.lat},${datosCliente.value.lng}`
  }
}

const confirmarPedido = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  if (cartStore.items.length === 0)
    return errorMsg.value = 'Tu carrito está vacío. Agregá productos antes de continuar.'
  if (!datosCliente.value.nombre) return errorMsg.value = 'Ingresá tu nombre.'
  if (!datosCliente.value.telefono) return errorMsg.value = 'Ingresá tu teléfono.'

  if (withDrawType.value === 'sucursal') {
    if (!sucursalSeleccionada.value) return errorMsg.value = 'Seleccioná una sucursal.'
    if (!fechaRetiro.value) return errorMsg.value = 'Seleccioná una fecha de retiro.'
    if (!horaRetiro.value) return errorMsg.value = 'Seleccioná una hora de retiro.'
    const [hh] = horaRetiro.value.split(':').map(Number)
    if (hh < 11 || hh >= 23)
      return errorMsg.value = 'La hora de retiro debe ser entre 11:00am y 11:00pm.'
  } else {
    if (!datosCliente.value.direccion) return errorMsg.value = 'Ingresá la dirección de entrega.'
    if (!ubicacionObtenida.value) return errorMsg.value = 'Debés compartir tu ubicación para el envío a domicilio. 📍'
  }

  if (metodoPago.value === 'efectivo') {
    if (!montoEfectivo.value) return errorMsg.value = 'Ingresá el monto con el que pagarás.'
    if (Number(montoEfectivo.value) < totalConEnvio.value)
      return errorMsg.value = 'El monto es menor al total del pedido.'
  }

  if (totalPuntosAGastar.value > 0) {
    if (puntosActuales.value === null)
      return errorMsg.value = 'Iniciá sesión para canjear puntos.'
    const puntosDisponibles = puntosActuales.value
    if (puntosDisponibles < totalPuntosAGastar.value)
      return errorMsg.value = `No tenés suficientes puntos acumulados. Tenés ${puntosDisponibles}, necesitás ${totalPuntosAGastar.value}.`
  }

  try {
    loading.value = true

    const itemsConExtras = cartStore.items.map(item => ({
      id: item.id,
      nombre: item.nombre,
      precio: item.precio,
      cantidad: item.cantidad,
      esBebida: item.esBebida || false,
      canjeadoConPuntos: !!itemPuntosMap[item._uid],
      bebida: item.bebida ? {
        id: item.bebida.id,
        nombre: item.bebida.nombre,
        precio: item.bebida.precio,
        canjeadoConPuntos: !!bebidaPuntosMap[item._uid]
      } : null,
      papasConSalsa: item.papasConSalsa || false,
      salsasAlitas: item.salsasAlitas || [],
      agrandarPapas: !!agrandarMap[item._uid],
      agrandarConPuntos: !!agrandarPuntosMap[item._uid],
    }))

    const pedido = {
      nombre: datosCliente.value.nombre,
      telefono: datosCliente.value.telefono,
      items: itemsConExtras,
      subtotal: baseCashTotal.value,
      costoBebidas: totalBebidasCash.value,
      costoAgrandar: totalAgrandarCash.value,
      costoEnvio: costoEnvio.value,
      total: totalConEnvio.value,
      puntosGanados: puntosAGanar.value,
      puntosCanjeados: totalPuntosAGastar.value,
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
      estado: 'pendiente'
    }

    const result = await createOrder({ pedido })

    const mensaje = armarMensajeWhatsApp()
    const numeroLimpio = nCelular.value.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/506${numeroLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank')

    successMsg.value = `¡Pedido confirmado! 🎉 ${totalPuntosAGastar.value > 0 ? `Canjeaste ${totalPuntosAGastar.value} puntos ⭐ ` : ''}Ganaste ${puntosAGanar.value} puntos ⭐`
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
    Object.keys(agrandarMap).forEach(k => delete agrandarMap[k])
    Object.keys(agrandarPuntosMap).forEach(k => delete agrandarPuntosMap[k])
    Object.keys(bebidaPuntosMap).forEach(k => delete bebidaPuntosMap[k])
    Object.keys(itemPuntosMap).forEach(k => delete itemPuntosMap[k])
    cargarDatosUsuario()
  }
})
</script>
