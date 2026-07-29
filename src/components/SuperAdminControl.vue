<template>
    <!-- Loader de verificación de rol -->
    <div v-if="verificando" class="flex items-center justify-center h-screen fontColor">
        <div class="text-center">
            <span class="pi pi-spinner animate-spin text-4xl text-[var(--primary)] block mb-4"></span>
            <p class="text-gray-500">Verificando acceso...</p>
        </div>
    </div>

    <!-- Acceso denegado -->
    <div v-else-if="!esSuperAdmin" class="flex flex-col items-center justify-center h-screen gap-4 text-center fontColor">
        <p class="text-6xl">🚫</p>
        <h1 class="text-2xl font-bold">Acceso denegado</h1>
        <p class="text-gray-500">No tenés permisos para ver esta página.</p>
        <button @click="router.push('/')"
            class="bg-[var(--primary)] text-white px-6 py-2 rounded-full font-bold hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
            Volver al inicio
        </button>
    </div>

    <!-- Panel -->
    <div v-else class="min-h-screen bg-gray-50 fontColor pb-16">
        <header class="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <span class="text-2xl">🛠️</span>
                <div>
                    <h1 class="text-xl font-bold text-[var(--primary)]">Super Admin — Productos</h1>
                    <p class="text-xs text-gray-400">Bienvenido, {{ adminNombre }}</p>
                </div>
            </div>
            <button @click="cerrarSesion"
                class="text-sm border px-4 py-2 rounded-full hover:bg-gray-100 transition-colors hover:cursor-pointer">
                Cerrar sesión
            </button>
        </header>

        <div v-if="mensaje" class="max-w-4xl mx-auto mt-4 px-4">
            <div class="text-sm font-bold px-3 py-2 rounded-lg text-center"
                :class="mensajeTipo === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                {{ mensaje }}
            </div>
        </div>

        <div class="max-w-4xl mx-auto px-4 py-6">
            <!-- Selector de colección -->
            <div class="flex gap-2 overflow-x-auto pb-2 mb-6">
                <button v-for="c in COLECCIONES" :key="c.key" @click="seleccionarColeccion(c.key)"
                    :class="coleccionActiva === c.key ? 'bg-[var(--primary)] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'"
                    class="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border transition-all duration-200 flex-shrink-0 hover:cursor-pointer">
                    {{ c.label }}
                </button>
            </div>

            <button @click="agregarNuevo"
                class="mb-4 bg-[var(--primary)] text-white px-4 py-2 rounded-xl font-bold hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer">
                + Nuevo producto
            </button>

            <div v-if="cargando" class="text-center text-gray-400 py-10">
                <span class="pi pi-spinner animate-spin text-3xl"></span>
            </div>

            <div v-else class="grid gap-4">
                <div v-for="producto in productos" :key="producto.id || producto._tempId"
                    class="bg-white rounded-xl shadow-md p-4 flex flex-col md:flex-row gap-4">
                    <div class="flex flex-col items-center gap-2 md:w-28 flex-shrink-0">
                        <img v-if="producto.imagenUrl" :src="producto.imagenUrl" class="w-24 h-24 object-cover rounded-lg" alt="" />
                        <div v-else class="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">🍽️</div>
                        <label class="text-xs text-[var(--primary)] font-bold hover:underline hover:cursor-pointer text-center">
                            Cambiar imagen
                            <input type="file" accept="image/*" class="hidden" @change="onArchivoSeleccionado(producto, $event)" />
                        </label>
                    </div>
                    <div class="flex-1 flex flex-col gap-2">
                        <input v-model="producto.nombre" type="text" placeholder="Nombre"
                            class="p-2 border rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                        <textarea v-model="producto.descripcion" placeholder="Descripción" rows="2"
                            class="p-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"></textarea>
                        <div class="flex gap-2">
                            <input v-if="coleccionActiva !== 'merchandising'" v-model="producto.precio" type="number" placeholder="Precio (₡)"
                                class="w-32 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                            <input v-if="coleccionActiva === 'merchandising'" v-model="producto.puntosCanje" type="number" placeholder="Puntos ManiaCoins"
                                class="w-40 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                            <input v-model="producto.incluye" type="text" placeholder="Incluye (opcional)"
                                class="flex-1 p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                        </div>
                        <div v-if="coleccionActiva === 'merchandising'" class="flex gap-2">
                            <input v-model="producto.talla" type="text" placeholder="Tallas disponibles, separadas por coma (ej: S, M, L, XL)"
                                class="flex-1 p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                        </div>
                        <div class="flex gap-2 justify-end mt-1">
                            <button @click="eliminarProducto(producto)"
                                class="text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:cursor-pointer">
                                <span class="pi pi-trash"></span> Eliminar
                            </button>
                            <button @click="guardarProducto(producto)" :disabled="producto._guardando"
                                class="bg-[var(--primary)] text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-[var(--primary-dark)] transition-colors hover:cursor-pointer disabled:opacity-50">
                                <span v-if="producto._guardando" class="pi pi-spinner animate-spin"></span>
                                {{ producto._nuevo ? 'Crear' : 'Guardar' }}
                            </button>
                        </div>
                    </div>
                </div>

                <p v-if="productos.length === 0" class="text-center text-gray-400 py-10">
                    No hay productos en esta categoría.
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref as vueRef, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db, storage } from '../firebase.js'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, collection, getDocs, updateDoc, addDoc, deleteDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const router = useRouter()
const verificando = vueRef(true)
const esSuperAdmin = vueRef(false)
const adminNombre = vueRef('')

const COLECCIONES = [
    { key: 'comidachina', label: '🥡 Comida China' },
    { key: 'comidarapida', label: '🍟 Comida Rápida' },
    { key: 'hamburguesas', label: '🍔 Hamburguesas' },
    { key: 'pollofrito', label: '🍗 Pollo Frito' },
    { key: 'promociones', label: '🔥 Promociones' },
    { key: 'supremos', label: '👑 Supremos' },
    { key: 'surtidos', label: '🎁 Surtidos' },
    { key: 'bebidas', label: '🥤 Bebidas' },
    { key: 'merchandising', label: '👕 Merchandising' },
]

const coleccionActiva = vueRef(COLECCIONES[0].key)
const productos = vueRef([])
const cargando = vueRef(false)
const mensaje = vueRef('')
const mensajeTipo = vueRef('success')

let tempCounter = 0

const mostrarMensaje = (msg, tipo = 'success') => {
    mensaje.value = msg
    mensajeTipo.value = tipo
    setTimeout(() => { mensaje.value = '' }, 3000)
}

const cargarProductos = async () => {
    cargando.value = true
    try {
        const snap = await getDocs(collection(db, coleccionActiva.value))
        const lista = []
        for (const d of snap.docs) {
            const data = d.data()
            let imagenUrl = ''
            if (data.imagen) {
                try {
                    imagenUrl = await getDownloadURL(storageRef(storage, data.imagen))
                } catch {
                    imagenUrl = ''
                }
            }
            lista.push({
                id: d.id,
                nombre: data.nombre || '',
                descripcion: data.descripcion || '',
                precio: data.precio ?? '',
                incluye: data.incluye || '',
                imagen: data.imagen || '',
                imagenUrl,
                puntosCanje: data.puntosCanje ?? '',
                talla: (data.talla || []).join(', '),
                _archivo: null,
                _nuevo: false,
                _guardando: false,
            })
        }
        productos.value = lista
    } catch (error) {
        console.error('Error cargando productos:', error)
        mostrarMensaje('Error al cargar productos', 'error')
    } finally {
        cargando.value = false
    }
}

const seleccionarColeccion = (key) => {
    coleccionActiva.value = key
    cargarProductos()
}

const agregarNuevo = () => {
    productos.value.unshift({
        id: null,
        nombre: '',
        descripcion: '',
        precio: '',
        incluye: '',
        imagen: '',
        imagenUrl: '',
        puntosCanje: '',
        talla: '',
        _archivo: null,
        _nuevo: true,
        _guardando: false,
        _tempId: ++tempCounter,
    })
}

const onArchivoSeleccionado = (producto, event) => {
    const file = event.target.files[0]
    if (!file) return
    producto._archivo = file
    producto.imagenUrl = URL.createObjectURL(file)
}

const subirImagenSiHaceFalta = async (producto) => {
    if (!producto._archivo) return producto.imagen
    const path = `${coleccionActiva.value}/${Date.now()}_${producto._archivo.name}`
    await uploadBytes(storageRef(storage, path), producto._archivo)
    return path
}

const guardarProducto = async (producto) => {
    if (!producto.nombre.trim()) {
        mostrarMensaje('El nombre es obligatorio', 'error')
        return
    }
    producto._guardando = true
    try {
        const imagenPath = await subirImagenSiHaceFalta(producto)
        const payload = {
            nombre: producto.nombre.trim(),
            descripcion: producto.descripcion.trim(),
            incluye: producto.incluye.trim(),
            imagen: imagenPath,
        }
        if (coleccionActiva.value === 'merchandising') {
            payload.puntosCanje = Number(producto.puntosCanje) || 0
            payload.talla = producto.talla
                ? producto.talla.split(',').map(t => t.trim()).filter(Boolean)
                : []
        } else {
            payload.precio = Number(producto.precio) || 0
        }
        if (producto._nuevo) {
            const nuevoDoc = await addDoc(collection(db, coleccionActiva.value), payload)
            producto.id = nuevoDoc.id
            producto._nuevo = false
        } else {
            await updateDoc(doc(db, coleccionActiva.value, producto.id), payload)
        }
        producto.imagen = imagenPath
        producto._archivo = null
        mostrarMensaje('Producto guardado ✅')
    } catch (error) {
        console.error('Error guardando producto:', error)
        mostrarMensaje('Error al guardar', 'error')
    } finally {
        producto._guardando = false
    }
}

const eliminarProducto = async (producto) => {
    if (producto._nuevo) {
        productos.value = productos.value.filter(p => p !== producto)
        return
    }
    if (!confirm(`¿Eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`)) return
    try {
        await deleteDoc(doc(db, coleccionActiva.value, producto.id))
        productos.value = productos.value.filter(p => p.id !== producto.id)
        mostrarMensaje('Producto eliminado')
    } catch (error) {
        console.error('Error eliminando producto:', error)
        mostrarMensaje('Error al eliminar', 'error')
    }
}

const cerrarSesion = async () => {
    await signOut(auth)
    router.push('/')
}

let unsubAuth = null

onMounted(() => {
    unsubAuth = onAuthStateChanged(auth, async (user) => {
        if (!user) {
            verificando.value = false
            router.push('/')
            return
        }
        try {
            const docSnap = await getDoc(doc(db, 'superAdmin', user.uid))
            if (docSnap.exists()) {
                esSuperAdmin.value = true
                adminNombre.value = docSnap.data().usuario || user.email
                await cargarProductos()
            }
        } catch (error) {
            console.error('Error verificando super admin:', error)
        } finally {
            verificando.value = false
        }
    })
})

onUnmounted(() => {
    if (unsubAuth) unsubAuth()
})
</script>
