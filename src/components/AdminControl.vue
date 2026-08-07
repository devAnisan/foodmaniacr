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
            <div class="flex items-center gap-2">
                <button v-if="hayPedidosPendientes" @click="sonidoSilenciado = !sonidoSilenciado"
                    class="text-sm border px-4 py-2 rounded-full hover:bg-gray-100 transition-colors hover:cursor-pointer flex items-center gap-1"
                    :class="sonidoSilenciado ? 'bg-gray-200 text-gray-500' : 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'"
                    :title="sonidoSilenciado ? 'Activar sonido' : 'Silenciar sonido'">
                    <span>{{ sonidoSilenciado ? '🔇' : '🔊' }}</span>
                    {{ sonidoSilenciado ? 'Silenciado' : 'Sonando' }}
                </button>
                <button @click="showNotifModal = !showNotifModal"
                    class="text-sm border px-4 py-2 rounded-full hover:bg-gray-100 transition-colors hover:cursor-pointer flex items-center gap-1"
                    :class="showNotifModal ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : ''">
                    <span>🔔</span>
                    Notificaciones
                </button>
                <button @click="cerrarSesion"
                    class="text-sm border px-4 py-2 rounded-full hover:bg-gray-100 transition-colors hover:cursor-pointer">
                    Cerrar sesión
                </button>
            </div>
        </header>

        <!-- Modal Notificaciones Push -->
        <div v-if="showNotifModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click="showNotifModal = false">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md" @click.stop>
                <div class="flex justify-between items-center p-5 border-b">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">🔔</span>
                        <h2 class="text-xl font-bold">Enviar notificación</h2>
                    </div>
                    <button @click="showNotifModal = false"
                        class="pi pi-times text-red-500 hover:cursor-pointer p-2"></button>
                </div>
                <div class="p-5 flex flex-col gap-4">
                    <div>
                        <label class="text-sm text-gray-500 block mb-1">Título</label>
                        <input v-model="notifTitle" type="text" placeholder="Ej: 🍔 Promo del día"
                            class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                    </div>
                    <div>
                        <label class="text-sm text-gray-500 block mb-1">Mensaje</label>
                        <textarea v-model="notifBody" placeholder="Ej: 2x1 en hamburguesas hoy!"
                            class="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            rows="3"></textarea>
                    </div>
                    <div>
                        <label class="text-sm text-gray-500 block mb-1">Enviar a</label>
                        <select v-model="notifTarget"
                            class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                            <option value="all">Todos los clientes</option>
                            <option value="rookie">Nivel Rookie (500+ 🪙)</option>
                            <option value="maniaco">Nivel Maniático (1000+ 🪙)</option>
                            <option value="supremo">Nivel Supremo (2000+ 🪙)</option>
                            <option value="rey">Nivel Rey FoodMania (3000+ 🪙)</option>
                        </select>
                    </div>
                    <div v-if="notifMsg" class="text-sm font-bold px-3 py-2 rounded-lg"
                        :class="notifMsgType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
                        {{ notifMsg }}
                    </div>
                    <button @click="enviarNotificacion" :disabled="notifLoading || !notifTitle || !notifBody"
                        class="w-full bg-[var(--primary)] text-white py-3 rounded-xl font-bold hover:bg-[var(--primary-dark)] transition-colors duration-300 hover:cursor-pointer disabled:opacity-50">
                        <span v-if="notifLoading" class="pi pi-spinner animate-spin mr-2"></span>
                        {{ notifLoading ? 'Enviando...' : '📨 Enviar notificación' }}
                    </button>
                </div>
            </div>
        </div>

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

            <!-- Cierre de caja -->
            <div v-if="errorCierre"
                class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm font-bold">
                ⚠️ {{ errorCierre }}
            </div>

            <!-- Hoy -->
            <div class="mb-6">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="font-bold text-lg">🧾 Cierre de caja — Hoy</h3>
                    <button v-if="!ventasHoy?.cerrado" @click="recalcularHoy" :disabled="recalculandoDia"
                        class="text-xs font-bold text-gray-500 border rounded-full px-3 py-1 hover:bg-gray-100 transition-colors hover:cursor-pointer disabled:opacity-50">
                        {{ recalculandoDia ? 'Recalculando...' : '🔄 Recalcular' }}
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-white rounded-xl shadow-sm p-4">
                        <h4 class="font-bold mb-2">🏪 Negocio</h4>
                        <div v-if="ventasHoy" class="text-sm text-gray-600 flex flex-col gap-1 mb-3">
                            <div class="flex justify-between"><span>Total</span><span class="font-bold">₡{{ (ventasHoy.montoProductos || 0).toLocaleString('es-CR') }}</span></div>
                            <div class="flex justify-between text-xs text-gray-400"><span>Pedidos</span><span>{{ ventasHoy.cantidadPedidos || 0 }}</span></div>
                        </div>
                        <p v-else class="text-sm text-gray-400 mb-3">Todavía no hay ventas finalizadas hoy.</p>
                    </div>
                    <div class="bg-white rounded-xl shadow-sm p-4">
                        <h4 class="font-bold mb-2">🛵 Domicilio</h4>
                        <div v-if="ventasHoy" class="text-sm text-gray-600 flex flex-col gap-1 mb-3">
                            <div class="flex justify-between"><span>Total</span><span class="font-bold">₡{{ (ventasHoy.montoEnvio || 0).toLocaleString('es-CR') }}</span></div>
                            <div class="flex justify-between text-xs text-gray-400"><span>Pedidos</span><span>{{ ventasHoy.cantidadPedidosDomicilio || 0 }}</span></div>
                        </div>
                        <p v-else class="text-sm text-gray-400 mb-3">Todavía no hay envíos finalizados hoy.</p>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm p-4 mt-4">
                    <p v-if="ventasHoy?.cerrado" class="text-sm font-bold text-green-600">
                        ✅ Cerrado a las {{ new Date(ventasHoy.cierre.cerradoEn.seconds * 1000).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }) }} por {{ ventasHoy.cierre.cerradoPor }} — Total del día: ₡{{ (ventasHoy.cierre.montoTotal || 0).toLocaleString('es-CR') }}
                    </p>
                    <button v-else @click="cerrarCaja" :disabled="cerrandoDia || !ventasHoy"
                        class="w-full bg-[var(--primary)] text-white py-2 rounded-xl font-bold hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer disabled:opacity-50">
                        {{ cerrandoDia ? 'Cerrando...' : 'Cerrar caja de hoy' }}
                    </button>
                </div>
            </div>

            <!-- Semana -->
            <div class="mb-6">
                <h3 class="font-bold text-lg mb-2">📅 Cierre semanal</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-white rounded-xl shadow-sm p-4">
                        <h4 class="font-bold mb-2">🏪 Negocio</h4>
                        <div v-if="ventasSemana" class="text-sm text-gray-600 flex flex-col gap-1 mb-3">
                            <div class="flex justify-between"><span>Total</span><span class="font-bold">₡{{ (ventasSemana.montoProductos || 0).toLocaleString('es-CR') }}</span></div>
                            <div class="flex justify-between text-xs text-gray-400"><span>Pedidos</span><span>{{ ventasSemana.cantidadPedidos || 0 }}</span></div>
                        </div>
                        <p v-else class="text-sm text-gray-400 mb-3">Todavía no hay ventas finalizadas esta semana.</p>
                    </div>
                    <div class="bg-white rounded-xl shadow-sm p-4">
                        <h4 class="font-bold mb-2">🛵 Domicilio</h4>
                        <div v-if="ventasSemana" class="text-sm text-gray-600 flex flex-col gap-1 mb-3">
                            <div class="flex justify-between"><span>Total</span><span class="font-bold">₡{{ (ventasSemana.montoEnvio || 0).toLocaleString('es-CR') }}</span></div>
                            <div class="flex justify-between text-xs text-gray-400"><span>Pedidos</span><span>{{ ventasSemana.cantidadPedidosDomicilio || 0 }}</span></div>
                        </div>
                        <p v-else class="text-sm text-gray-400 mb-3">Todavía no hay envíos finalizados esta semana.</p>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm p-4 mt-4">
                    <p v-if="ventasSemana?.cerrado" class="text-sm font-bold text-green-600">
                        ✅ Cerrada ({{ ventasSemana.cierre.diasCerrados }}/{{ ventasSemana.cierre.diasTotales }} días cerrados) por {{ ventasSemana.cierre.cerradoPor }} — Total de la semana: ₡{{ (ventasSemana.cierre.montoTotal || 0).toLocaleString('es-CR') }}
                    </p>
                    <button v-else @click="cerrarSemana" :disabled="cerrandoSemana || !ventasSemana"
                        class="w-full bg-[var(--primary)] text-white py-2 rounded-xl font-bold hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer disabled:opacity-50">
                        {{ cerrandoSemana ? 'Cerrando...' : 'Cerrar semana' }}
                    </button>
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
                                    <span v-if="pedido.comerEnLocal"
                                        class="block text-xs font-bold"
                                        :class="pedido.estadoLlegada === 'en_local' ? 'text-green-600' : 'text-amber-600'">
                                        🍽️ {{ pedido.estadoLlegada === 'en_local' ? 'Ya está en el local' : 'Por llegar' }}
                                    </span>
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
                            <td class="p-3 text-center flex items-center justify-center gap-1"><img :src="assets.coinIconUrl" alt="ManiaCoins" class="w-4 h-4 inline-block" /> {{ pedido.puntosGanados || 0 }}</td>
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
                                <div class="flex items-center gap-2">
                                    <select :value="pedido.estado" @change="cambiarEstado(pedido, $event.target.value)"
                                        class="border rounded-lg p-1 text-xs hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                                        <option value="pendiente">Pendiente</option>
                                        <option value="en transcurso">En transcurso</option>
                                        <option value="finalizado">Finalizado</option>
                                        <option value="cancelado">Cancelado</option>
                                    </select>
                                    <button @click="imprimirPedido(pedido)" title="Imprimir factura"
                                        class="text-gray-500 hover:text-[var(--primary)] transition-colors hover:cursor-pointer">
                                        <span class="pi pi-print text-lg"></span>
                                    </button>
                                </div>
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
                        <p class="flex items-center gap-1"><img :src="assets.coinIconUrl" alt="ManiaCoins" class="w-4 h-4 inline-block" /> ManiaCoins: {{ pedido.puntosGanados || 0 }} <span v-if="pedido.puntosCanjeados" class="text-red-500">🔥 -{{ pedido.puntosCanjeados }}</span></p>
                        <p>{{ pedido.tipoRetiro === 'sucursal' ? `🏪 ${pedido.sucursal}` : `🛵 ${pedido.direccion}` }}
                        </p>
                        <p v-if="pedido.comerEnLocal" class="font-bold"
                            :class="pedido.estadoLlegada === 'en_local' ? 'text-green-600' : 'text-amber-600'">
                            🍽️ {{ pedido.estadoLlegada === 'en_local' ? 'Ya está en el local' : 'Por llegar' }}
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
                        <button @click="imprimirPedido(pedido)" title="Imprimir factura"
                            class="border border-gray-300 text-gray-600 px-3 rounded-lg hover:bg-gray-50 transition-colors hover:cursor-pointer">
                            <span class="pi pi-print"></span>
                        </button>
                    </div>
                </div>
            </div>
        </main>

        <!-- Modal detalle del pedido -->
        <div v-if="pedidoDetalle" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center p-5 border-b">
                    <h2 class="text-xl font-bold">Detalle del pedido</h2>
                    <div class="flex items-center gap-1">
                        <button @click="imprimirPedido(pedidoDetalle)" title="Imprimir factura"
                            class="text-gray-500 hover:text-[var(--primary)] hover:cursor-pointer p-2">
                            <span class="pi pi-print text-lg"></span>
                        </button>
                        <button @click="pedidoDetalle = null"
                            class="pi pi-times text-red-500 hover:cursor-pointer p-2"></button>
                    </div>
                </div>
                <div class="p-5 flex flex-col gap-4">

                    <!-- Promo primeros 100 -->
                    <div v-if="pedidoDetalle.promoPapasGratis"
                        class="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-center text-sm font-bold">
                        🎁 PROMO: Papas pequeñas GRATIS (pedido #{{ pedidoDetalle.promoPapasGratisNumero }}/100)
                    </div>

                    <!-- Merchandising: 3 a 5 días, retirar en sucursal -->
                    <div v-if="pedidoDetalle.esMerchandising"
                        class="bg-amber-50 border-2 border-amber-400 text-amber-800 rounded-xl p-3 text-center">
                        <p class="font-bold text-base">⏳ TRES A CINCO DÍAS EN ENTREGAR</p>
                        <p class="font-bold text-sm mt-1">RETIRAR EN LA SUCURSAL MÁS CERCANA</p>
                        <p class="text-sm mt-1">📍 {{ pedidoDetalle.sucursal }}</p>
                    </div>

                    <!-- Cliente -->
                    <div>
                        <p class="text-xs text-gray-400 uppercase font-bold mb-2">Cliente</p>
                        <p class="font-bold">{{ pedidoDetalle.nombre }}</p>
                        <p class="text-sm text-gray-500">{{ pedidoDetalle.usuario }}</p>
                        <p class="text-sm text-gray-500">📞 {{ pedidoDetalle.telefono }}</p>
                    </div>

                    <!-- Comentarios del cliente -->
                    <div v-if="pedidoDetalle.comentarios"
                        class="bg-amber-50 border-2 border-dashed border-amber-400 text-amber-800 rounded-xl p-3">
                        <p class="text-xs uppercase font-bold mb-1">📝 Comentarios del cliente</p>
                        <p class="text-sm">{{ pedidoDetalle.comentarios }}</p>
                    </div>

                    <!-- Items -->
                    <div>
                        <p class="text-xs text-gray-400 uppercase font-bold mb-2">Productos</p>
                        <div v-for="item in pedidoDetalle.items" :key="item.id"
                            class="flex justify-between text-sm py-1 border-b">
                            <div>
                                <span>{{ item.nombre }} x{{ item.cantidad }}</span>
                                <div v-for="(extra, idx) in obtenerExtrasItem(item)" :key="idx" class="text-xs text-gray-400">
                                    {{ extra }}
                                </div>
                            </div>
                            <span class="font-bold whitespace-nowrap">
                                <template v-if="item.esCanje">🪙 {{ (item.puntosCanje || 0) * item.cantidad }}</template>
                                <template v-else>₡{{ item.precio * item.cantidad }}</template>
                            </span>
                        </div>
                    </div>

                    <!-- Totales -->
                    <div class="bg-gray-50 rounded-xl p-3">
                        <div class="flex justify-between text-sm mb-1">
                            <span>Subtotal productos</span>
                            <span>₡{{ pedidoDetalle.subtotal }}</span>
                        </div>
                        <div v-if="pedidoDetalle.costoBebidas > 0" class="flex justify-between text-sm mb-1">
                            <span>🥤 Bebidas</span>
                            <span>₡{{ pedidoDetalle.costoBebidas }}</span>
                        </div>
                        <div v-if="pedidoDetalle.costoAgrandar > 0" class="flex justify-between text-sm mb-1">
                            <span>⬆️ Agrandados</span>
                            <span>₡{{ pedidoDetalle.costoAgrandar }}</span>
                        </div>
                        <div v-if="pedidoDetalle.costoExtra > 0" class="flex justify-between text-sm mb-1">
                            <span>➕ Extras</span>
                            <span>₡{{ pedidoDetalle.costoExtra }}</span>
                        </div>
                        <div v-if="pedidoDetalle.montoDescuento > 0" class="flex justify-between text-sm mb-1 text-green-600 font-bold">
                            <span>🏷️ Descuento</span>
                            <span>-₡{{ pedidoDetalle.montoDescuento }}</span>
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
                            <span class="flex items-center gap-1"><img :src="assets.coinIconUrl" alt="ManiaCoins" class="w-3.5 h-3.5 inline-block" /> ManiaCoins ganados</span>
                            <span>{{ pedidoDetalle.puntosGanados || 0 }}</span>
                        </div>
                        <div v-if="pedidoDetalle.puntosCanjeados" class="flex justify-between text-sm text-red-600">
                            <span>🔥 ManiaCoins canjeados</span>
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
                            <p v-if="pedidoDetalle.comerEnLocal" class="text-sm font-bold"
                                :class="pedidoDetalle.estadoLlegada === 'en_local' ? 'text-green-600' : 'text-amber-600'">
                                🍽️ Come en el local — {{ pedidoDetalle.estadoLlegada === 'en_local' ? 'ya está ahí' : 'está por llegar' }}
                            </p>
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
import { ref as vueRef, computed, watch, onMounted, onUnmounted } from 'vue'
import { collection, doc, getDoc, getDocs, addDoc, Timestamp, updateDoc, query, where, orderBy, limit, increment, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { useRouter } from 'vue-router'
import { useCartStore, useAssets } from '../stores/cartStores.js'
import { cargarCoinIcon } from '../composable/useCoinIcon.js'
import { costoBebidaManiaCoins, COIN_COSTOS } from '../utils/maniacoins.js'
import { db, auth } from '../firebase.js'

const router = useRouter()
const assets = useAssets()
cargarCoinIcon()

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
const showNotifModal = vueRef(false)
const notifTitle = vueRef('')
const notifBody = vueRef('')
const notifTarget = vueRef('all')
const notifLoading = vueRef(false)
const notifMsg = vueRef('')
const notifMsgType = vueRef('success')
const ventasHoy = vueRef(null)
const ventasSemana = vueRef(null)
const cerrandoDia = vueRef(false)
const cerrandoSemana = vueRef(false)
const recalculandoDia = vueRef(false)
const errorCierre = vueRef('')

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
                setupVentasListener()
            }
        }
    } catch (error) {
        console.error('Error verificando admin:', error)
    } finally {
        verificando.value = false
    }
}

// ── Listener en tiempo real para pedidos (acotado por sucursal del admin) ──
const PEDIDOS_LIMITE = 300

let unsubPedidosSucursal = null
let unsubPedidosDomicilio = null
const pedidosPorId = new Map()

const knownOrderIds = new Set()
const isInitialLoadSucursal = { value: true }
const isInitialLoadDomicilio = { value: true }

function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const duration = 0.12
        const gap = 0.1
        const volume = 0.5

        for (let i = 0; i < 4; i++) {
            const t = ctx.currentTime + i * (duration + gap)
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = 'square'
            osc.frequency.setValueAtTime(660 + i * 110, t)
            gain.gain.setValueAtTime(volume, t)
            gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
            osc.start(t)
            osc.stop(t + duration)
        }
    } catch (e) {
        console.warn('No se pudo reproducir el sonido:', e)
    }
}

const buildPedidosQuery = (tipoRetiro, campoSucursal) =>
    query(
        collection(db, 'pedidos'),
        where('tipoRetiro', '==', tipoRetiro),
        where(campoSucursal, '==', adminSucursal.value),
        orderBy('creadoEn', 'desc'),
        limit(PEDIDOS_LIMITE)
    )

const refrescarPedidos = () => {
    pedidos.value = Array.from(pedidosPorId.values())
        .sort((a, b) => (b.creadoEn?.seconds ?? 0) - (a.creadoEn?.seconds ?? 0))
    cargandoPedidos.value = false
}

const manejarSnapshotPedidos = (snapshot, esInicial) => {
    if (!esInicial.value) {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added' && !knownOrderIds.has(change.doc.id) && change.doc.data().estado === 'pendiente') {
                playNotificationSound()
            }
        })
    } else {
        esInicial.value = false
    }

    snapshot.docChanges().forEach(change => {
        if (change.type === 'removed') {
            pedidosPorId.delete(change.doc.id)
            knownOrderIds.delete(change.doc.id)
        } else {
            pedidosPorId.set(change.doc.id, { id: change.doc.id, ...change.doc.data() })
            knownOrderIds.add(change.doc.id)
        }
    })

    refrescarPedidos()
}

const setupPedidosListener = () => {
    if (unsubPedidosSucursal) unsubPedidosSucursal()
    if (unsubPedidosDomicilio) unsubPedidosDomicilio()

    pedidosPorId.clear()
    knownOrderIds.clear()
    isInitialLoadSucursal.value = true
    isInitialLoadDomicilio.value = true
    cargandoPedidos.value = true

    const onError = (label) => (error) => {
        console.error(`Error en listener de pedidos (${label}):`, error)
        cargandoPedidos.value = false
    }

    unsubPedidosSucursal = onSnapshot(
        buildPedidosQuery('sucursal', 'sucursal'),
        (snapshot) => manejarSnapshotPedidos(snapshot, isInitialLoadSucursal),
        onError('sucursal')
    )

    unsubPedidosDomicilio = onSnapshot(
        buildPedidosQuery('domicilio', 'sucursalCercana'),
        (snapshot) => manejarSnapshotPedidos(snapshot, isInitialLoadDomicilio),
        onError('domicilio')
    )
}

// ── Ventas del día/semana (cierre de caja) ─────────────────────────────────
// Mismo ajuste de horario Costa Rica (UTC-6) que usan esDiaDoble/fechaVentaCR
// en el servidor — duplicado a propósito, igual que ya pasa con promociones.js.
const OFFSET_CR_MS = 6 * 60 * 60 * 1000

const fechaHoyCR = () => {
    const cr = new Date(Date.now() - OFFSET_CR_MS)
    const y = cr.getUTCFullYear()
    const m = String(cr.getUTCMonth() + 1).padStart(2, '0')
    const d = String(cr.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

const semanaIdHoyCR = () => {
    const cr = new Date(Date.now() - OFFSET_CR_MS)
    const soloFecha = new Date(Date.UTC(cr.getUTCFullYear(), cr.getUTCMonth(), cr.getUTCDate()))
    const diaSemana = soloFecha.getUTCDay() || 7
    const jueves = new Date(soloFecha)
    jueves.setUTCDate(jueves.getUTCDate() - diaSemana + 1 + 3)
    const inicioAno = new Date(Date.UTC(jueves.getUTCFullYear(), 0, 1))
    const numeroSemana = Math.ceil((((jueves - inicioAno) / 86400000) + 1) / 7)
    return `${jueves.getUTCFullYear()}-W${String(numeroSemana).padStart(2, '0')}`
}

let unsubVentasHoy = null
let unsubVentasSemana = null

const setupVentasListener = () => {
    if (unsubVentasHoy) unsubVentasHoy()
    if (unsubVentasSemana) unsubVentasSemana()

    unsubVentasHoy = onSnapshot(doc(db, 'ventas', fechaHoyCR()), (snap) => {
        ventasHoy.value = snap.data()?.sucursales?.[adminSucursal.value] || null
    }, (error) => console.error('Error escuchando ventas de hoy:', error))

    unsubVentasSemana = onSnapshot(doc(db, 'ventas_semanales', semanaIdHoyCR()), (snap) => {
        ventasSemana.value = snap.data()?.sucursales?.[adminSucursal.value] || null
    }, (error) => console.error('Error escuchando ventas de la semana:', error))
}

const cerrarVentaDiaFn = httpsCallable(getFunctions(), 'cerrarVentaDia')
const cerrarVentaSemanaFn = httpsCallable(getFunctions(), 'cerrarVentaSemana')
const recalcularVentaDiaFn = httpsCallable(getFunctions(), 'recalcularVentaDia')

const recalcularHoy = async () => {
    errorCierre.value = ''
    recalculandoDia.value = true
    try {
        await recalcularVentaDiaFn()
    } catch (error) {
        console.error('Error recalculando ventas de hoy:', error)
        errorCierre.value = error.message || 'Error al recalcular'
    } finally {
        recalculandoDia.value = false
    }
}

const cerrarCaja = async () => {
    if (!confirm('¿Cerrar la caja de hoy? Esta acción no se puede deshacer.')) return
    errorCierre.value = ''
    cerrandoDia.value = true
    try {
        await cerrarVentaDiaFn()
    } catch (error) {
        console.error('Error cerrando caja:', error)
        errorCierre.value = error.message || 'Error al cerrar la caja'
    } finally {
        cerrandoDia.value = false
    }
}

const cerrarSemana = async () => {
    if (!confirm('¿Cerrar la semana? Esta acción no se puede deshacer.')) return
    errorCierre.value = ''
    cerrandoSemana.value = true
    try {
        await cerrarVentaSemanaFn()
    } catch (error) {
        console.error('Error cerrando semana:', error)
        errorCierre.value = error.message || 'Error al cerrar la semana'
    } finally {
        cerrandoSemana.value = false
    }
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

// ── Sonido continuo mientras haya pedidos pendientes ───────────────────────
const sonidoSilenciado = vueRef(false)
const hayPedidosPendientes = computed(() =>
    pedidosDeSucursal.value.some(p => p.estado === 'pendiente')
)

let intervaloSonido = null

watch(hayPedidosPendientes, (hay) => {
    if (hay && !sonidoSilenciado.value) {
        if (!intervaloSonido) {
            playNotificationSound()
            intervaloSonido = setInterval(playNotificationSound, 5000)
        }
    } else if (intervaloSonido) {
        clearInterval(intervaloSonido)
        intervaloSonido = null
    }
})

watch(sonidoSilenciado, (silenciado) => {
    if (silenciado && intervaloSonido) {
        clearInterval(intervaloSonido)
        intervaloSonido = null
    } else if (!silenciado && hayPedidosPendientes.value && !intervaloSonido) {
        intervaloSonido = setInterval(playNotificationSound, 5000)
    }
})

const totalHoy = computed(() => {
    // Mismo criterio que "Cierre de caja — Hoy": solo pedidos finalizados,
    // y el día se cuenta en horario Costa Rica (no medianoche del navegador).
    const cr = new Date(Date.now() - OFFSET_CR_MS)
    const inicioHoyUTC = Date.UTC(cr.getUTCFullYear(), cr.getUTCMonth(), cr.getUTCDate(), 6, 0, 0)
    const inicioHoySeconds = inicioHoyUTC / 1000
    return pedidosDeSucursal.value
        .filter(p => p.estado === 'finalizado' && (p.creadoEn?.seconds ?? 0) >= inicioHoySeconds)
        .reduce((acc, p) => acc + (Number(p.total) || 0), 0)
})

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
    {
        label: 'Total hoy',
        valor: `₡${totalHoy.value.toLocaleString('es-CR')}`,
        color: '#16a34a'
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
        if (!pedido.usuario || pedido.usuario === 'Anónimo') return
        const q = query(collection(db, 'clientes'), where('email', '==', pedido.usuario))
        const snap = await getDocs(q)
        if (snap.empty) return

        const clienteRef = doc(db, 'clientes', snap.docs[0].id)
        const pts = pedido.puntosGanados || 0
        const cambios = {}
        if (pts > 0) {
            cambios.puntos = increment(pts)
            cambios.ultimaGananciaCoins = Timestamp.now()
        }
        // El flag de "primera compra" recién se consume acá, cuando el pedido se completa de
        // verdad — no al crearlo (functions/index.js), para que un pedido de prueba o cancelado
        // no le queme el bono de primera compra a un cliente real.
        if (pedido.esPrimeraCompra) {
            cambios.primeraCompra = false
        }
        if (Object.keys(cambios).length > 0) {
            await updateDoc(clienteRef, cambios)
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

// ── Imprimir pedido (factura) ──────────────────────────────────────────────
const escapeHtml = (valor) => {
    if (valor === null || valor === undefined) return ''
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

// Mismo valor que AGRANDAR_COSTO en Checkoutmodal.vue y functions/calculos.js.
const AGRANDAR_COSTO = 500

// Extras de un ítem de pedido, usado tanto en el ticket impreso como en el modal de detalle.
const obtenerExtrasItem = (item) => {
    const extras = []
    if (item.bebida) {
        const costo = item.bebida.canjeadoConPuntos
            ? `🪙 ${costoBebidaManiaCoins(item.bebida.precio) * item.cantidad}`
            : `+₡${item.bebida.precio * item.cantidad}`
        extras.push(`🥤 ${item.bebida.nombre} — ${costo}`)
    }
    if (item.bebidaEspecifica) extras.push(`🥤 Incluye ${item.bebidaEspecifica.nombre} (cortesía)`)
    if (item.extra) extras.push(`➕ ${item.extra.nombre} — +₡${item.extra.monto * item.cantidad}`)
    if (item.descuento > 0) extras.push(`🏷️ Descuento producto -${item.descuento}%`)
    if (item.proteinaSel) extras.push(`🍗 ${item.proteinaSel}`)
    if (item.gaseosaSel) extras.push(`🥤 Sabor: ${item.gaseosaSel}`)
    if (item.papasConSalsa) extras.push('🍟 Papas con salsa')
    if (item.salsaSel) extras.push(`🌶️ ${item.salsaSel}`)
    if (item.salsasAlitas?.length) extras.push(`🌶️ Salsas: ${item.salsasAlitas.join(', ')}`)
    if (item.agrandarPapas) {
        const costo = item.agrandarConPuntos
            ? `🪙 ${COIN_COSTOS.AGRANDAR * item.cantidad}`
            : `+₡${AGRANDAR_COSTO * item.cantidad}`
        extras.push(`⬆️ Papas agrandadas — ${costo}`)
    }
    if (item.papasFritasGratisSel) extras.push('🍟 Papas fritas (cortesía)')
    if (item.tallaSel) extras.push(`👕 Talla: ${item.tallaSel}`)
    return extras
}

const construirFilasItemsFactura = (items) => {
    return (items || []).map(item => {
        const extras = obtenerExtrasItem(item).map(e => escapeHtml(e))

        const precio = item.esCanje
            ? `🪙${(item.puntosCanje || 0) * item.cantidad}`
            : `₡${item.precio * item.cantidad}`

        return `
            <tr>
                <td class="item-col">
                    <div class="item-nombre">${item.cantidad}x ${escapeHtml(item.nombre)}</div>
                    ${extras.map(e => `<div class="item-extra">- ${e}</div>`).join('')}
                </td>
                <td class="item-precio">${precio}</td>
            </tr>
        `
    }).join('')
}

const imprimirPedido = (pedido) => {
    if (!pedido) return

    const ventana = window.open('', '_blank', 'width=340,height=700')
    if (!ventana) {
        errorMsg.value = 'Habilitá las ventanas emergentes para poder imprimir.'
        return
    }

    const comerEnLocalHtml = pedido.comerEnLocal
        ? `<div class="fila-simple"><strong>🍽️ COME EN EL LOCAL — ${pedido.estadoLlegada === 'en_local' ? 'YA ESTÁ AHÍ' : 'POR LLEGAR'}</strong></div>`
        : ''

    const retiroHtml = pedido.tipoRetiro === 'sucursal'
        ? `<div class="fila"><span>Retiro</span><span>Sucursal</span></div>
           <div class="fila-simple">${escapeHtml(pedido.sucursal)}</div>
           <div class="fila-simple">${escapeHtml(pedido.fechaRetiro)} ${escapeHtml(pedido.horaRetiro)}</div>
           ${comerEnLocalHtml}`
        : `<div class="fila"><span>Retiro</span><span>Domicilio</span></div>
           <div class="fila-simple">${escapeHtml(pedido.direccion)}</div>`

    const pagoHtml = pedido.metodoPago === 'efectivo'
        ? `<div class="fila"><span>Pago</span><span>Efectivo</span></div>
           <div class="fila"><span>Recibido</span><span>₡${escapeHtml(pedido.montoEfectivo)}</span></div>
           <div class="fila"><span>Vuelto</span><span>₡${escapeHtml(pedido.vuelto)}</span></div>`
        : `<div class="fila"><span>Pago</span><span>SINPE Móvil</span></div>`

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Pedido ${escapeHtml((pedido.id || '').slice(-6).toUpperCase())}</title>
<style>
    @page { size: 80mm auto; margin: 0; }
    * { box-sizing: border-box; }
    body { font-family: 'Courier New', Courier, monospace; color: #000; margin: 0; padding: 4mm 0; background: #fff; font-weight: bold; }
    .ticket { width: 72mm; margin: 0 auto; font-size: 12px; line-height: 1.4; }
    .center { text-align: center; }
    .logo { width: 44px; height: 44px; object-fit: contain; margin-bottom: 4px; }
    .brand { font-size: 16px; font-weight: bold; letter-spacing: 1px; margin: 0; }
    .subtitle { font-size: 11px; margin: 2px 0 0; }
    .sep { border-top: 1px dashed #000; margin: 6px 0; }
    .fila { display: flex; justify-content: space-between; gap: 8px; }
    .fila-simple { margin-left: 2px; }
    table.items { width: 100%; border-collapse: collapse; }
    table.items td { padding: 2px 0; vertical-align: top; }
    .item-precio { text-align: right; white-space: nowrap; font-weight: bold; }
    .item-extra { font-size: 10px; margin-left: 6px; }
    .total-row { font-weight: bold; font-size: 14px; }
    .footer { margin-top: 8px; font-size: 11px; }
    @media print {
        body { padding: 0; }
    }
</style>
</head>
<body>
    <div class="ticket">
        <div class="center">
            <img class="logo" src="/logoFoodmania4.PNG" alt="Foodmania" />
            <p class="brand">FOODMANIA</p>
            <p class="subtitle">COMPROBANTE DE PEDIDO</p>
        </div>
        ${pedido.esMerchandising ? `
        <div class="sep"></div>
        <div class="center" style="border:3px solid #000;padding:6px;font-weight:bold;">
            <p style="font-size:14px;margin:0;">⏳ TRES A CINCO DÍAS</p>
            <p style="font-size:14px;margin:0;">EN ENTREGAR</p>
            <p style="font-size:12px;margin:4px 0 0;">RETIRAR EN LA SUCURSAL MÁS CERCANA</p>
            <p style="font-size:12px;margin:2px 0 0;">📍 ${escapeHtml(pedido.sucursal)}</p>
        </div>` : ''}
        <div class="sep"></div>
        <div class="fila"><span>Pedido</span><span>#${escapeHtml((pedido.id || '').slice(-6).toUpperCase())}</span></div>
        <div class="fila"><span>Fecha</span><span>${escapeHtml(formatearFecha(pedido.creadoEn))}</span></div>
        <div class="fila"><span>Estado</span><span>${escapeHtml(pedido.estado)}</span></div>
        <div class="sep"></div>
        <div class="fila-simple"><strong>Cliente:</strong> ${escapeHtml(pedido.nombre)}</div>
        <div class="fila-simple"><strong>Tel:</strong> ${escapeHtml(pedido.telefono)}</div>
        <div class="sep"></div>
        ${pedido.comentarios ? `
        <div class="center" style="border:2px dashed #000;padding:5px;font-weight:bold;">
            <p style="margin:0;">📝 COMENTARIOS DEL CLIENTE</p>
            <p style="margin:3px 0 0;font-weight:normal;">${escapeHtml(pedido.comentarios)}</p>
        </div>
        <div class="sep"></div>` : ''}
        <table class="items">
            <tbody>${construirFilasItemsFactura(pedido.items)}</tbody>
        </table>
        <div class="sep"></div>
        <div class="fila"><span>Subtotal</span><span>₡${escapeHtml(pedido.subtotal)}</span></div>
        ${pedido.costoBebidas > 0 ? `<div class="fila"><span>Bebidas</span><span>₡${escapeHtml(pedido.costoBebidas)}</span></div>` : ''}
        ${pedido.costoAgrandar > 0 ? `<div class="fila"><span>Agrandados</span><span>₡${escapeHtml(pedido.costoAgrandar)}</span></div>` : ''}
        ${pedido.costoExtra > 0 ? `<div class="fila"><span>Extras</span><span>₡${escapeHtml(pedido.costoExtra)}</span></div>` : ''}
        ${pedido.montoDescuento > 0 ? `<div class="fila" style="font-weight:bold;"><span>🏷️ Descuento</span><span>-₡${escapeHtml(pedido.montoDescuento)}</span></div>` : ''}
        ${pedido.costoEnvio > 0 ? `<div class="fila"><span>Envío</span><span>₡${escapeHtml(pedido.costoEnvio)}</span></div>` : ''}
        <div class="sep"></div>
        <div class="fila total-row"><span>TOTAL</span><span>₡${escapeHtml(pedido.total)}</span></div>
        <div class="sep"></div>
        ${pedido.puntosCanjeados ? `<div class="fila"><span>ManiaCoins canjeados</span><span>-${escapeHtml(pedido.puntosCanjeados)}</span></div>` : ''}
        <div class="fila"><span>ManiaCoins ganados</span><span>+${escapeHtml(pedido.puntosGanados || 0)}</span></div>
        ${pedido.promoPapasGratis ? `<div class="sep"></div><div class="center" style="font-weight:bold;">🎁 PROMO: Papas pequeñas GRATIS</div>` : ''}
        <div class="sep"></div>
        ${retiroHtml}
        <div class="sep"></div>
        ${pagoHtml}
        <div class="sep"></div>
        <div class="center footer">
            <p>¡Gracias por su compra!</p>
            <p>Foodmania</p>
        </div>
    </div>
    <script>
        window.onload = function () {
            window.print();
            window.onafterprint = function () { window.close(); };
        };
    <\/script>
</body>
</html>`

    ventana.document.open()
    ventana.document.write(html)
    ventana.document.close()
}

// ── Enviar notificación push ──────────────────────────────────────────────
const enviarNotificacion = async () => {
    notifMsg.value = ''
    notifLoading.value = true
    try {
        const sendNotif = httpsCallable(getFunctions(), 'sendNotification')
        const targetMap = {
            all: 'all',
            rookie: { type: 'nivel', coinsMin: 500 },
            maniaco: { type: 'nivel', coinsMin: 1000 },
            supremo: { type: 'nivel', coinsMin: 2000 },
            rey: { type: 'nivel', coinsMin: 3000 },
        }
        const result = await sendNotif({
            title: notifTitle.value,
            body: notifBody.value,
            target: targetMap[notifTarget.value] || 'all',
        })
        const { successCount, failureCount } = result.data
        notifMsg.value = `✅ Notificación enviada: ${successCount} éxito(s), ${failureCount} fallo(s)`
        notifMsgType.value = 'success'
        notifTitle.value = ''
        notifBody.value = ''
    } catch (error) {
        console.error('Error enviando notificación:', error)
        notifMsg.value = '❌ Error al enviar: ' + (error.message || error.code)
        notifMsgType.value = 'error'
    } finally {
        notifLoading.value = false
    }
}

// ── Cerrar sesión ──────────────────────────────────────────────────────────
const cerrarSesion = async () => {
    useCartStore().items = []
    await signOut(auth)
    router.push('/')
}

// ── Auth check al montar ───────────────────────────────────────────────────
let unsubAuth = null

onMounted(() => {
    unsubAuth = onAuthStateChanged(auth, async (user) => {
        if (user) {
            await verificarAdmin(user)
        } else {
            verificando.value = false
            router.push('/')
        }
    })
})

onUnmounted(() => {
    if (unsubAuth) unsubAuth()
    if (unsubPedidosSucursal) unsubPedidosSucursal()
    if (unsubPedidosDomicilio) unsubPedidosDomicilio()
    if (unsubVentasHoy) unsubVentasHoy()
    if (unsubVentasSemana) unsubVentasSemana()
    if (intervaloSonido) clearInterval(intervaloSonido)
})
</script>
