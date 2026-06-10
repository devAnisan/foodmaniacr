<template>
    <!-- Modal de inicio de sesión -->
    <div v-if="menuLogIn" class="fixed inset-0 z-60 bg-black/50 h-full w-full flex items-center justify-center">
        <div class="p-4 rounded-2xl shadow-2xl z-80 w-80 bg-white fontColor">
            <section class="flex justify-between border-b text-center pb-3">
                <span class="text-2xl font-bold">{{ showCompleteProfile ? 'Completá tu perfil' : showVerifyCode ? 'Verificá tu correo' : 'Iniciar Sesión' }}</span>
                <button @click="menuLogIn = false; forgotPassword = false; justLogin = true; resetState()"
                    class="text-red-500 hover:text-red-700 p-2 rounded hover:cursor-pointer">
                    <span class="pi pi-times"></span>
                </button>
            </section>

            <!-- Código de verificación -->
            <section v-if="showVerifyCode" class="flex flex-col p-4 text-center gap-3">
                <p class="text-sm text-green-600 font-bold">{{ successMsg }}</p>
                <p class="text-sm text-gray-500">Ingresá el código de 6 dígitos que te enviamos</p>
                <input v-model="codigoInput" type="text" maxlength="6" placeholder="000000"
                    class="p-2 border w-full rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                <p v-if="errorMsg" class="text-red-500 text-sm">{{ errorMsg }}</p>
                <button @click="verificarCodigo"
                    class="bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
                    Verificar código
                </button>
                <button @click="register(email, password1, password2)"
                    class="text-sm text-[var(--primary)] hover:cursor-pointer">
                    Reenviar código
                </button>
            </section>

            <!-- Completar perfil -->
            <section v-else-if="showCompleteProfile" class="flex flex-col p-4 text-center gap-3">
                <p class="text-sm text-green-600 font-bold">{{ successMsg }}</p>
                <p class="text-sm text-gray-500">Contanos de vos para terminar</p>
                <input v-model="datosNuevos.nombre" type="text" placeholder="Nombre completo"
                    class="p-2 border w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                <input v-model="datosNuevos.telefono" type="tel" placeholder="Teléfono"
                    class="p-2 border w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                <input v-model="datosNuevos.direccion" type="text" placeholder="Dirección"
                    class="p-2 border w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                <label class="text-sm text-gray-500 text-left block -mb-2">🎂 Fecha de cumpleaños</label>
                <input v-model="datosNuevos.cumpleanos" type="date"
                    class="p-2 border w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                <button @click="obtenerUbicacionPerfil"
                    class="w-full py-2 border-2 border-dashed border-[var(--primary)] rounded-lg text-[var(--primary)] font-bold hover:bg-purple-50 transition-colors hover:cursor-pointer text-sm">
                    📍 Usar mi ubicación actual
                </button>
                <p v-if="errorMsg" class="text-red-500 text-sm">{{ errorMsg }}</p>
                <button @click="completarPerfil"
                    class="bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
                    Finalizar
                </button>
            </section>

            <!-- Login / Register -->
            <section v-else class="flex flex-col p-4 text-center gap-3">
                <img :src="imageUrl" to="/" alt="logo_foodmania" class="w-20 mx-auto mb-2" />
                <input v-model="email" type="email" placeholder="Correo electrónico"
                    class="p-2 border w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                <section v-if="justLogin && !forgotPassword">
                    <input v-model="password1" type="password" placeholder="Contraseña"
                        class="p-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                </section>
                <section class="flex flex-col gap-2" v-else-if="!justLogin && !forgotPassword">
                    <input v-model="password1" type="password" placeholder="Crear contraseña"
                        class="p-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                    <input v-model="password2" type="password" placeholder="Confirmar contraseña"
                        class="p-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                    <p class="text-xs text-red-500">Mínimo 8 caracteres, mayúscula, minúscula y número.</p>
                </section>
                <p v-if="successMsg" class="text-green-500 text-sm">{{ successMsg }}</p>
                <p v-if="errorMsg" class="text-red-500 text-sm">{{ errorMsg }}</p>
                <button v-if="justLogin && !forgotPassword" @click="login(email, password1)"
                    class="bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
                    Iniciar sesión
                </button>
                <button v-else-if="!justLogin && !forgotPassword" @click="register(email, password1, password2)"
                    class="bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
                    Crear cuenta
                </button>
                <button v-if="forgotPassword" @click="resetPassword(email)"
                    class="bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
                    Enviar correo de recuperación
                </button>
            </section>
            <section v-if="justLogin && !showVerifyCode && !showCompleteProfile" class="text-center text-sm border-t pt-3">
                <p class="text-gray-600">¿No tenés cuenta? <a href="#"
                        @click="justLogin = false; forgotPassword = false"
                        class="text-[var(--primary)] font-bold">Regístrate</a></p>
                <button class="text-[var(--primary)] text-sm mt-2 hover:cursor-pointer"
                    @click="forgotPassword = true">¿Olvidaste tu contraseña?</button>
            </section>
            <section v-if="!justLogin && !showVerifyCode && !showCompleteProfile" class="text-center text-sm border-t pt-3">
                <p class="text-gray-600">¿Ya tenés cuenta? <a href="#" @click="justLogin = true"
                        class="text-[var(--primary)] font-bold">Iniciá sesión</a></p>
            </section>
        </div>
    </div>

    <!-- Modal usuario -->
    <section v-if="showUserModal && user"
        class="fixed top-20 right-4 z-90 bg-white p-4 rounded-2xl shadow-xl fontColor w-64 text-center">
        <section class="flex justify-between border-b p-2 mb-3">
            <span class="font-bold">Hola, {{ user.email.split('@')[0] }} 👋</span>
            <span class="pi pi-times text-red-500 hover:cursor-pointer" @click="showUserModal = false"></span>
        </section>
        <section class="flex flex-col items-center gap-3">
            <span class="text-sm text-gray-500">{{ user.email }}</span>
            <span> </span>
            <span class="text-sm font-bold">{{ user.emailVerified ? '✅ Email verificado' : '⚠️ Email no verificado'
                }}</span>
            <div v-if="puntosUsuario !== null" class="bg-gradient-to-r from-purple-50 to-yellow-50 border border-purple-200 rounded-lg px-4 py-2 w-full">
              <div class="flex items-center justify-center gap-2">
                <span class="text-lg">🪙</span>
                <span class="font-bold text-yellow-700">{{ coinsValidos }} ManiaCoins</span>
              </div>
              <p v-if="tiempoRestante" class="text-[10px] text-gray-400 text-center mt-0.5">
                ⏳ Expiran en {{ tiempoRestante }}
              </p>
              <p v-if="nivelUsuario" class="text-[10px] text-purple-600 font-bold text-center mt-0.5">
                👑 {{ nivelUsuario.nombre }} — {{ nivelUsuario.beneficios }}
              </p>
              <p v-else-if="puntosUsuario >= 500" class="text-[10px] text-red-400 text-center mt-0.5">
                ⚠️ Coins vencidos o sin compras recientes
              </p>
              <p v-else class="text-[10px] text-gray-400 text-center mt-0.5">
                Faltan {{ 500 - puntosUsuario }} 🪙 para Rookie
              </p>
            </div>
            <div v-if="cumpleanosFormateado" class="bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 rounded-lg px-4 py-2 w-full">
              <div class="flex items-center justify-center gap-2">
                <span class="text-lg">🎂</span>
                <span class="font-bold text-pink-600">{{ cumpleanosFormateado }}</span>
              </div>
              <p v-if="esCumpleanosHoy" class="text-[10px] text-red-500 font-bold text-center mt-0.5">
                🎉 ¡Feliz cumpleaños! Hoy tenés ManiaCoins extra
              </p>
            </div>
            <button @click="editProfileModal = true"
                class="w-full bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
                Editar perfil
            </button>
            <button @click="cerrarSesion"
                class="w-full bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
                Cerrar sesión
            </button>
        </section>
    </section>
    <EditProfileModal v-model="editProfileModal" />

    <!-- ✦ Personalizador de producto ✦ -->
    <div v-if="personalizadorAbierto" class="fixed inset-0 bg-black/50 z-70 flex items-center justify-center p-4"
      @click="cerrarPersonalizador">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md fontColor max-h-[90vh] overflow-y-auto"
        @click.stop>
        <div class="flex justify-between items-center p-5 border-b">
          <span class="text-xl font-bold">{{ itemPersonalizando?.nombre }}</span>
          <button @click="cerrarPersonalizador"
            class="pi pi-times text-red-500 hover:text-red-700 hover:cursor-pointer p-2 rounded"></button>
        </div>
        <div class="p-5">
          <p class="text-lg font-bold text-[var(--primary)]">₡{{ itemPersonalizando?.precio }}</p>

          <!-- Bebida (opcional, se oculta si el producto ya es una bebida) -->
          <div v-if="!esItemBebida" class="mt-4">
            <label class="font-bold block mb-2">🥤 Agregar bebida (opcional)</label>
            <div v-if="bebidasCargando" class="flex items-center gap-2 text-sm text-gray-400">
              <span class="pi pi-spinner animate-spin"></span> Cargando bebidas...
            </div>
            <div v-else-if="bebidas.length === 0" class="text-sm text-gray-400">No hay bebidas disponibles.</div>
            <div v-else class="grid grid-cols-2 gap-2">
              <button v-for="b in bebidas" :key="b.id"
                @click="bebidaSel = b"
                :class="bebidaSel?.id === b.id ? 'bg-[var(--primary)] text-white ring-2 ring-[var(--primary)]' : 'bg-gray-100 hover:bg-gray-200'"
                class="p-3 rounded-xl font-bold text-sm transition-all duration-200 hover:cursor-pointer">
                {{ b.nombre }}
                <span class="block text-xs font-normal mt-0.5">₡{{ b.precio }}</span>
              </button>
            </div>
          </div>

          <!-- Papas con salsa (pollofrito con papas == true) -->
          <div v-if="itemPersonalizando?.papas === true" class="mt-5">
            <label class="font-bold block mb-2">🍟 ¿Papas con salsa?</label>
            <div class="flex gap-2">
              <button @click="papasConSalsaSel = true"
                :class="papasConSalsaSel ? 'bg-[var(--primary)] text-white ring-2 ring-[var(--primary)]' : 'bg-gray-100 hover:bg-gray-200'"
                class="flex-1 py-2 rounded-lg font-bold transition-all hover:cursor-pointer">Sí</button>
              <button @click="papasConSalsaSel = false"
                :class="!papasConSalsaSel ? 'bg-[var(--primary)] text-white ring-2 ring-[var(--primary)]' : 'bg-gray-100 hover:bg-gray-200'"
                class="flex-1 py-2 rounded-lg font-bold transition-all hover:cursor-pointer">No</button>
            </div>
          </div>

          <!-- Alitas Mania: salsas (1-2) -->
          <div v-if="esAlitasMania" class="mt-5">
            <label class="font-bold block mb-2">🌶️ Elegí tus salsas ({{ salsasAlitasSel.length }}/2)</label>
            <div v-if="salsasCargando" class="flex items-center gap-2 text-sm text-gray-400">
              <span class="pi pi-spinner animate-spin"></span> Cargando salsas...
            </div>
            <div v-else class="flex flex-wrap gap-2">
              <button v-for="s in salsas" :key="s.id"
                @click="toggleSalsa(s)"
                :class="salsasAlitasSel.includes(s.nombre) ? 'bg-[var(--primary)] text-white ring-2 ring-[var(--primary)]' : 'bg-gray-100 hover:bg-gray-200'"
                class="px-4 py-2 rounded-xl font-bold text-sm transition-all hover:cursor-pointer">
                {{ s.nombre }}
              </button>
            </div>
          </div>

          <div class="mt-6 flex gap-3">
            <button @click="cerrarPersonalizador"
              class="flex-1 py-3 rounded-xl font-bold border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors hover:cursor-pointer">
              Cancelar
            </button>
            <button @click="confirmarPersonalizacion"
              class="flex-1 bg-[var(--primary)] text-white py-3 rounded-xl font-bold hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
              Agregar 🎉
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white fontColor shadow-sm">
        <!-- Mobile dropdown -->
        <section v-if="menuOpen">
            <ul class="flex flex-col p-2 absolute top-20 right-4 bg-white rounded-xl shadow-lg w-44 space-y-1 border">
                <li v-if="user && puntosUsuario !== null" class="p-2 text-sm font-bold text-yellow-700 border-b flex items-center gap-1">
                    <span>🪙</span>
                    <span>{{ coinsValidos }} ManiaCoins</span>
                    <span v-if="nivelUsuario" class="text-[10px] text-purple-500 ml-auto">👑 {{ nivelUsuario.nombre }}</span>
                </li>
                <li class="p-2">
                    <button @click="openLogin" class="w-full text-left font-bold">
                        {{ user ? user.email.split('@')[0] : "Inicia sesión" }}
                    </button>
                </li>
                <li class="p-2 border-t">
                    <button @click="openMenu()" class="w-full text-left">🛒 Ver carrito</button>
                </li>
            </ul>
        </section>

        <!-- Carrito -->
        <section v-if="menuItems"
            class="border rounded-2xl absolute right-4 top-20 z-50 bg-white shadow-xl w-80 max-h-[80vh] overflow-y-auto">
            <div class="flex p-4 fontColor justify-between items-center border-b">
                <span class="text-xl font-bold">Carrito 🛒</span>
                <span class="pi pi-times hover:cursor-pointer text-red-500 p-2" @click="menuItems = false"></span>
            </div>
            <div>
                <span v-if="cartStore.items.length === 0" class="text-center text-gray-400 block p-6">
                    Aún no agregaste nada 😋
                </span>
                <div v-for="value in cartStore.items" :key="value._uid"
                    class="flex fontColor justify-between items-center border-b p-3">
                    <div class="flex-1 text-sm">
                        <div class="font-bold">{{ value.nombre }} <span class="text-gray-400">x{{
                            value.cantidad }}</span></div>
                        <div v-if="value.bebida" class="text-xs text-gray-500 mt-0.5">
                            🥤 {{ value.bebida.nombre }} +₡{{ value.bebida.precio }}
                        </div>
                        <div v-if="value.papasConSalsa" class="text-xs text-gray-500">🍟 Papas con salsa</div>
                        <div v-if="value.salsasAlitas?.length" class="text-xs text-gray-500">
                            🌶️ {{ value.salsasAlitas.join(', ') }}
                        </div>
                    </div>
                    <div class="text-sm mr-2">₡{{ cartStore.precioFinal(value) * value.cantidad }}</div>
                    <div class="flex items-center gap-1">
                        <button @click="cartStore.removeItem(value._uid)" class="text-gray-400 hover:text-red-500 p-1">
                            <span class="pi pi-minus text-xs"></span>
                        </button>
                        <button @click="cartStore.addItem(value)" class="text-gray-400 hover:text-green-500 p-1">
                            <span class="pi pi-plus text-xs"></span>
                        </button>
                        <button @click="cartStore.deleteItem(value._uid)" class="text-red-400 hover:text-red-600 p-1">
                            <span class="pi pi-trash text-xs"></span>
                        </button>
                    </div>
                </div>
                <div class="flex justify-between p-4 font-bold border-t text-lg">
                    <span>Total</span>
                    <span>₡{{ cartStore.total }}</span>
                </div>
                <div class="p-3">
                    <button @click="showCheckout = true; menuItems = false"
                        class="w-full bg-[var(--primary)] text-white p-3 rounded-xl font-bold hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
                        Finalizar compra 🎉
                    </button>
                </div>
            </div>
        </section>

        <!-- Nav mobile -->
        <nav class="flex md:hidden items-center justify-between p-4">
            <img class="w-14 object-contain" :src="imageUrl" alt="Foodmania Logo" />
            <span class="material-symbols-outlined hover:cursor-pointer" @click="menuOpen = !menuOpen">menu</span>
        </nav>

        <!-- Nav desktop -->
        <nav class="hidden md:flex items-center justify-between px-8 py-3">
            <RouterLink to="/">
                <img class="w-20 object-contain" :src="imageUrl" alt="Foodmania Logo" />
            </RouterLink>
            
            <section class="flex items-center space-x-4">
                <div v-if="user && puntosUsuario !== null"
                    class="flex items-center gap-1 text-sm font-bold text-yellow-700 bg-gradient-to-r from-purple-50 to-yellow-50 border border-purple-200 px-3 py-1.5 rounded-full">
                    <span>🪙</span>
                    <span>{{ coinsValidos }}</span>
                    <span v-if="nivelUsuario" class="text-[10px] text-purple-500 ml-0.5">👑 {{ nivelUsuario.nombre }}</span>
                    <span v-else-if="puntosUsuario > 0" class="text-[10px] text-red-400 ml-0.5">Rookie caído</span>
                </div>
                <button @click="openLogin"
                    class="border px-4 py-2 rounded-full hover:cursor-pointer font-bold hover:bg-gray-50 transition-colors">
                    {{ user ? user.email.split('@')[0] : "Inicia sesión" }}
                </button>
                <button @click="menuItems = !menuItems"
                    class="border px-4 py-2 rounded-full hover:cursor-pointer font-bold hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <span class="pi pi-shopping-cart"></span>
                    <span v-if="cartStore.totalItems > 0"
                        class="bg-[var(--primary)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {{ cartStore.totalItems }}
                    </span>
                </button>
            </section>
        </nav>
    </header>

    <!-- Checkout Modal -->
    <CheckoutModal v-model="showCheckout" />

    <!-- Toast notificación -->
    <div v-if="drinkMsg"
      class="fixed top-24 left-1/2 -translate-x-1/2 z-100 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg font-bold text-center transition-all duration-300">
      {{ drinkMsg }}
    </div>

    <!-- Main -->
    <main class="pt-24 fontColor min-h-screen bg-gray-50">

        <!-- Loader general -->
        <div v-if="loader" class="flex flex-col items-center justify-center min-h-screen gap-4">
            <!-- Skeleton navbar tabs -->
            <div class="flex gap-3 mb-4">
                <div v-for="i in 4" :key="i" class="h-9 w-24 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <!-- Skeleton cards -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 w-full px-4 max-w-6xl">
                <div v-for="i in 10" :key="i" class="bg-white rounded-xl shadow p-4">
                    <div class="w-full h-32 bg-gray-200 rounded-lg animate-pulse mb-3"></div>
                    <div class="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div class="h-3 bg-gray-200 rounded animate-pulse w-2/3 mb-3"></div>
                    <div class="h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
            </div>
        </div>

        <div v-else>
            <!-- Barra de búsqueda -->
            <div class="sticky top-18 z-40 bg-gray-50 px-4 py-3 shadow-sm">
                <div class="max-w-6xl mx-auto flex flex-col md:flex-row gap-3 items-center">
                    <!-- Search -->
                    <div class="relative w-full md:w-80">
                        <span class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></span>
                        <input v-model="busqueda" type="text" placeholder="Buscar producto..."
                            class="w-full pl-9 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-white" />
                        <button v-if="busqueda" @click="busqueda = ''"
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <span class="pi pi-times text-sm"></span>
                        </button>
                    </div>

                    <!-- Pestañas de categorías -->
                    <div class="flex gap-2 overflow-x-auto pb-1 w-full scrollbar-hide">
                        <button @click="categoriaActiva = null; busqueda = ''"
                            :class="categoriaActiva === null && !busqueda ? 'bg-[var(--primary)] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'"
                            class="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border transition-all duration-200 flex-shrink-0">
                            🍽️ Todo
                        </button>
                        <button v-for="cat in categorias" :key="cat.nombre" @click="seleccionarCategoria(cat)"
                            :class="categoriaActiva?.nombre === cat.nombre
                              ? (cat.esCanje ? 'bg-yellow-500 text-white' : 'bg-[var(--primary)] text-white')
                              : (cat.esCanje ? 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100' : 'bg-white text-gray-600 hover:bg-gray-100')"
                            class="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border transition-all duration-200 flex-shrink-0 flex items-center gap-1">
                            <span v-if="cat.cargando" class="pi pi-spinner animate-spin text-xs"></span>
                            {{ cat.emoji }} {{ cat.nombre }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Resultados de búsqueda -->
            <div v-if="busqueda" class="max-w-6xl mx-auto px-4 py-6">
                <h2 class="text-xl font-bold mb-4">
                    Resultados para "<span class="text-[var(--primary)]">{{ busqueda }}</span>"
                    <span class="text-gray-400 text-base font-normal">({{ resultadosBusqueda.length }})</span>
                </h2>
                <div v-if="resultadosBusqueda.length === 0" class="text-center py-16 text-gray-400">
                    <p class="text-4xl mb-3">🔍</p>
                    <p class="text-lg">No encontramos "{{ busqueda }}"</p>
                    <button @click="busqueda = ''" class="mt-4 text-[var(--primary)] font-bold hover:underline">Limpiar
                        búsqueda</button>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <ProductCard v-for="{ item, esPromocion } in resultadosBusqueda" :key="item.id" :item="item"
                        :esPromocion="esPromocion" :esCanje="false" @personalizar="abrirPersonalizador(item)" />
                </div>
            </div>

            <!-- Categorías -->
            <div v-else class="max-w-6xl mx-auto px-4 py-6">

                <!-- Una sola categoría activa -->
                <div v-if="categoriaActiva">
                    <h2 class="text-3xl font-bold mb-6 text-center">
                        {{ categoriaActiva.emoji }} {{ categoriaActiva.nombre }}
                    </h2>

                    <!-- Skeleton de categoría cargando -->
                    <div v-if="categoriaActiva.cargando" class="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div v-for="i in 5" :key="i" class="bg-white rounded-xl shadow p-4">
                            <div class="w-full h-32 bg-gray-200 rounded-lg animate-pulse mb-3"></div>
                            <div class="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                            <div class="h-3 bg-gray-200 rounded animate-pulse w-2/3 mb-3"></div>
                            <div class="h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                    </div>

                    <div v-else class="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <ProductCard v-for="item in categoriaActiva.productos.filter(p => categoriaActiva.esCanje || p.precio)" :key="item.id" :item="item"
                            :esPromocion="categoriaActiva.coleccion === 'promociones'"
                            :esCanje="categoriaActiva.esCanje"
                            @personalizar="abrirPersonalizador(item, categoriaActiva.esCanje)" />
                    </div>
                </div>

                <!-- Todas las categorías -->
                <div v-else>
                    <div v-for="cat in categorias" :key="cat.nombre" v-show="!cat.esCanje || cat.productos.length > 0" class="mb-10">
                        <div class="flex items-center justify-between mb-4">
                            <div class="hidden md:block">
                                <h2 id="title" class="text-2xl font-bold">{{ cat.emoji }} {{ cat.nombre }}</h2>
                            </div>
                            <div class="block md:hidden">
                                <h2 id="title" class="text-1xl font-bold">{{ cat.emoji }} {{ cat.nombre }}</h2>
                            </div>
                            <button @click="seleccionarCategoria(cat)"
                                class="text-[var(--primary)] text-sm font-bold hover:underline hover:cursor-pointer">
                                Ver todos →
                            </button>
                        </div>

                        <!-- Skeleton -->
                        <div v-if="cat.cargando" class="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div v-for="i in 5" :key="i" class="bg-white rounded-xl shadow p-4">
                                <div class="w-full h-32 bg-gray-200 rounded-lg animate-pulse mb-3"></div>
                                <div class="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                                <div class="h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                            </div>
                        </div>

                        <!-- Productos (solo los primeros 5 en vista general) -->
                        <div v-else class="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <ProductCard v-for="item in cat.productos.filter(p => cat.esCanje || p.precio).slice(0, 5)" :key="item.id" :item="item"
                                :esPromocion="cat.coleccion === 'promociones'" :esCanje="cat.esCanje"
                                @personalizar="abrirPersonalizador(item, cat.esCanje)" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <Footer />
</template>

<script setup>
import { ref as vueRef, computed, onMounted, watch, defineComponent, h } from 'vue'
import { ref as storageRef, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase.js'
import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { db, auth } from '../firebase.js'
import { useCartStore, useLocationStore, useSucursales } from '../stores/cartStores.js'
import { useAuth } from '../composable/useAuth.js'
import Footer from './Footer.vue'
import CheckoutModal from './Checkoutmodal.vue'
import { esPromocionActiva, diaPromocion } from '../composable/promociones.js'
import { obtenerNivelReal, obtenerCoinsValidos, obtenerSiguienteNivel, obtenerTiempoRestanteExpiracion, esCumpleanos, formatearCumpleanos } from '../utils/maniacoins.js'
import EditProfileModal from './EditProfileModal.vue'
// ── Componente inline ProductCard ──────────────────────────────────────────
const ProductCard = defineComponent({
    props: { item: Object, esPromocion: Boolean, esCanje: Boolean },
    emits: ['personalizar'],
    setup(props, { emit }) {

        const activo = computed(() =>
            props.esPromocion ? esPromocionActiva(props.item.nombre) : true
        )

        return () => h('div', { class: 'bg-white rounded-xl shadow-md p-3 flex flex-col hover:shadow-lg transition-shadow duration-200' + (props.esCanje ? ' border-2 border-yellow-400' : '') }, [
            props.item.imageUrl
                ? h('img', { src: props.item.imageUrl, alt: props.item.nombre, loading: 'lazy', class: 'w-full h-32 object-cover rounded-lg mb-3' })
                : h('div', { class: 'w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-3xl' }, '🍽️'),
            h('h3', { class: 'font-bold text-sm mb-1 flex-1 line-clamp-2' }, props.item.nombre),
            props.item.descripcion ? h('p', { class: 'text-gray-400 text-xs mb-2 line-clamp-1' }, props.item.descripcion) : null,
            props.esCanje
                ? h('p', { class: 'font-bold text-yellow-600 mb-3' }, `🪙 ${props.item.puntosCanje}`)
                : h('p', { class: 'font-bold text-[var(--primary)] mb-3' }, `₡${props.item.precio}`),
            h('button', {
                disabled: !activo.value,
                class: activo.value
                    ? (props.esCanje
                        ? 'w-full bg-yellow-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-yellow-600 transition-colors hover:cursor-pointer'
                        : 'w-full bg-[var(--primary)] text-white py-2 rounded-lg text-sm font-bold hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer')
                    : 'w-full bg-gray-200 text-gray-400 py-2 rounded-lg text-sm font-bold cursor-not-allowed',
                onClick: () => activo.value && emit('personalizar')
            }, activo.value ? (props.esCanje ? '+ Canjear 🎉' : '+ Agregar 🎉') : diaPromocion(props.item.nombre))
        ])
    }
})
// ── Stores ─────────────────────────────────────────────────────────────────
const cartStore = useCartStore()
const locationStore = useLocationStore()
const sucursalesStore = useSucursales()

// ── Estado ─────────────────────────────────────────────────────────────────
const loader = vueRef(true)
const imageUrl = vueRef('')
const menuOpen = vueRef(false)
const menuItems = vueRef(false)
const showCheckout = vueRef(false)
const editProfileModal = vueRef(false)
const busqueda = vueRef('')
const categoriaActiva = vueRef(null)
const drinkMsg = vueRef('')

const {
    user, showUserModal, menuLogIn, justLogin, forgotPassword,
    email, password1, password2, successMsg, errorMsg,
    showVerifyCode, showCompleteProfile, codigoInput, datosNuevos,
    openLogin, cerrarSesion, resetPassword, register, login,
    verificarCodigo, completarPerfil, obtenerUbicacionPerfil, resetState,
    initAuthListener
} = useAuth()

// ── Personalizador de producto ──────────────────────────────────────────
const personalizadorAbierto = vueRef(false)
const itemPersonalizando = vueRef(null)
const bebidaSel = vueRef(null)
const papasConSalsaSel = vueRef(false)
const salsasAlitasSel = vueRef([])

const bebidas = vueRef([])
const bebidasCargando = vueRef(false)
const salsas = vueRef([])
const salsasCargando = vueRef(false)

const esAlitasMania = computed(() =>
  itemPersonalizando.value?.nombre?.toLowerCase().includes('alitas mania')
)

const esItemBebida = computed(() =>
  categorias.value.find(c => c.coleccion === 'bebidas')
    ?.productos.some(p => p.id === itemPersonalizando.value?.id)
)

const cargarBebidas = async () => {
  bebidasCargando.value = true
  try {
    const snap = await getDocs(collection(db, 'bebidas'))
    bebidas.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('Error cargando bebidas:', e)
  } finally {
    bebidasCargando.value = false
  }
}

const cargarSalsas = async () => {
  salsasCargando.value = true
  try {
    const snap = await getDocs(collection(db, 'salsas'))
    salsas.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('Error cargando salsas:', e)
  } finally {
    salsasCargando.value = false
  }
}

const abrirPersonalizador = (item, esCanje = false) => {
  if (esCanje) {
    cartStore.addItem(item, { esCanje: true })
    return
  }
  const esBebida = categorias.value
    .find(c => c.coleccion === 'bebidas')
    ?.productos.some(p => p.id === item.id)
  if (esBebida) {
    cartStore.addItem(item, { esBebida: true })
    drinkMsg.value = '🥤 Refresco añadido'
    setTimeout(() => drinkMsg.value = '', 2000)
    return
  }
  itemPersonalizando.value = item
  bebidaSel.value = null
  papasConSalsaSel.value = false
  salsasAlitasSel.value = []
  personalizadorAbierto.value = true
}

const cerrarPersonalizador = () => {
  personalizadorAbierto.value = false
  itemPersonalizando.value = null
}

const toggleSalsa = (salsa) => {
  const idx = salsasAlitasSel.value.indexOf(salsa.nombre)
  if (idx >= 0) {
    salsasAlitasSel.value.splice(idx, 1)
  } else if (salsasAlitasSel.value.length < 2) {
    salsasAlitasSel.value.push(salsa.nombre)
  }
}

const confirmarPersonalizacion = () => {
  const extras = {
    papasConSalsa: papasConSalsaSel.value,
    salsasAlitas: [...salsasAlitasSel.value],
  }
  if (bebidaSel.value) {
    extras.bebida = {
      id: bebidaSel.value.id,
      nombre: bebidaSel.value.nombre,
      precio: bebidaSel.value.precio,
    }
  }
  cartStore.addItem(itemPersonalizando.value, extras)
  cerrarPersonalizador()
}



const puntosUsuario = vueRef(null)
const ultimaCompra = vueRef(null)
const ultimaGananciaCoins = vueRef(null)
const cumpleanosUsuario = vueRef('')
const esCumpleanosHoy = computed(() => esCumpleanos(cumpleanosUsuario.value))
const cumpleanosFormateado = computed(() => formatearCumpleanos(cumpleanosUsuario.value))

const cargarPuntosUsuario = async (uid) => {
  if (!uid) { puntosUsuario.value = null; return }
  try {
    const docSnap = await getDoc(doc(db, 'clientes', uid))
    if (docSnap.exists()) {
      const data = docSnap.data()
      puntosUsuario.value = data.puntos || 0
      ultimaCompra.value = data.ultimaCompra || null
      ultimaGananciaCoins.value = data.ultimaGananciaCoins || null
      cumpleanosUsuario.value = data.cumpleanos || ''
      console.log('🐛 Debug puntos:', { puntos: puntosUsuario.value, ultimaCompra: data.ultimaCompra?.toMillis?.(), ultimaGananciaCoins: data.ultimaGananciaCoins?.toMillis?.() })
    }
  } catch (e) {
    console.error('Error cargando puntos:', e)
  }
}

watch(showUserModal, (val) => {
  if (val && user?.value?.uid) cargarPuntosUsuario(user.value.uid)
})
watch(showCheckout, (val) => {
  if (!val && user?.value?.uid) cargarPuntosUsuario(user.value.uid)
})

const coinsValidos = computed(() => obtenerCoinsValidos(puntosUsuario.value, ultimaGananciaCoins.value))
const nivelUsuario = computed(() => obtenerNivelReal(puntosUsuario.value, ultimaGananciaCoins.value, ultimaCompra.value))
const siguienteNivelUsuario = computed(() => obtenerSiguienteNivel(puntosUsuario.value, ultimaGananciaCoins.value))
const tiempoRestante = computed(() => obtenerTiempoRestanteExpiracion(ultimaGananciaCoins.value))

initAuthListener((currentUser) => {
  if (currentUser) cargarPuntosUsuario(currentUser.uid)
})

// ── Categorías con emoji y lazy loading ────────────────────────────────────
const categorias = vueRef([
    { nombre: 'Comida China', coleccion: 'comidachina', emoji: '🥡', productos: [], cargando: false, cargada: false },
    { nombre: 'Comida Rápida', coleccion: 'comidarapida', emoji: '🍟', productos: [], cargando: false, cargada: false },
    { nombre: 'Hamburguesas', coleccion: 'hamburguesas', emoji: '🍔', productos: [], cargando: false, cargada: false },
    { nombre: 'Pollo Frito', coleccion: 'pollofrito', emoji: '🍗', productos: [], cargando: false, cargada: false },
    { nombre: 'Promociones', coleccion: 'promociones', emoji: '🔥', productos: [], cargando: false, cargada: false },
    { nombre: 'Supremos', coleccion: 'supremos', emoji: '👑', productos: [], cargando: false, cargada: false },
    { nombre: 'Surtidos', coleccion: 'surtidos', emoji: '🎁', productos: [], cargando: false, cargada: false },
    { nombre: 'Bebidas', coleccion: 'bebidas', emoji: '🥤', productos: [], cargando: false, cargada: false },
    { nombre: 'Canjear', coleccion: null, esCanje: true, emoji: '🪙', productos: [], cargando: false, cargada: false },
])

// ── Cargar una categoría (lazy) ────────────────────────────────────────────
const cargarCategoria = async (cat) => {
    if (!cat.coleccion || cat.cargada || cat.cargando) return
    cat.cargando = true
    try {
        const snap = await getDocs(collection(db, cat.coleccion))
        for (const doc of snap.docs) {
            const data = doc.data()
            let itemImageUrl = null
            if (data.imagen) {
                const imgRef = storageRef(storage, data.imagen)
                itemImageUrl = await getDownloadURL(imgRef)
            }
            cat.productos.push({ id: doc.id, ...data, imageUrl: itemImageUrl })
        }
        cat.cargada = true
        actualizarCanje()
    } catch (error) {
        console.error(`Error cargando ${cat.nombre}:`, error)
    } finally {
        cat.cargando = false
    }
}

const actualizarCanje = () => {
    const canjeCat = categorias.value.find(c => c.esCanje)
    if (!canjeCat) return
    canjeCat.productos = categorias.value
        .filter(c => c.coleccion && c.cargada)
        .flatMap(c => c.productos)
        .filter(p => p.ValidoParaCambio === true && p.puntosCanje > 0)
    canjeCat.cargada = true
}

// ── Seleccionar categoría (carga lazy) ────────────────────────────────────
const seleccionarCategoria = async (cat) => {
    categoriaActiva.value = cat
    busqueda.value = ''
    if (cat.esCanje) {
        for (const c of categorias.value) {
            if (c.coleccion) await cargarCategoria(c)
        }
        return
    }
    await cargarCategoria(cat)
}

// ── Búsqueda en todos los productos cargados ──────────────────────────────
const resultadosBusqueda = computed(() => {
    if (!busqueda.value.trim()) return []
    const q = busqueda.value.toLowerCase()
    return categorias.value
        .filter(cat => !cat.esCanje)
        .flatMap(cat =>
            cat.productos
                .filter(p => p.precio && (p.nombre?.toLowerCase().includes(q) || p.descripcion?.toLowerCase().includes(q)))
                .map(p => ({ item: p, esPromocion: cat.coleccion === 'promociones' }))
        )
})

// ── onMounted: carga logo + primera categoría ─────────────────────────────
onMounted(async () => {
    const imgRef = storageRef(storage, 'FoodMania/logoFoodmania4.PNG')
    imageUrl.value = await getDownloadURL(imgRef)

    // Cargar sucursales para el store
    const docSnap = await getDocs(collection(db, 'Sucursales de Foodmania'))
    const sucursales = []
    docSnap.forEach(doc => sucursales.push({ ...doc.data() }))
    sucursalesStore.sucursalesFoodMania = sucursales

    // Carga la primera categoría inmediatamente
    await cargarCategoria(categorias.value[0])

    loader.value = false

    // Carga el resto en segundo plano sin bloquear la UI
    for (const cat of categorias.value.slice(1)) {
        cargarCategoria(cat)
    }

    // Cargar bebidas y salsas en segundo plano
    cargarBebidas()
    cargarSalsas()
})

// ── Auth helpers ───────────────────────────────────────────────────────────
const openMenu = () => { menuOpen.value = false; menuItems.value = true }
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
