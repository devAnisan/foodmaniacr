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

        <div v-if="successMsg"
          class="flex flex-col items-center justify-center p-10 gap-4 text-center">
          <p class="text-5xl">✅</p>
          <p class="text-lg font-bold text-green-700">{{ successMsg }}</p>
          <p class="text-sm text-green-600">📧 Te enviamos el comprobante del pedido a tu correo</p>
          <button @click="emit('update:modelValue', false)"
            class="bg-[var(--primary)] text-white px-6 py-2 rounded-full font-bold hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
            Cerrar
          </button>
        </div>

        <div v-else-if="cartStore.items.length === 0"
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
                </div>
                <span v-if="item.esCanje" class="font-bold text-yellow-600 text-right flex items-center gap-1"><img :src="assets.coinIconUrl" alt="ManiaCoins" class="w-3.5 h-3.5 inline-block" /> {{ item.puntosCanje * item.cantidad }} ManiaCoins</span>
                <span v-else class="font-bold text-right">₡{{ item.precio * item.cantidad }} colones</span>
              </div>

              <!-- Bebida asociada a un producto -->
              <div v-if="item.bebida" class="flex justify-between text-xs text-gray-500 mt-1 ml-2">
                <div class="flex items-center gap-1">
                  <span>🥤 {{ item.bebida.nombre }} x{{ item.cantidad }}</span>
                  <button v-if="userLogueado" @click="toggleBebidaCoins(item)"
                    :class="bebidaPuntosMap[item._uid] ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-200'"
                    class="text-[10px] px-2 py-0.5 rounded-full border font-bold ml-2 hover:cursor-pointer transition-colors">
                    <template v-if="bebidaPuntosMap[item._uid]">⭐ Canjeado</template>
                    <template v-else><img :src="assets.coinIconUrl" alt="ManiaCoins" class="w-3 h-3 inline-block" /> {{ costoBebidaManiaCoins(item.bebida.precio) }} coins</template>
                  </button>
                </div>
                <span :class="bebidaPuntosMap[item._uid] ? 'text-green-600 line-through' : ''">
                  +₡{{ item.bebida.precio * item.cantidad }}
                  <span v-if="bebidaPuntosMap[item._uid]" class="text-green-600 font-bold ml-1 no-underline">
                    ({{ costoBebidaManiaCoins(item.bebida.precio) }} <img :src="assets.coinIconUrl" alt="ManiaCoins" class="w-3 h-3 inline-block" />)
                  </span>
                </span>
              </div>

              <!-- Bebida específica incluida (cortesía, no se cobra) -->
              <div v-if="item.bebidaEspecifica" class="text-xs text-gray-500 mt-1 ml-2">🥤 Incluye {{ item.bebidaEspecifica.nombre }} (cortesía)</div>

              <!-- Papas con salsa -->
              <div v-if="item.papasConSalsa" class="text-xs text-gray-500 mt-1 ml-2">🍟 Papas con salsa</div>

              <!-- Proteína seleccionada -->
              <div v-if="item.proteinaSel" class="text-xs text-gray-500 mt-1 ml-2">🍗 {{ item.proteinaSel }}</div>

              <!-- Sabor de gaseosa -->
              <div v-if="item.gaseosaSel" class="text-xs text-gray-500 mt-1 ml-2">🥤 Sabor: {{ item.gaseosaSel }}</div>

              <!-- Con/sin salsa (papas) -->
              <div v-if="item.salsaSel" class="text-xs text-gray-500 mt-1 ml-2">🌶️ {{ item.salsaSel }}</div>

              <!-- Salsas Alitas Mania / Nuggets -->
              <div v-if="item.salsasAlitas?.length" class="text-xs text-gray-500 mt-1 ml-2">
                🌶️ {{ item.salsasAlitas.join(', ') }}
              </div>

              <!-- Papas fritas gratis (cantones) -->
              <div v-if="item.papasFritasGratisSel" class="text-xs text-gray-500 mt-1 ml-2">🍟 Papas fritas (cortesía)</div>

              <!-- Talla (merchandising) -->
              <div v-if="item.tallaSel" class="text-xs text-gray-500 mt-1 ml-2">👕 Talla: {{ item.tallaSel }}</div>

              <!-- Agrandar papas (pollofrito con papas == true) -->
              <div v-if="item.papas === true" class="mt-2 ml-2 flex flex-wrap items-center gap-2">
                <label class="flex items-center gap-1 text-xs text-gray-600 hover:cursor-pointer">
                  <input type="checkbox" v-model="agrandarMap[item._uid]" class="accent-[var(--primary)]" />
                  Agrandar papas
                </label>
                <div v-if="agrandarMap[item._uid]" class="flex gap-1">
                  <button @click="toggleAgrandarCoins(item, false)"
                    :class="!agrandarPuntosMap[item._uid] ? 'bg-[var(--primary)] text-white' : 'bg-gray-200 text-gray-600'"
                    class="text-[10px] px-2 py-0.5 rounded-full font-bold hover:cursor-pointer transition-colors">
                    ₡{{ AGRANDAR_COSTO }}
                  </button>
                  <button v-if="userLogueado" @click="toggleAgrandarCoins(item, true)"
                    :class="agrandarPuntosMap[item._uid] ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'"
                    class="text-[10px] px-2 py-0.5 rounded-full font-bold hover:cursor-pointer transition-colors">
                    <img :src="assets.coinIconUrl" alt="ManiaCoins" class="w-3 h-3 inline-block" /> {{ COIN_COSTOS.AGRANDAR }} coins
                  </button>
                </div>
              </div>
            </div>

            <!-- Aviso: no se puede mezclar merchandising con comida -->
            <div v-if="carritoMixto" class="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm font-bold text-center mt-2">
              ⚠️ No podés combinar merchandising con productos de comida en el mismo pedido. Hacé pedidos separados.
            </div>

            <!-- Descuento aplicado -->
            <div v-if="montoDescuento > 0"
              class="flex justify-between text-sm text-green-600 font-bold mt-2 pt-2 border-t border-dashed">
              <span>🏷️ Descuento aplicado</span>
              <span>-₡{{ montoDescuento }}</span>
            </div>

            <!-- Envío -->
            <div v-if="withDrawType === 'domicilio' && costoEnvio > 0"
              class="flex justify-between text-sm text-gray-500 mt-2 pt-2 border-t border-dashed">
              <div>
                <span>🛵 Envío</span>
                <span class="text-xs text-gray-400 ml-1">
                  ({{ descripcionTarifaEnvio(distancia) }})
                </span>
              </div>
              <span>₡{{ costoEnvio }}</span>
            </div>

            <div class="flex justify-between font-bold mt-3 pt-3 border-t">
              <span>Total</span>
              <span>₡{{ totalConEnvio }}</span>
            </div>

            <!-- Nivel ManiaCoins -->
            <div v-if="userLogueado && puntosActuales !== null"
              class="mt-2 bg-gradient-to-r from-purple-50 to-yellow-50 border border-purple-200 rounded-xl p-3">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-bold text-purple-700 flex items-center gap-1">
                    <img :src="assets.coinIconUrl" alt="ManiaCoins" class="w-3.5 h-3.5 inline-block" /> {{ coinsValidosComp }} ManiaCoins
                    <span v-if="coinsValidosComp < puntosActuales" class="text-[10px] text-red-400 font-normal">({{ puntosActuales - coinsValidosComp }} vencidos)</span>
                  </p>
                  <p v-if="nivelActual" class="text-[10px] font-bold text-yellow-700 mt-0.5">
                    👑 {{ nivelActual.nombre }} — {{ nivelActual.beneficios }}
                  </p>
                  <p v-else-if="puntosActuales >= 500" class="text-[10px] text-red-400 mt-0.5">
                    ⚠️ Coins vencidos o sin compras recientes
                  </p>
                  <p v-else class="text-[10px] text-gray-400 mt-0.5">
                    Acumulá 500 ManiaCoins para alcanzar nivel Rookie
                  </p>
                </div>
                <div v-if="siguienteNivel" class="text-right">
                  <p class="text-[10px] text-gray-400">Próximo nivel:</p>
                  <p class="text-xs font-bold text-purple-600">{{ siguienteNivel.nombre }}</p>
                  <p class="text-[10px] text-gray-400 flex items-center justify-end gap-1">Faltan {{ siguienteNivel.coinsFaltantes }} <img :src="assets.coinIconUrl" alt="ManiaCoins" class="w-3 h-3 inline-block" /></p>
                </div>
              </div>
            </div>

            <!-- Resumen de canje -->
            <div v-if="userLogueado && totalCoinsAGastar > 0 && puntosActuales !== null"
              class="mt-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <p class="text-xs font-bold text-yellow-700 flex items-center gap-1">
                <img :src="assets.coinIconUrl" alt="ManiaCoins" class="w-3.5 h-3.5 inline-block" /> Canjeando: {{ totalCoinsAGastar }} ManiaCoins
              </p>
              <p v-if="coinsValidosComp < totalCoinsAGastar" class="text-xs text-red-600 font-bold flex items-center flex-wrap gap-1">
                ⚠️ Tenés {{ coinsValidosComp }} <img :src="assets.coinIconUrl" alt="ManiaCoins" class="w-3 h-3 inline-block" /> disponibles, necesitás {{ totalCoinsAGastar }} <img :src="assets.coinIconUrl" alt="ManiaCoins" class="w-3 h-3 inline-block" />.
              </p>
              <p v-else class="text-xs text-green-700 flex items-center gap-1">ManiaCoins disponibles: {{ coinsValidosComp }} <img :src="assets.coinIconUrl" alt="ManiaCoins" class="w-3 h-3 inline-block" /> ✅</p>
            </div>

            <!-- ManiaCoins a ganar (solo usuarios logueados) -->
            <div v-if="userLogueado" class="mt-3 bg-gradient-to-r from-purple-50 to-yellow-50 border border-purple-200 rounded-xl p-3 flex items-center gap-3">
              <img :src="assets.coinIconUrl" alt="ManiaCoins" class="w-8 h-8 inline-block" />
              <div>
                <p class="text-sm font-bold text-[var(--primary)]">
                  Ganarás {{ coinsAGanarDisplay }} ManiaCoin{{ coinsAGanarDisplay !== 1 ? 's' : '' }} con esta compra
                </p>
                <p v-if="esDiaDobleHoy" class="text-xs bg-gradient-to-r from-purple-700 to-yellow-500 text-white font-bold px-2 py-0.5 rounded-full inline-block mt-1">
                  🔥 {{ nombreDiaDobleHoy }} — ManiaCoins x2
                </p>
                <p class="text-xs text-gray-400 flex items-center gap-1">
                  Calculado sobre ₡{{ baseCashTotal }} en productos (₡100 = 1 <img :src="assets.coinIconUrl" alt="ManiaCoins" class="w-3 h-3 inline-block" />)
                </p>
                <p v-if="primeraCompra" class="text-xs text-green-600 font-bold mt-0.5 flex items-center flex-wrap gap-1">
                  🆕 ¡Primera compra! ManiaCoins x2 — Ganarás {{ coinsAGanarComp * 2 }} <img :src="assets.coinIconUrl" alt="ManiaCoins" class="w-3 h-3 inline-block" />
                </p>
                <p v-if="esDiaDobleHoy && primeraCompra" class="text-xs text-purple-700 font-bold mt-0.5 flex items-center flex-wrap gap-1">
                  🔥 Combinado con {{ nombreDiaDobleHoy }}: Ganarás {{ coinsAGanarComp * 4 }} <img :src="assets.coinIconUrl" alt="ManiaCoins" class="w-3 h-3 inline-block" /> en total
                </p>
                <p v-if="puntosActuales !== null && totalCoinsAGastar > 0" class="text-xs text-yellow-700 font-bold mt-0.5">
                  ⚡ Los {{ coinsAGanarDisplay }} ManiaCoins de esta compra se suman después del canje
                </p>
                <p v-if="puntosActuales !== null" class="text-xs text-[var(--primary)] font-bold mt-0.5 flex items-center gap-1">
                  Saldo final estimado: {{ coinsValidosComp - totalCoinsAGastar + coinsAGanarDisplay }} <img :src="assets.coinIconUrl" alt="ManiaCoins" class="w-3 h-3 inline-block" />
                </p>
              </div>
            </div>

            <!-- ManiaCoins a ganar (usuarios NO logueados) -->
            <div v-else class="mt-3 bg-gradient-to-r from-purple-50 to-yellow-50 border border-purple-200 rounded-xl p-3">
              <div class="flex items-center gap-3">
                <img :src="assets.coinIconUrl" alt="ManiaCoins" class="w-8 h-8 inline-block" />
                <div>
                  <p class="text-sm font-bold text-[var(--primary)]">
                    Ganarías {{ coinsAGanarDisplay }} ManiaCoin{{ coinsAGanarDisplay !== 1 ? 's' : '' }} con esta compra
                  </p>
                  <p v-if="esDiaDobleHoy" class="text-xs bg-gradient-to-r from-purple-700 to-yellow-500 text-white font-bold px-2 py-0.5 rounded-full inline-block mt-1">
                    🔥 {{ nombreDiaDobleHoy }} — ManiaCoins x2
                  </p>
                </div>
              </div>
              <div class="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <p class="text-sm font-bold text-yellow-800">🔐 Iniciá sesión o registrate</p>
                <p class="text-xs text-yellow-700 mt-1">Acumulá ManiaCoins, canjeá premios y obtené beneficios exclusivos</p>
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
              <button v-if="!hayMerchandising" @click="withDrawType = 'domicilio'"
                :class="withDrawType === 'domicilio' ? 'bg-[var(--primary)] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
                class="flex-1 py-2 rounded transition-colors duration-300 hover:cursor-pointer">
                🛵 Domicilio
              </button>
            </div>
            <p v-if="hayMerchandising" class="text-xs text-gray-400 mt-2">
              📦 Merchandising: solo se puede retirar en sucursal.
            </p>
          </div>

          <!-- Datos según tipo de retiro -->
          <div class="p-5 border-b">
            <div v-if="withDrawType === 'sucursal' && hayMerchandising" class="flex flex-col gap-4">
              <p class="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-sm font-bold text-center">
                ⏳ TRES A CINCO DÍAS EN ENTREGAR. RETIRAR EN LA SUCURSAL MÁS CERCANA.
              </p>
              <div>
                <label class="text-sm text-gray-500 block mb-1">Sucursal más cercana para retirar</label>
                <button @click="obtenerUbicacionMerch()" :disabled="obteniendoUbicacion"
                  class="w-full py-2 border-2 border-dashed border-[var(--primary)] rounded-lg text-[var(--primary)] font-bold hover:bg-purple-50 transition-colors hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                  <span v-if="obteniendoUbicacion" class="pi pi-spinner animate-spin"></span>
                  {{ obteniendoUbicacion ? 'Cargando...' : '📍 Usar mi ubicación actual' }}
                </button>
                <div v-if="sucursalSeleccionada"
                  class="mt-2 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <p class="text-green-600 font-bold">✅ Retirás en: {{ sucursalSeleccionada }}</p>
                  <p class="text-gray-500 mt-1">Distancia: {{ locationStore.distancia }} km</p>
                </div>
              </div>
            </div>

            <div v-else-if="withDrawType === 'sucursal'" class="flex flex-col gap-4">
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
                <button @click="obtenerUbicacion()" :disabled="obteniendoUbicacion"
                  class="w-full py-2 border-2 border-dashed border-[var(--primary)] rounded-lg text-[var(--primary)] font-bold hover:bg-purple-50 transition-colors hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                  <span v-if="obteniendoUbicacion" class="pi pi-spinner animate-spin"></span>
                  {{ obteniendoUbicacion ? 'Cargando...' : '📍 Usar mi ubicación actual' }}
                </button>
                <div v-if="ubicacionObtenida"
                  class="mt-2 bg-green-50 border border-green-200 rounded-lg p-3 text-sm flex justify-between items-center">
                  <div>
                    <p class="text-green-600 font-bold">✅ Ubicación obtenida</p>
                    <p class="text-gray-500 mt-1">Sucursal más cercana: <strong>{{ locationStore.sucursalCercana }}</strong></p>
                    <p class="text-gray-500">Distancia: {{ locationStore.distancia }} km</p>
                    <p class="text-[var(--primary)] text-xs font-bold mt-1">
                      Envío ({{ descripcionTarifaEnvio(distancia) }}): ₡{{ costoEnvio }}
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
              <button v-if="!hayMerchandising" @click="metodoPago = 'efectivo'"
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
            <p v-if="hayMerchandising" class="text-xs text-gray-400 -mt-2 mb-4">
              📦 Merchandising: solo se puede pagar por SINPE Móvil.
            </p>

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

            <p v-if="withDrawType === 'sucursal'"
              class="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-2 mt-4 text-center">
              ℹ️ En retiro en tienda, el pago es únicamente en efectivo o SINPE Móvil.
            </p>
          </div>

          <!-- Comentarios del cliente -->
          <div class="p-5 border-b">
            <h2 class="font-bold mb-3">¿Algo que agregar? (opcional)</h2>
            <textarea v-model="comentarios"
              placeholder="Ej: sin cebolla, término medio, tocar el timbre, etc."
              maxlength="300"
              class="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" rows="3"></textarea>
            <p class="text-xs text-gray-400 mt-1 text-right">{{ comentarios.length }}/300</p>
          </div>

          <!-- Avisos finales -->
          <div class="px-5 pb-5 flex flex-col gap-3">
            <p class="bg-gray-50 border border-gray-200 text-gray-600 rounded-xl p-3 text-sm text-center font-bold">
              💵📱 Los precios mostrados aplican únicamente para pagos en Efectivo o SINPE Móvil.
            </p>
            <p class="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-3 text-sm text-center font-bold">
              ⏱️ Esperá un mínimo de 25 minutos antes de
              {{ withDrawType === 'sucursal' ? 'pasar a retirar tu pedido' : 'que llegue a domicilio' }}.
            </p>
          </div>

          <!-- Error message -->
          <div v-if="errorMsg" class="px-5">
            <p class="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm font-bold text-center">
              {{ errorMsg }}
            </p>
          </div>

          <!-- Botón confirmar -->
          <div class="p-5">
            <p v-if="!ventaHabilitada"
              class="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-sm font-bold text-center">
              🚧 ¡Ya casi abrimos! Las compras se habilitan a partir del 3 de agosto. Volvé pronto para confirmar tu pedido.
            </p>
            <button v-else @click="confirmarPedido" :disabled="loading"
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
import { useCartStore, useLocationStore, useSucursales, useAssets, useDescuentoGlobalStore } from '../stores/cartStores.js'
import { cargarCoinIcon } from '../composable/useCoinIcon.js'
import { cargarDescuentoGlobal } from '../composable/useDescuentoGlobal.js'
import { precioItemConDescuento, aplicarDescuentoGlobal } from '../composable/descuentos.js'
import { db, auth } from '../firebase.js'
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getLocation, calcularTarifaEnvio, descripcionTarifaEnvio } from '../composable/saberDistancia.js'
import { costoBebidaManiaCoins, coinsAGanar, obtenerCoinsValidos, obtenerNivelReal, obtenerSiguienteNivel, COIN_COSTOS, esDiaDoble, nombreDiaDoble } from '../utils/maniacoins.js'

const createOrder = httpsCallable(getFunctions(), 'createOrder')
const calculateOrderTotals = httpsCallable(getFunctions(), 'calculateOrderTotals')

const AGRANDAR_COSTO = 500

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const cartStore = useCartStore()
const locationStore = useLocationStore()
const sucursalesStore = useSucursales()
const assets = useAssets()
const descuentoGlobalStore = useDescuentoGlobalStore()
cargarCoinIcon()
cargarDescuentoGlobal()

const hoy = new Date().toISOString().split('T')[0]
const userLogueado = vueRef(!!auth.currentUser)

const fueraDeHorario = computed(() => {
  const hora = new Date().getHours()
  return hora < 11 || hora >= 23
})

// 3 de agosto de 2026, 00:00 hora Costa Rica (UTC-6) = 06:00 UTC. Igual a LANZAMIENTO_OFICIAL en functions/index.js.
const LANZAMIENTO_OFICIAL = new Date('2026-08-03T06:00:00.000Z')
const ventaHabilitada = computed(() => Date.now() >= LANZAMIENTO_OFICIAL.getTime())

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
const ultimaCompraVal = vueRef(null)
const ultimaGananciaCoinsVal = vueRef(null)
const primeraCompra = vueRef(false)
const comentarios = vueRef('')

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

const toggleBebidaCoins = (item) => {
  bebidaPuntosMap[item._uid] = !bebidaPuntosMap[item._uid]
}

const toggleAgrandarCoins = (item, val) => {
  agrandarPuntosMap[item._uid] = val
}

const coinsValidosComp = computed(() => obtenerCoinsValidos(puntosActuales.value, ultimaGananciaCoinsVal.value))
const nivelActual = computed(() => obtenerNivelReal(puntosActuales.value, ultimaGananciaCoinsVal.value, ultimaCompraVal.value))
const siguienteNivel = computed(() => obtenerSiguienteNivel(puntosActuales.value, ultimaGananciaCoinsVal.value))

// Merchandising (camisas/gorras): pago solo SINPE, retiro solo en sucursal más cercana (via GPS),
// tarda 3-5 días — no se puede mezclar con productos de comida en el mismo pedido.
const hayMerchandising = computed(() => cartStore.items.some(item => item._coleccionOrigen === 'merchandising'))
const hayComidaEnCarrito = computed(() => cartStore.items.some(item => item._coleccionOrigen && item._coleccionOrigen !== 'merchandising'))
const carritoMixto = computed(() => hayMerchandising.value && hayComidaEnCarrito.value)

watch(hayMerchandising, (val) => {
  if (val && !carritoMixto.value) {
    withDrawType.value = 'sucursal'
    metodoPago.value = 'sinpe'
  }
})

const baseCashTotal = computed(() => {
  return cartStore.items.reduce((acc, item) => {
    if (item.esCanje) return acc
    return acc + precioItemConDescuento(item, descuentoGlobalStore) * item.cantidad
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

const totalCoinsAGastar = computed(() => {
  let coins = 0
  for (const item of cartStore.items) {
    if (item.esCanje) {
      coins += item.puntosCanje * item.cantidad
    }
    if (bebidaPuntosMap[item._uid] && item.bebida) {
      coins += costoBebidaManiaCoins(item.bebida.precio) * item.cantidad
    }
    if (agrandarMap[item._uid] && agrandarPuntosMap[item._uid]) {
      coins += COIN_COSTOS.AGRANDAR * item.cantidad
    }
  }
  return coins
})

const cashTotalSinDescuento = computed(() => {
  return baseCashTotal.value + totalBebidasCash.value + totalAgrandarCash.value
})

const cashTotalSinEnvio = computed(() => {
  return aplicarDescuentoGlobal(cashTotalSinDescuento.value, descuentoGlobalStore)
})

const montoDescuento = computed(() => cashTotalSinDescuento.value - cashTotalSinEnvio.value)

const distancia = computed(() => {
  return parseFloat(locationStore.distancia) || 0
})

const costoEnvio = computed(() => {
  if (withDrawType.value !== 'domicilio' || !locationStore.distancia) return 0
  return calcularTarifaEnvio(distancia.value)
})

const totalConEnvio = computed(() => cashTotalSinEnvio.value + costoEnvio.value)

const esDiaDobleHoy = computed(() => esDiaDoble())
const nombreDiaDobleHoy = computed(() => nombreDiaDoble())
const multiplicadorCoins = computed(() => esDiaDobleHoy.value ? 2 : 1)
const coinsAGanarComp = computed(() => coinsAGanar(cashTotalSinEnvio.value))
const coinsAGanarDisplay = computed(() => coinsAGanarComp.value * multiplicadorCoins.value)
const coinsAGanarFinal = computed(() => coinsAGanarComp.value * multiplicadorCoins.value * (primeraCompra.value ? 2 : 1))

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
      ultimaCompraVal.value = data.ultimaCompra || null
      ultimaGananciaCoinsVal.value = data.ultimaGananciaCoins || null
      primeraCompra.value = data.primeraCompra === true
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

watch(metodoPago, (nuevoMetodo) => {
  if (nuevoMetodo === 'sinpe' && withDrawType.value === 'domicilio' && !ubicacionObtenida.value) {
    obtenerUbicacion()
  }
})

const obteniendoUbicacion = vueRef(false)

const obtenerUbicacion = async () => {
  if (!navigator.geolocation) {
    errorMsg.value = 'Geolocalización no disponible.'
    return
  }
  obteniendoUbicacion.value = true
  try {
    await getLocation(sucursalesStore.sucursalesFoodMania)
    ubicacionObtenida.value = true
    const suc = sucursalesStore.sucursalesFoodMania.find(s => s.Nombre === locationStore.sucursalCercana)
    if (suc) {
      nCelular.value = suc.nCelular || ''
      sinpeNumero.value = suc.sinpe || ''
      sinpeTitular.value = suc.aNombre || ''
    }
  } catch {
    errorMsg.value = 'No se pudo obtener tu ubicación. Verificá los permisos e intentá de nuevo.'
  } finally {
    obteniendoUbicacion.value = false
  }
}

// Merchandising: retiro obligatorio en la sucursal más cercana, determinada por GPS (Haversine),
// nunca elegida a mano — no tiene sentido pedirle "fecha y hora de retiro" si tarda 3-5 días.
const obtenerUbicacionMerch = async () => {
  if (!navigator.geolocation) {
    errorMsg.value = 'Geolocalización no disponible.'
    return
  }
  obteniendoUbicacion.value = true
  try {
    await getLocation(sucursalesStore.sucursalesFoodMania)
    sucursalSeleccionada.value = locationStore.sucursalCercana
    actualizarDatosSinpe()
  } catch {
    errorMsg.value = 'No se pudo obtener tu ubicación. Verificá los permisos e intentá de nuevo.'
  } finally {
    obteniendoUbicacion.value = false
  }
}

const abrirEnMaps = () => {
  if (!datosCliente.value.lat || !datosCliente.value.lng) return
  window.open(`https://www.google.com/maps?q=${datosCliente.value.lat},${datosCliente.value.lng}`, '_blank')
}

const armarLineaItem = (item) => {
  let linea = item.esCanje
    ? `• ${item.nombre} x${item.cantidad} (🪙 ${item.puntosCanje * item.cantidad})`
    : `• ${item.nombre} x${item.cantidad} — ₡${item.precio * item.cantidad}`
  if (item.bebida) {
    const esCanje = bebidaPuntosMap[item._uid]
    linea += `\n  🥤 ${item.bebida.nombre} x${item.cantidad}${esCanje ? ` (🪙 ${costoBebidaManiaCoins(item.bebida.precio) * item.cantidad})` : ` — ₡${item.bebida.precio * item.cantidad}`}`
  }
  if (item.bebidaEspecifica) {
    linea += `\n  🥤 Incluye ${item.bebidaEspecifica.nombre} (cortesía)`
  }
  if (item.proteinaSel) {
    linea += `\n  🍗 ${item.proteinaSel}`
  }
  if (item.gaseosaSel) {
    linea += `\n  🥤 Sabor: ${item.gaseosaSel}`
  }
  if (item.papasConSalsa) {
    linea += `\n  🍟 Papas con salsa`
  }
  if (item.salsaSel) {
    linea += `\n  🌶️ ${item.salsaSel}`
  }
  if (item.salsasAlitas?.length) {
    linea += `\n  🌶️ Salsas: ${item.salsasAlitas.join(', ')}`
  }
  if (agrandarMap[item._uid]) {
    const esCanje = agrandarPuntosMap[item._uid]
    linea += `\n  ⬆️ Papas agrandadas${esCanje ? ` (🪙 ${COIN_COSTOS.AGRANDAR * item.cantidad})` : ` (+₡${AGRANDAR_COSTO * item.cantidad})`}`
  }
  if (item.papasFritasGratisSel) {
    linea += `\n  🍟 Papas fritas (cortesía)`
  }
  if (item.tallaSel) {
    linea += `\n  👕 Talla: ${item.tallaSel}`
  }
  return linea
}

const armarMensajeWhatsApp = () => {
  const items = cartStore.items.map(armarLineaItem).join('\n')
  const pagoCadena = metodoPago.value === 'efectivo'
    ? `Efectivo (paga con ₡${montoEfectivo.value}, vuelto ₡${Number(montoEfectivo.value) - totalConEnvio.value})`
    : 'SINPE Móvil'

  const puntosCadena = totalCoinsAGastar.value > 0
    ? `\n🪙 ManiaCoins canjeados: ${totalCoinsAGastar.value}`
    : ''

  const comentariosCadena = comentarios.value.trim()
    ? `\n📝 Comentarios: ${comentarios.value.trim()}`
    : ''

  const base = `🍔 *Nuevo pedido en Foodmania*\n\n` +
    `👤 Cliente: ${datosCliente.value.nombre}\n` +
    `📞 Teléfono: ${datosCliente.value.telefono}\n\n` +
    `📋 *Pedido:*\n${items}\n` +
    `💰 Total: ₡${totalConEnvio.value}${puntosCadena}\n` +
    `${esDiaDobleHoy.value ? `🔥 ${nombreDiaDobleHoy.value} x2 — ` : ''}🪙 ManiaCoins ganados: ${coinsAGanarDisplay.value}\n` +
    `💳 Pago: ${pagoCadena}${comentariosCadena}\n\n`

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

  if (!ventaHabilitada.value)
    return errorMsg.value = 'Las compras se habilitan a partir del 3 de agosto.'
  if (cartStore.items.length === 0)
    return errorMsg.value = 'Tu carrito está vacío. Agregá productos antes de continuar.'
  if (carritoMixto.value)
    return errorMsg.value = 'No podés combinar merchandising con productos de comida en el mismo pedido — hacé pedidos separados.'
  if (!datosCliente.value.nombre) return errorMsg.value = 'Ingresá tu nombre.'
  if (!datosCliente.value.telefono) return errorMsg.value = 'Ingresá tu teléfono.'

  if (withDrawType.value === 'sucursal') {
    if (!sucursalSeleccionada.value) return errorMsg.value = hayMerchandising.value
      ? 'Compartí tu ubicación para encontrar la sucursal más cercana.'
      : 'Seleccioná una sucursal.'
    if (!hayMerchandising.value) {
      if (!fechaRetiro.value) return errorMsg.value = 'Seleccioná una fecha de retiro.'
      if (!horaRetiro.value) return errorMsg.value = 'Seleccioná una hora de retiro.'
      const [hh] = horaRetiro.value.split(':').map(Number)
      if (hh < 11 || hh >= 23)
        return errorMsg.value = 'La hora de retiro debe ser entre 11:00am y 11:00pm.'
    }
  } else {
    if (!datosCliente.value.direccion) return errorMsg.value = 'Ingresá la dirección de entrega.'
    if (!ubicacionObtenida.value) return errorMsg.value = 'Debés compartir tu ubicación para el envío a domicilio. 📍'
  }

  if (metodoPago.value === 'efectivo') {
    if (!montoEfectivo.value) return errorMsg.value = 'Ingresá el monto con el que pagarás.'
    if (Number(montoEfectivo.value) < totalConEnvio.value)
      return errorMsg.value = 'El monto es menor al total del pedido.'
  }

  if (totalCoinsAGastar.value > 0) {
    if (puntosActuales.value === null)
      return errorMsg.value = 'Iniciá sesión para canjear ManiaCoins.'
    const coinsDisponibles = coinsValidosComp.value
    if (coinsDisponibles < totalCoinsAGastar.value)
      return errorMsg.value = `No tenés suficientes ManiaCoins. Tenés ${coinsDisponibles} 🪙 disponibles, necesitás ${totalCoinsAGastar.value} 🪙.`
  }

  const hayItemsCash = cartStore.items.some(item => {
    if (item.esCanje) return false
    if (item.bebida && bebidaPuntosMap[item._uid]) return false
    if (agrandarMap[item._uid] && agrandarPuntosMap[item._uid]) return false
    return true
  })
  const carritoEsSoloCanje = cartStore.items.every(item => item.esCanje)
  if (totalCoinsAGastar.value > 0 && !hayItemsCash && !carritoEsSoloCanje) {
    return errorMsg.value = 'Para canjear ManiaCoins, tenés que comprar también (no canje solo).'
  }

  try {
    loading.value = true

    const itemsConExtras = cartStore.items.map(item => ({
      id: item.id,
      _uid: item._uid,
      nombre: item.nombre,
      precio: item.precio,
      cantidad: item.cantidad,
      _coleccionOrigen: item._coleccionOrigen || null,
      esCanje: item.esCanje || false,
      esBebida: item.esBebida || false,
      puntosCanje: item.esCanje ? (item.puntosCanje || 0) : 0,
      canjeadoConManiaCoins: !!item.esCanje,
      bebida: item.bebida ? {
        id: item.bebida.id,
        nombre: item.bebida.nombre,
        precio: item.bebida.precio,
        canjeadoConPuntos: !!bebidaPuntosMap[item._uid]
      } : null,
      bebidaEspecifica: item.bebidaEspecifica ? { nombre: item.bebidaEspecifica.nombre } : null,
      papasConSalsa: item.papasConSalsa || false,
      salsasAlitas: item.salsasAlitas || [],
      proteinaSel: item.proteinaSel || null,
      gaseosaSel: item.gaseosaSel || null,
      salsaSel: item.salsaSel || null,
      papasFritasGratisSel: item.papasFritasGratisSel || false,
      tallaSel: item.tallaSel || null,
      agrandarPapas: !!agrandarMap[item._uid],
      agrandarConPuntos: !!agrandarPuntosMap[item._uid],
    }))

    const pedido = {
      nombre: datosCliente.value.nombre,
      telefono: datosCliente.value.telefono,
      comentarios: comentarios.value.trim() || null,
      items: itemsConExtras,
      puntosCanjeados: totalCoinsAGastar.value,
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
      agrandarMap: { ...agrandarMap },
      agrandarPuntosMap: { ...agrandarPuntosMap },
      bebidaPuntosMap: { ...bebidaPuntosMap },
      estado: 'pendiente'
    }

    const validated = await calculateOrderTotals({
      items: itemsConExtras,
      distanciaKm: parseFloat(locationStore.distancia) || 0,
      withDrawType: withDrawType.value,
      agrandarMap: { ...agrandarMap },
      agrandarPuntosMap: { ...agrandarPuntosMap },
      bebidaPuntosMap: { ...bebidaPuntosMap },
    })

    const serverTotal = validated.data.totalConEnvio
    const localTotal = totalConEnvio.value
    if (Math.abs(serverTotal - localTotal) > 1) {
      console.warn('Discrepancia en total: servidor', serverTotal, 'cliente', localTotal)
    }

    const result = await createOrder({ pedido })

    const mensaje = armarMensajeWhatsApp()
    const numeroLimpio = nCelular.value.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/506${numeroLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank')

    cartStore.items = []
    successMsg.value = `¡Pedido confirmado! 🎉`
    puntosActuales.value = coinsValidosComp.value - totalCoinsAGastar.value + coinsAGanarFinal.value

  } catch (error) {
    console.error(error)
    errorMsg.value = error.code === 'functions/invalid-argument'
      ? error.message
      : 'Hubo un error al enviar el pedido. Intentá de nuevo.'
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    errorMsg.value = ''
    successMsg.value = ''
    comentarios.value = ''
    Object.keys(agrandarMap).forEach(k => delete agrandarMap[k])
    Object.keys(agrandarPuntosMap).forEach(k => delete agrandarPuntosMap[k])
    Object.keys(bebidaPuntosMap).forEach(k => delete bebidaPuntosMap[k])
    cargarDatosUsuario()
  }
})
</script>
