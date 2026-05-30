<template>
    <!-- Overlay -->
    <div v-if="modelValue" class="fixed inset-0 bg-black/50 z-70" @click="$emit('update:modelValue', false)"></div>

    <!-- Modal -->
    <div v-if="modelValue" class="fixed inset-0 z-80 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md fontColor overflow-y-auto max-h-[90vh]">

            <!-- Header -->
            <div class="flex justify-between items-center p-5 border-b">
                <div class="flex items-center gap-2">
                    <span class="pi pi-user-edit text-xl"></span>
                    <span class="text-2xl font-bold">Mi información</span>
                </div>
                <button @click="$emit('update:modelValue', false)"
                    class="pi pi-times text-red-500 hover:text-red-700 hover:cursor-pointer p-2 rounded"></button>
            </div>

            <!-- Loader -->
            <div v-if="loading" class="flex justify-center items-center p-10">
                <span class="pi pi-spinner animate-spin text-3xl text-[var(--primary)]"></span>
            </div>

            <!-- Formulario -->
            <div v-else class="p-5 flex flex-col gap-4">

                <!-- Nombre -->
                <div>
                    <label class="text-sm text-gray-500 block mb-1">Nombre completo</label>
                    <input v-model="form.nombre" type="text" placeholder="Ej: Juan Pérez"
                        class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                </div>

                <!-- Teléfono -->
                <div>
                    <label class="text-sm text-gray-500 block mb-1">Teléfono</label>
                    <input v-model="form.telefono" type="tel" placeholder="Ej: 8888-0000"
                        class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                </div>

                <!-- Dirección -->
                <div>
                    <label class="text-sm text-gray-500 block mb-1">Dirección</label>
                    <textarea v-model="form.direccion"
                        placeholder="Ej: 100m norte del parque central, casa azul con portón negro"
                        class="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        rows="3"></textarea>
                </div>

                <!-- Cumpleaños -->
                <div>
                    <label class="text-sm text-gray-500 block mb-1">🎂 Fecha de cumpleaños</label>
                    <input v-model="form.cumpleanos" type="date"
                        class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                </div>

                <!-- Ubicación -->
                <div>
                    <label class="text-sm text-gray-500 block mb-1">Ubicación GPS</label>
                    <button @click="obtenerUbicacion" :disabled="loadingUbicacion"
                        class="w-full py-2 border-2 border-dashed border-[var(--primary)] rounded-lg text-[var(--primary)] font-bold hover:bg-purple-50 transition-colors hover:cursor-pointer disabled:opacity-50">
                        <span v-if="loadingUbicacion" class="pi pi-spinner animate-spin mr-2"></span>
                        {{ loadingUbicacion ? 'Obteniendo ubicación...' : '📍 Obtener mi ubicación actual' }}
                    </button>

                    <!-- Resultado ubicación -->
                    <div v-if="form.lat && form.lng"
                        class="mt-2 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                        <p class="text-green-600 font-bold">✅ Ubicación obtenida</p>
                        <p class="text-gray-500 mt-1">Lat: {{ form.lat }}</p>
                        <p class="text-gray-500">Lng: {{ form.lng }}</p>
                    </div>

                    <div v-if="errorUbicacion" class="mt-2 text-red-500 text-sm">
                        {{ errorUbicacion }}
                    </div>
                </div>

                <!-- Mensajes -->
                <p v-if="successMsg" class="text-green-500 text-sm text-center">{{ successMsg }}</p>
                <p v-if="errorMsg" class="text-red-500 text-sm text-center">{{ errorMsg }}</p>

                <!-- Botón guardar -->
                <button @click="guardarInformacion" :disabled="guardando"
                    class="w-full bg-[var(--primary)] text-white py-3 rounded-xl font-bold hover:bg-[var(--primary-dark)] transition-colors duration-300 hover:cursor-pointer disabled:opacity-50">
                    <span v-if="guardando" class="pi pi-spinner animate-spin mr-2"></span>
                    {{ guardando ? 'Guardando...' : 'Guardar información 💾' }}
                </button>

            </div>
        </div>
    </div>
</template>

<script setup>
import { ref as vueRef, onMounted, watch } from 'vue'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db, auth } from '../firebase.js'

const props = defineProps({
    modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const loading = vueRef(false)
const guardando = vueRef(false)
const loadingUbicacion = vueRef(false)
const errorUbicacion = vueRef('')
const successMsg = vueRef('')
const errorMsg = vueRef('')

const form = vueRef({
    nombre: '',
    telefono: '',
    direccion: '',
    cumpleanos: '',
    lat: '',
    lng: ''
})

// Cargar datos del usuario cuando se abre el modal
const cargarDatos = async () => {
    if (!auth.currentUser) return
    loading.value = true
    try {
        const docRef = doc(db, 'clientes', auth.currentUser.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
            const data = docSnap.data()
            form.value.nombre = data.nombre || ''
            form.value.telefono = data.telefono || ''
            form.value.direccion = data.direccion || ''
            form.value.cumpleanos = data.cumpleanos || ''
            form.value.lat = data.lat || ''
            form.value.lng = data.lng || ''
        }
    } catch (error) {
        console.error('Error cargando datos:', error)
    } finally {
        loading.value = false
    }
}

// Obtener ubicación GPS
const obtenerUbicacion = () => {
    errorUbicacion.value = ''
    loadingUbicacion.value = true

    navigator.geolocation.getCurrentPosition(
        (position) => {
            form.value.lat = position.coords.latitude.toFixed(6)
            form.value.lng = position.coords.longitude.toFixed(6)
            loadingUbicacion.value = false
        },
        (error) => {
            errorUbicacion.value = 'No se pudo obtener la ubicación. Verificá los permisos del navegador.'
            loadingUbicacion.value = false
        }
    )
}

// Guardar información en Firestore
const guardarInformacion = async () => {
    successMsg.value = ''
    errorMsg.value = ''

    if (!form.value.nombre) return errorMsg.value = 'El nombre es obligatorio.'
    if (!form.value.telefono) return errorMsg.value = 'El teléfono es obligatorio.'

    guardando.value = true
    try {
        const docRef = doc(db, 'clientes', auth.currentUser.uid)
        await updateDoc(docRef, {
            nombre: form.value.nombre,
            telefono: form.value.telefono,
            direccion: form.value.direccion,
            cumpleanos: form.value.cumpleanos,
            lat: form.value.lat,
            lng: form.value.lng
        })
        successMsg.value = '¡Información guardada exitosamente! ✅'
        setTimeout(() => emit('update:modelValue', false), 1500)
    } catch (error) {
        console.error('Error guardando:', error)
        errorMsg.value = 'Error al guardar. Intentá de nuevo.'
    } finally {
        guardando.value = false
    }
}

// Cargar datos cada vez que se abre el modal
watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        successMsg.value = ''
        errorMsg.value = ''
        cargarDatos()
    }
})
</script>
