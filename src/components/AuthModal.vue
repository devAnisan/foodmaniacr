<template>
    <div v-if="auth.menuLogIn.value" class="fixed inset-0 z-60 bg-black/50 h-full w-full flex items-center justify-center">
        <div class="rounded-3xl shadow-2xl z-80 w-80 bg-white fontColor overflow-hidden">
            <section class="flex justify-between items-center bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] px-5 py-4">
                <span class="text-lg font-bold text-white">{{ auth.showCompleteProfile.value ? 'Completá tu perfil' : auth.showVerifyCode.value ? 'Verificá tu correo' : 'Iniciar Sesión' }}</span>
                <button @click="auth.menuLogIn.value = false; auth.forgotPassword.value = false; auth.justLogin.value = true; auth.resetState()"
                    class="text-white/80 hover:text-white p-1 rounded hover:cursor-pointer">
                    <span class="pi pi-times"></span>
                </button>
            </section>

            <!-- Código de verificación -->
            <section v-if="auth.showVerifyCode.value" class="flex flex-col p-6 text-center gap-4">
                <p class="text-sm text-green-600 font-bold">{{ auth.successMsg.value }}</p>
                <p class="text-sm text-gray-500">Ingresá el código de 6 dígitos que te enviamos</p>
                <input v-model="auth.codigoInput.value" type="text" maxlength="6" placeholder="000000" :disabled="auth.isLoading.value"
                    class="p-2 border w-full rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60" />
                <p v-if="auth.errorMsg.value" class="text-red-500 text-sm">{{ auth.errorMsg.value }}</p>
                <button @click="auth.verificarCodigo" :disabled="auth.isLoading.value"
                    class="bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                    {{ auth.isLoading.value ? 'Cargando...' : 'Verificar código' }}
                </button>
                <button @click="auth.register(auth.email.value, auth.password1.value, auth.password2.value)" :disabled="auth.isLoading.value"
                    class="text-sm text-[var(--primary)] hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                    Reenviar código
                </button>
            </section>

            <!-- Completar perfil -->
            <section v-else-if="auth.showCompleteProfile.value" class="flex flex-col p-6 text-center gap-4">
                <p class="text-sm text-green-600 font-bold">{{ auth.successMsg.value }}</p>
                <p class="text-sm text-gray-500">Contanos de vos para terminar</p>
                <input v-model="auth.datosNuevos.value.nombre" type="text" placeholder="Nombre completo"
                    class="p-2 border w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                <input v-model="auth.datosNuevos.value.telefono" type="tel" placeholder="Teléfono"
                    class="p-2 border w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                <input v-model="auth.datosNuevos.value.direccion" type="text" placeholder="Dirección"
                    class="p-2 border w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                <label class="text-sm text-gray-500 text-left block -mb-2">🎂 Fecha de cumpleaños</label>
                <input v-model="auth.datosNuevos.value.cumpleanos" type="date"
                    class="p-2 border w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                <button @click="auth.obtenerUbicacionPerfil" :disabled="auth.isLoading.value"
                    class="w-full py-2 border-2 border-dashed border-[var(--primary)] rounded-lg text-[var(--primary)] font-bold hover:bg-purple-50 transition-colors hover:cursor-pointer text-sm disabled:opacity-60 disabled:cursor-not-allowed">
                    <span v-if="auth.isLoading.value" class="pi pi-spinner animate-spin"></span>
                    {{ auth.isLoading.value ? 'Cargando...' : '📍 Usar mi ubicación actual' }}
                </button>
                <p v-if="auth.errorMsg.value" class="text-red-500 text-sm">{{ auth.errorMsg.value }}</p>
                <button @click="auth.completarPerfil" :disabled="auth.isLoading.value"
                    class="bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                    {{ auth.isLoading.value ? 'Cargando...' : 'Finalizar' }}
                </button>
            </section>

            <!-- Login / Register -->
            <section v-else class="flex flex-col p-6 text-center gap-4">
                <img :src="imageUrl" alt="logo_foodmania" class="w-20 mx-auto -mt-10 mb-2 rounded-full border-4 border-white shadow-lg bg-white" />
                <div class="relative">
                    <span class="pi pi-envelope absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></span>
                    <input v-model="auth.email.value" @input="auth.emailEnUso.value = false" type="email" placeholder="Correo electrónico"
                        class="pl-9 p-2 border w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <section v-if="auth.justLogin.value && !auth.forgotPassword.value">
                    <div class="relative">
                        <span class="pi pi-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></span>
                        <input v-model="auth.password1.value" type="password" placeholder="Contraseña"
                            class="pl-9 p-2 w-full border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                    </div>
                </section>
                <section class="flex flex-col gap-2" v-else-if="!auth.justLogin.value && !auth.forgotPassword.value">
                    <div class="relative">
                        <span class="pi pi-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></span>
                        <input v-model="auth.password1.value" type="password" placeholder="Crear contraseña"
                            class="pl-9 p-2 border rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                    </div>
                    <div class="relative">
                        <span class="pi pi-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></span>
                        <input v-model="auth.password2.value" type="password" placeholder="Confirmar contraseña"
                            class="pl-9 p-2 border rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                    </div>
                    <p class="text-xs text-red-500">Mínimo 8 caracteres, mayúscula, minúscula y número.</p>
                </section>
                <p v-if="auth.successMsg.value" class="text-green-500 text-sm">{{ auth.successMsg.value }}</p>
                <p v-if="auth.errorMsg.value" class="text-red-500 text-sm">
                    {{ auth.errorMsg.value }}
                    <a v-if="auth.emailEnUso.value" href="#" @click="auth.justLogin.value = true; auth.forgotPassword.value = false; auth.emailEnUso.value = false; auth.errorMsg.value = ''"
                        class="text-[var(--primary)] font-bold underline">Iniciá sesión</a>
                </p>
                <button v-if="auth.justLogin.value && !auth.forgotPassword.value" @click="auth.login(auth.email.value, auth.password1.value)" :disabled="auth.isLoading.value"
                    class="bg-[var(--accent)] text-white px-4 py-2 rounded-xl font-bold hover:bg-[var(--accent-dark)] transition-colors hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                    {{ auth.isLoading.value ? 'Cargando...' : 'Iniciar sesión' }}
                </button>
                <button v-else-if="!auth.justLogin.value && !auth.forgotPassword.value" @click="auth.register(auth.email.value, auth.password1.value, auth.password2.value)" :disabled="auth.isLoading.value"
                    class="bg-[var(--accent)] text-white px-4 py-2 rounded-xl font-bold hover:bg-[var(--accent-dark)] transition-colors hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                    {{ auth.isLoading.value ? 'Cargando...' : 'Crear cuenta' }}
                </button>
                <button v-if="auth.forgotPassword.value" @click="auth.resetPassword(auth.email.value)" :disabled="auth.isLoading.value"
                    class="bg-[var(--accent)] text-white px-4 py-2 rounded-xl font-bold hover:bg-[var(--accent-dark)] transition-colors hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                    {{ auth.isLoading.value ? 'Cargando...' : 'Enviar correo de recuperación' }}
                </button>
            </section>
            <section v-if="auth.justLogin.value && !auth.showVerifyCode.value && !auth.showCompleteProfile.value" class="text-center text-sm border-t px-5 pt-4 pb-5">
                <p class="text-gray-600">¿No tenés cuenta? <a href="#"
                        @click="auth.justLogin.value = false; auth.forgotPassword.value = false"
                        class="text-[var(--primary)] font-bold">Regístrate</a></p>
                <button class="text-[var(--primary)] text-sm mt-2 hover:cursor-pointer"
                    @click="auth.forgotPassword.value = true">¿Olvidaste tu contraseña?</button>
            </section>
            <section v-if="!auth.justLogin.value && !auth.showVerifyCode.value && !auth.showCompleteProfile.value" class="text-center text-sm border-t px-5 pt-4 pb-5">
                <p class="text-gray-600">¿Ya tenés cuenta? <a href="#" @click="auth.justLogin.value = true"
                        class="text-[var(--primary)] font-bold">Iniciá sesión</a></p>
            </section>
        </div>
    </div>
</template>

<script setup>
defineProps({
    auth: { type: Object, required: true },
    imageUrl: { type: String, default: '' }
})
</script>
