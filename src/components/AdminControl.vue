<template>
    <!-- Loader de verificación de rol -->
    <div v-if="verificando" class="flex items-center justify-center h-screen fontColor">
        <div class="text-center">
            <span class="pi pi-spinner animate-spin text-4xl text-[var(--primary)] block mb-4"></span>
            <p class="text-gray-500">Verificando acceso...</p>
        </div>
    </div>

    <!-- Acceso denegado -->
    <div v-else-if="!esAdmin" class="flex flex-col items-center justify-center h-screen gap-4 text-center fontColor">
        <p class="text-6xl">🚫</p>
        <h1 class="text-2xl font-bold">Acceso denegado</h1>
        <p class="text-gray-500">No tenés permisos para ver esta página.</p>
        <button @click="router.push('/')"
            class="bg-[var(--primary)] text-white px-6 py-2 rounded-full font-bold hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
            Volver al inicio
        </button>
    </div>

    <!-- Panel de control -->
    <div v-else class="min-h-screen bg-gray-50 fontColor">

        <!-- Header del panel -->
        <header class="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <span class="text-2xl">👑</span>
                <div>
                    <h1 class="text-xl font-bold text-[var(--primary)]">Panel de Control</h1>
                    <p class="text-xs text-gray-400">Bienvenido, {{ adminNombre }} — Sucursal {{ adminSucursal }}</p>
                </div>
            </div>
            <button @click="cerrarSesion"
                class="text-sm border px-4 py-2 rounded-full hover:bg-gray-100 transition-colors hover:cursor-pointer">
                Cerrar sesión
            </button>
        </header>

        <main class="p-6">

            <!-- Stats rápidos -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div v-for="stat in stats" :key="stat.label"
                    class="bg-white rounded-xl shadow-sm p-4 text-center border-l-4"
                    :style="`border-color: ${stat.color}`">
                    <p class="text-2xl font-bold" :style="`color: ${stat.color}`">{{ stat.valor }}</p>
                    <p class="text-xs text-gray-500 mt-1">{{ stat.label }}</p>
                </div>
            </div>

            <!-- Filtro de estado -->
            <div
                class="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                    <h2 class="font-bold text-lg">Pedidos</h2>
                    <p class="text-sm text-gray-400">{{ pedidosFiltrados.length }} pedido(s) encontrado(s)</p>
                </div>
                <div class="flex gap-2 flex-wrap">
                    <button v-for="estado in estados" :key="estado.value" @click="estadoActivo = estado.value" :class="estadoActivo === estado.value
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                        class="px-4 py-2 rounded-full text-sm font-bold transition-colors hover:cursor-pointer flex items-center gap-2">
                        {{ estado.emoji }} {{ estado.label }}
                        <span class="bg-white/30 rounded-full px-2 text-xs">{{ contarPorEstado(estado.value) }}</span>
                    </button>
                </div>
            </div>

            <!-- Error message -->
            <div v-if="errorMsg"
                class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm font-bold">
                ⚠️ {{ errorMsg }}
            </div>

            <!-- Loader de pedidos -->
            <div v-if="cargandoPedidos" class="flex justify-center py-10">
                <span class="pi pi-spinner animate-spin text-3xl text-[var(--primary)]"></span>
            </div>

            <!-- Sin resultados -->
            <div v-else-if="pedidosFiltrados.length === 0" class="bg-white rounded-xl shadow-sm p-10 text-center">
                <p class="text-4xl mb-3">📭</p>
                <p class="text-gray-500">No hay pedidos en estado "{{ estadoActivo }}"</p>
            </div>

            <!-- Tabla desktop -->
            <div v-else class="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="bg-[var(--primary)] text-white">
                            <th class="p-3 text-left">Cliente</th>
                            <th class="p-3 text-left">Contacto</th>
                            <th class="p-3 text-left">Pedido</th>
                            <th class="p-3 text-left">Retiro</th>
                            <th class="p-3 text-left">Pago</th>
                            <th class="p-3 text-left">Total</th>
                            <th class="p-3 text-left">Puntos</th>
                            <th class="p-3 text-left">Canje</th>
                            <th class="p-3 text-left">Fecha</th>
                            <th class="p-3 text-left">Estado</th>
                            <th class="p-3 text-left">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="pedido in pedidosFiltrados" :key="pedido.id"
                            class="border-b hover:bg-gray-50 transition-colors">
                            <td class="p-3 font-bold">{{ pedido.nombre }}</td>
                            <td class="p-3">
                                <p>{{ pedido.telefono }}</p>
                                <p class="text-gray-400 text-xs">{{ pedido.usuario }}</p>
                            </td>
                            <td class="p-3">
                                <button @click="verDetalle(pedido)"
                                    class="text-[var(--primary)] font-bold hover:underline hover:cursor-pointer text-xs">
                                    Ver {{ pedido.items?.length }} ítem(s)
                                </button>
                            </td>
                            <td class="p-3">
                                <span v-if="pedido.tipoRetiro === 'sucursal'">
                                    🏪 {{ pedido.sucursal }}<br />
                                    <span class="text-xs text-gray-400">{{ pedido.fechaRetiro }} {{ pedido.horaRetiro
                                    }}</span>
                                </span>
                                <span v-else>
                                    🛵 Domicilio<br />
                                    <span class="text-xs text-gray-400">{{ pedido.direccion }}</span>
                                </span>
                            </td>
                            <td class="p-3">
                                <span class="font-bold">{{ pedido.metodoPago === 'efectivo' ? '💵' : '📱' }}</span>
                                {{ pedido.metodoPago }}
                                <span v-if="pedido.metodoPago === 'efectivo'" class="block text-xs text-gray-400">
                                    Vuelto: ₡{{ pedido.vuelto }}
                                </span>
                            </td>
                            <td class="p-3 font-bold text-[var(--primary)]">₡{{ pedido.total }}</td>
                            <td class="p-3 text-center">⭐ {{ pedido.puntosGanados || 0 }}</td>
                            <td class="p-3 text-center">
                                <span v-if="pedido.puntosCanjeados" class="text-red-500 font-bold">🔥 {{ pedido.puntosCanjeados }}</span>
                                <span v-else class="text-gray-300">—</span>
                            </td>
                            <td class="p-3 text-xs text-gray-500">
                                {{ formatearFecha(pedido.creadoEn) }}
                            </td>
                            <td class="p-3">
                                <span :class="colorEstado(pedido.estado)"
                                    class="px-2 py-1 rounded-full text-xs font-bold">
                                    {{ pedido.estado }}
                                </span>
                            </td>
                            <td class="p-3">
                                <select :value="pedido.estado" @change="cambiarEstado(pedido, $event.target.value)"
                                    class="border rounded-lg p-1 text-xs hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                                    <option value="pendiente">Pendiente</option>
                                    <option value="en transcurso">En transcurso</option>
                                    <option value="finalizado">Finalizado</option>
                                    <option value="cancelado">Cancelado</option>
                                </select>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Cards mobile -->
            <div class="md:hidden flex flex-col gap-4">
                <div v-for="pedido in pedidosFiltrados" :key="pedido.id"
                    class="bg-white rounded-xl shadow-sm p-4 border-l-4"
                    :style="`border-color: ${colorEstadoHex(pedido.estado)}`">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <p class="font-bold">{{ pedido.nombre }}</p>
                            <p class="text-xs text-gray-400">{{ pedido.usuario }}</p>
                        </div>
                        <span :class="colorEstado(pedido.estado)" class="px-2 py-1 rounded-full text-xs font-bold">
                            {{ pedido.estado }}
                        </span>
                    </div>
                    <div class="text-sm text-gray-600 flex flex-col gap-1 mb-3">
                        <p>📞 {{ pedido.telefono }}</p>
                        <p>💰 Total: <strong class="text-[var(--primary)]">₡{{ pedido.total }}</strong></p>
                        <p>⭐ Puntos: {{ pedido.puntosGanados || 0 }} <span v-if="pedido.puntosCanjeados" class="text-red-500">🔥 -{{ pedido.puntosCanjeados }}</span></p>
                        <p>{{ pedido.tipoRetiro === 'sucursal' ? `🏪 ${pedido.sucursal}` : `🛵 ${pedido.direccion}` }}
                        </p>
                        <p class="text-xs text-gray-400">{{ formatearFecha(pedido.creadoEn) }}</p>
                    </div>
                    <div class="flex gap-2">
                        <button @click="verDetalle(pedido)"
                            class="flex-1 border border-[var(--primary)] text-[var(--primary)] py-2 rounded-lg text-sm font-bold hover:cursor-pointer">
                            Ver detalle
                        </button>
                        <select :value="pedido.estado" @change="cambiarEstado(pedido, $event.target.value)"
                            class="flex-1 border rounded-lg p-2 text-sm hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                            <option value="pendiente">Pendiente</option>
                            <option value="en transcurso">En transcurso</option>
                            <option value="finalizado">Finalizado</option>
                            <option value="cancelado">Cancelado</option>
                        </select>
                    </div>
                </div>
            </div>
        </main>

        <!-- Modal detalle del pedido -->
        <div v-if="pedidoDetalle" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center p-5 border-b">
                    <h2 class="text-xl font-bold">Detalle del pedido</h2>
                    <button @click="pedidoDetalle = null"
                        class="pi pi-times text-red-500 hover:cursor-pointer p-2"></button>
                </div>
                <div class="p-5 flex flex-col gap-4">

                    <!-- Cliente -->
                    <div>
                        <p class="text-xs text-gray-400 uppercase font-bold mb-2">Cliente</p>
                        <p class="font-bold">{{ pedidoDetalle.nombre }}</p>
                        <p class="text-sm text-gray-500">{{ pedidoDetalle.usuario }}</p>
                        <p class="text-sm text-gray-500">📞 {{ pedidoDetalle.telefono }}</p>
                    </div>

                    <!-- Items -->
                    <div>
                        <p class="text-xs text-gray-400 uppercase font-bold mb-2">Productos</p>
                        <div v-for="item in pedidoDetalle.items" :key="item.id"
                            class="flex justify-between text-sm py-1 border-b">
                            <span>{{ item.nombre }} x{{ item.cantidad }}</span>
                            <span class="font-bold">₡{{ item.precio * item.cantidad }}</span>
                        </div>
                    </div>

                    <!-- Totales -->
                    <div class="bg-gray-50 rounded-xl p-3">
                        <div class="flex justify-between text-sm mb-1">
                            <span>Subtotal productos</span>
                            <span>₡{{ pedidoDetalle.subtotal }}</span>
                        </div>
                        <div v-if="pedidoDetalle.costoEnvio > 0" class="flex justify-between text-sm mb-1">
                            <span>🛵 Envío</span>
                            <span>₡{{ pedidoDetalle.costoEnvio }}</span>
                        </div>
                        <div class="flex justify-between font-bold border-t pt-2 mt-2">
                            <span>Total</span>
                            <span class="text-[var(--primary)]">₡{{ pedidoDetalle.total }}</span>
                        </div>
                        <div class="flex justify-between text-sm mt-1 text-amber-600">
                            <span>⭐ Puntos ganados</span>
                            <span>{{ pedidoDetalle.puntosGanados || 0 }}</span>
                        </div>
                        <div v-if="pedidoDetalle.puntosCanjeados" class="flex justify-between text-sm text-red-600">
                            <span>🔥 Puntos canjeados</span>
                            <span>{{ pedidoDetalle.puntosCanjeados }}</span>
                        </div>
                    </div>

                    <!-- Retiro -->
                    <div>
                        <p class="text-xs text-gray-400 uppercase font-bold mb-2">Retiro</p>
                        <div v-if="pedidoDetalle.tipoRetiro === 'sucursal'">
                            <p>🏪 {{ pedidoDetalle.sucursal }}</p>
                            <p class="text-sm text-gray-500">📅 {{ pedidoDetalle.fechaRetiro }} — 🕐 {{
                                pedidoDetalle.horaRetiro }}</p>
                        </div>
                        <div v-else>
                            <p>🛵 Domicilio</p>
                            <p class="text-sm text-gray-500">📍 {{ pedidoDetalle.direccion }}</p>
                            <a v-if="pedidoDetalle.ubicacionLat && pedidoDetalle.ubicacionLng"
                                :href="`https://www.google.com/maps?q=${pedidoDetalle.ubicacionLat},${pedidoDetalle.ubicacionLng}`"
                                target="_blank" class="text-sm text-[var(--primary)] font-bold hover:underline">
                                🗺️ Ver en Maps
                            </a>
                        </div>
                    </div>

                    <!-- Pago -->
                    <div>
                        <p class="text-xs text-gray-400 uppercase font-bold mb-2">Pago</p>
                        <p>{{ pedidoDetalle.metodoPago === 'efectivo' ? '💵 Efectivo' : '📱 SINPE Móvil' }}</p>
                        <p v-if="pedidoDetalle.metodoPago === 'efectivo'" class="text-sm text-gray-500">
                            Paga con ₡{{ pedidoDetalle.montoEfectivo }} — Vuelto: ₡{{ pedidoDetalle.vuelto }}
                        </p>
                    </div>

                    <!-- Cambiar estado -->
                    <div>
                        <p class="text-xs text-gray-400 uppercase font-bold mb-2">Cambiar estado</p>
                        <select :value="pedidoDetalle.estado"
                            @change="cambiarEstado(pedidoDetalle, $event.target.value); pedidoDetalle.estado = $event.target.value"
                            class="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] hover:cursor-pointer">
                            <option value="pendiente">Pendiente</option>
                            <option value="en transcurso">En transcurso</option>
                            <option value="finalizado">Finalizado</option>
                            <option value="cancelado">Cancelado</option>
                        </select>
                    </div>

                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref as vueRef, computed, onMounted, onUnmounted } from 'vue'
import { collection, doc, getDoc, addDoc, Timestamp, updateDoc, query, where, increment, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cartStores.js'
import { db, auth } from '../firebase.js'

const router = useRouter()

// ── Estado ─────────────────────────────────────────────────────────────────
const verificando = vueRef(true)
const esAdmin = vueRef(false)
const adminEmail = vueRef('')
const adminNombre = vueRef('')
const adminSucursal = vueRef('') // ✅ Sucursal asignada al admin
const pedidos = vueRef([])
const cargandoPedidos = vueRef(false)
const estadoActivo = vueRef('pendiente')
const pedidoDetalle = vueRef(null)
const errorMsg = vueRef('')

const estados = [
    { value: 'pendiente', label: 'Pendiente', emoji: '🕐' },
    { value: 'en transcurso', label: 'En transcurso', emoji: '🚀' },
    { value: 'finalizado', label: 'Finalizado', emoji: '✅' },
    { value: 'cancelado', label: 'Cancelado', emoji: '❌' },
]

// ── Verificar si el usuario es admin ──────────────────────────────────────
const verificarAdmin = async (user) => {
    try {
        const docRef = doc(db, 'superUser', user.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
            const superUserData = docSnap.data()

            if (superUserData.rol === 'administrador') {
                esAdmin.value = true
                adminEmail.value = user.email
                adminNombre.value = superUserData.usuario || user.email
                adminSucursal.value = superUserData.sucursal || ''
                await setupPedidosListener()
            }
        }
    } catch (error) {
        console.error('Error verificando admin:', error)
    } finally {
        verificando.value = false
    }
}

// ── Listener en tiempo real para pedidos ───────────────────────────────────
let unsuscribePedidos = null

const setupPedidosListener = () => {
    if (unsuscribePedidos) unsuscribePedidos()

    cargandoPedidos.value = true
    unsuscribePedidos = onSnapshot(collection(db, 'pedidos'), (snapshot) => {
        pedidos.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        cargandoPedidos.value = false
    }, (error) => {
        console.error('Error en listener de pedidos:', error)
        cargandoPedidos.value = false
    })
}

// ── ✅ Filtrar pedidos por sucursal del admin Y estado ─────────────────────
const pedidosDeSucursal = computed(() =>
    pedidos.value.filter(p => {
        if (p.tipoRetiro === 'domicilio') {
            return p.sucursalCercana === adminSucursal.value
        } else {
            return p.sucursal === adminSucursal.value
        }
    })
)

const pedidosFiltrados = computed(() =>
    pedidosDeSucursal.value.filter(p => p.estado === estadoActivo.value)
)

const contarPorEstado = (estado) =>
    pedidosDeSucursal.value.filter(p => p.estado === estado).length

// ── Stats rápidos ──────────────────────────────────────────────────────────
const stats = computed(() => [
    {
        label: 'Total pedidos',
        valor: pedidosDeSucursal.value.length,
        color: '#642d81'
    },
    {
        label: 'Pendientes',
        valor: contarPorEstado('pendiente'),
        color: '#f59e0b'
    },
    {
        label: 'En transcurso',
        valor: contarPorEstado('en transcurso'),
        color: '#3b82f6'
    },
    {
        label: 'Finalizados',
        valor: contarPorEstado('finalizado'),
        color: '#10b981'
    },
])

// ── Cambiar estado del pedido ──────────────────────────────────────────────
const cambiarEstado = async (pedido, nuevoEstado) => {
    errorMsg.value = ''
    const estadoAnterior = pedido.estado

    // Optimistic: actualizar la UI de inmediato
    const index = pedidos.value.findIndex(p => p.id === pedido.id)
    if (index !== -1) pedidos.value[index].estado = nuevoEstado

    try {
        await updateDoc(doc(db, 'pedidos', pedido.id), { estado: nuevoEstado })

        await addDoc(collection(db, 'auditLogs'), {
            pedidoId: pedido.id,
            accion: 'cambio_estado',
            estadoAnterior,
            estadoNuevo: nuevoEstado,
            adminEmail: adminEmail.value,
            adminNombre: adminNombre.value,
            adminSucursal: adminSucursal.value,
            creadoEn: Timestamp.now()
        })

        // Los puntos se asignan aparte para que si falla (ej. reglas de seguridad)
        // no reviente el cambio de estado
        if (nuevoEstado === 'finalizado' && estadoAnterior !== 'finalizado') {
            otorgarPuntos(pedido)
        }
    } catch (error) {
        console.error('Error actualizando estado:', error)
        errorMsg.value = `Error al cambiar a "${nuevoEstado}". Revisá la consola o intentá de nuevo.`

        // Revertir el optimistc
        if (index !== -1) pedidos.value[index].estado = estadoAnterior
    }
}

const otorgarPuntos = async (pedido) => {
    try {
        const pts = pedido.puntosGanados || 0
        if (pts > 0 && pedido.usuario && pedido.usuario !== 'Anónimo') {
            const q = query(collection(db, 'clientes'), where('email', '==', pedido.usuario))
            const snap = await getDocs(q)
            if (!snap.empty) {
                await updateDoc(doc(db, 'clientes', snap.docs[0].id), {
                    puntos: increment(pts)
                })
                console.log(`✅ ${pts} puntos otorgados a ${pedido.usuario}`)
            }
        }
    } catch (error) {
        console.error('Error otorgando puntos (reglas de seguridad?):', error)
    }
}

// ── Ver detalle ────────────────────────────────────────────────────────────
const verDetalle = (pedido) => {
    pedidoDetalle.value = pedido
}

// ── Colores por estado ─────────────────────────────────────────────────────
const colorEstado = (estado) => {
    const colores = {
        'pendiente': 'bg-amber-100 text-amber-700',
        'en transcurso': 'bg-blue-100 text-blue-700',
        'finalizado': 'bg-green-100 text-green-700',
        'cancelado': 'bg-red-100 text-red-700',
    }
    return colores[estado] || 'bg-gray-100 text-gray-700'
}

const colorEstadoHex = (estado) => {
    const colores = {
        'pendiente': '#f59e0b',
        'en transcurso': '#3b82f6',
        'finalizado': '#10b981',
        'cancelado': '#ef4444',
    }
    return colores[estado] || '#642d81'
}

// ── Formatear fecha ────────────────────────────────────────────────────────
const formatearFecha = (timestamp) => {
    if (!timestamp) return '—'
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return fecha.toLocaleDateString('es-CR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
}

// ── Cerrar sesión ──────────────────────────────────────────────────────────
const cerrarSesion = async () => {
    useCartStore().items = []
    await signOut(auth)
    router.push('/')
}

// ── Auth check al montar ───────────────────────────────────────────────────
onMounted(() => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await verificarAdmin(user)
        } else {
            verificando.value = false
            router.push('/')
        }
    })
})

onUnmounted(() => {
    if (unsuscribePedidos) unsuscribePedidos()
})
</script>
