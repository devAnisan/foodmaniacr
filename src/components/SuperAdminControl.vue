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
            <div class="flex items-center gap-2">
                <button @click="showGlosarioModal = true"
                    class="text-sm border px-4 py-2 rounded-full hover:bg-gray-100 transition-colors hover:cursor-pointer flex items-center gap-1">
                    <span>📖</span> Glosario de atributos
                </button>
                <button @click="cerrarSesion"
                    class="text-sm border px-4 py-2 rounded-full hover:bg-gray-100 transition-colors hover:cursor-pointer">
                    Cerrar sesión
                </button>
            </div>
        </header>

        <!-- Modal Glosario de atributos -->
        <div v-if="showGlosarioModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            @click="showGlosarioModal = false">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" @click.stop>
                <div class="flex justify-between items-center p-5 border-b sticky top-0 bg-white">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">📖</span>
                        <h2 class="text-xl font-bold">Glosario de atributos de producto</h2>
                    </div>
                    <button @click="showGlosarioModal = false"
                        class="pi pi-times text-red-500 hover:cursor-pointer p-2"></button>
                </div>
                <div class="p-5 flex flex-col gap-6 text-sm">
                    <p class="text-gray-500">
                        Cada producto en Firestore puede tener estos campos además de los que ya aparecen como inputs
                        en el formulario. Los que no tienen su propio input acá se pueden agregar/editar desde
                        "Atributos adicionales" en cada producto.
                    </p>
                    <div v-for="grupo in GLOSARIO_ATRIBUTOS" :key="grupo.titulo">
                        <h3 class="font-bold text-[var(--primary)] mb-2">{{ grupo.titulo }}</h3>
                        <div class="flex flex-col gap-3">
                            <div v-for="attr in grupo.atributos" :key="attr.nombre" class="bg-gray-50 rounded-lg p-3">
                                <p class="font-mono font-bold text-gray-800">
                                    {{ attr.nombre }}
                                    <span class="text-gray-400 font-sans font-normal text-xs">({{ attr.tipo }})</span>
                                </p>
                                <p class="text-gray-600 mt-1">{{ attr.descripcion }}</p>
                                <p v-if="attr.depende" class="text-amber-600 text-xs mt-1">⚠️ {{ attr.depende }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

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
                            <input v-model="producto.precio" type="number" placeholder="Precio (₡)"
                                class="w-32 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                            <input v-if="coleccionActiva === 'merchandising'" v-model="producto.puntosCanje" type="number" placeholder="Puntos ManiaCoins (opcional)"
                                class="w-48 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                            <input v-model="producto.incluye" type="text" placeholder="Incluye (opcional)"
                                class="flex-1 p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                        </div>
                        <div v-if="coleccionActiva === 'merchandising'" class="flex gap-2">
                            <input v-model="producto.talla" type="text" placeholder="Tallas disponibles, separadas por coma (ej: S, M, L, XL)"
                                class="flex-1 p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                        </div>
                        <label v-if="coleccionActiva !== 'bebidas' && coleccionActiva !== 'merchandising'"
                            class="flex items-center gap-1.5 text-sm hover:cursor-pointer">
                            <input type="checkbox" v-model="producto.permiteBebidaOpcional" class="accent-[var(--primary)]" />
                            🥤 Permite agregar bebida opcional
                        </label>

                        <!-- Atributos adicionales (cualquier otro campo que tenga el producto en Firestore) -->
                        <div class="border-t pt-2 mt-1">
                            <p class="text-xs text-gray-400 font-bold uppercase mb-1">Atributos adicionales</p>
                            <div v-for="(attr, idx) in producto.atributosExtra" :key="attr.clave"
                                class="flex items-center gap-2 mb-1.5">
                                <span class="text-xs text-gray-500 w-28 flex-shrink-0 truncate" :title="attr.clave">{{ attr.clave }}</span>
                                <input v-if="attr.tipo === 'string' || attr.tipo === 'array'" v-model="attr.valor" type="text"
                                    :placeholder="attr.tipo === 'array' ? 'Valores separados por coma' : ''"
                                    class="flex-1 p-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                                <input v-else-if="attr.tipo === 'number'" v-model="attr.valor" type="number"
                                    class="flex-1 p-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                                <label v-else-if="attr.tipo === 'boolean'" class="flex items-center gap-1.5 text-sm hover:cursor-pointer">
                                    <input type="checkbox" v-model="attr.valor" class="accent-[var(--primary)]" /> Activado
                                </label>
                                <textarea v-else-if="attr.tipo === 'object'" v-model="attr.valor" rows="2"
                                    class="flex-1 p-1.5 border rounded-lg text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"></textarea>
                                <button @click="eliminarAtributo(producto, idx)" title="Eliminar atributo"
                                    class="text-red-400 hover:text-red-600 px-1 hover:cursor-pointer">
                                    <span class="pi pi-times text-xs"></span>
                                </button>
                            </div>

                            <button v-if="!producto._nuevoAtributo" @click="mostrarFormNuevoAtributo(producto)"
                                class="text-[var(--primary)] text-xs font-bold hover:underline hover:cursor-pointer mt-1">
                                + Agregar atributo
                            </button>
                            <div v-else class="flex flex-wrap items-center gap-2 mt-2 bg-gray-50 p-2 rounded-lg">
                                <input v-model="producto._nuevoAtributo.clave" type="text" placeholder="Nombre del campo"
                                    class="w-32 p-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                                <select v-model="producto._nuevoAtributo.tipo"
                                    class="p-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                                    <option value="string">Texto</option>
                                    <option value="number">Número</option>
                                    <option value="boolean">Sí / No</option>
                                    <option value="array">Lista (separada por coma)</option>
                                </select>
                                <label v-if="producto._nuevoAtributo.tipo === 'boolean'" class="flex items-center gap-1.5 text-sm hover:cursor-pointer">
                                    <input type="checkbox" v-model="producto._nuevoAtributo.valor" /> Activado
                                </label>
                                <input v-else v-model="producto._nuevoAtributo.valor" type="text" placeholder="Valor"
                                    class="flex-1 p-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                                <button @click="confirmarNuevoAtributo(producto)"
                                    class="bg-[var(--primary)] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:cursor-pointer">
                                    Agregar
                                </button>
                                <button @click="producto._nuevoAtributo = null"
                                    class="text-gray-400 text-xs hover:cursor-pointer">
                                    Cancelar
                                </button>
                            </div>
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
import { doc, getDoc, collection, getDocs, updateDoc, addDoc, deleteDoc, deleteField } from 'firebase/firestore'
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
const showGlosarioModal = vueRef(false)

const GLOSARIO_ATRIBUTOS = [
    {
        titulo: 'Campos fijos (ya tienen su input en este formulario)',
        atributos: [
            { nombre: 'nombre', tipo: 'texto', descripcion: 'Nombre del producto, se muestra en el menú.' },
            { nombre: 'descripcion', tipo: 'texto', descripcion: 'Descripción corta del producto, se muestra en la card del menú (con "Ver más" si es larga).' },
            { nombre: 'precio', tipo: 'número', descripcion: 'Precio en colones (₡). En Merchandising es el precio para pagar en efectivo/SINPE.' },
            { nombre: 'incluye', tipo: 'texto', descripcion: 'Texto opcional que aparece como "✅ Incluye..." en la card del producto.' },
            { nombre: 'imagen', tipo: 'ruta de Storage', descripcion: 'Ruta de la foto del producto en Firebase Storage. Se sube sola al usar "Cambiar imagen", no hace falta tocarla a mano.' },
            { nombre: 'puntosCanje', tipo: 'número', descripcion: 'Solo en Merchandising: costo en ManiaCoins para canjear el producto.', depende: 'Si un producto de las categorías de comida también tiene este campo, necesita además "ValidoParaCambio" en true para aparecer en la pestaña Canjear. Merchandising no necesita ese segundo campo.' },
            { nombre: 'talla', tipo: 'lista', descripcion: 'Solo en Merchandising: tallas disponibles (ej. S, M, L, XL).', depende: 'Si el producto tiene tallas cargadas, el cliente tiene que elegir una antes de poder agregarlo al carrito.' },
            { nombre: 'permiteBebidaOpcional', tipo: 'sí/no', descripcion: 'Muestra el upsell "Agregar bebida (opcional)" (bebida paga) en el personalizador de este producto.', depende: 'Se ignora si el producto ya tiene "bebidaEspecifica" cargado — en ese caso nunca se muestra el upsell, sin importar este campo.' },
        ]
    },
    {
        titulo: 'Personalización — bebidas y proteína (se agregan como "Atributo adicional")',
        atributos: [
            { nombre: 'gaseosaIncluida', tipo: 'sí/no', descripcion: 'Indica que el producto ya trae una gaseosa 600ml incluida en el precio, para que el cliente elija el sabor.', depende: 'Solo tiene efecto junto con "gaseosaSabores" — si no hay sabores cargados, no se muestra ningún selector aunque esto esté en true.' },
            { nombre: 'gaseosaSabores', tipo: 'lista', descripcion: 'Sabores disponibles para la gaseosa incluida (ej: Cola, Fresa, Naranja).', depende: 'Solo se usa si "gaseosaIncluida" está en true.' },
            { nombre: 'bebidaEspecifica', tipo: 'objeto (nombre)', descripcion: 'El producto ya incluye UNA bebida específica fija, sin elegir sabor. Se muestra como "Incluye [nombre]" de cortesía en el personalizador, el carrito y la factura, sin cobrarse.', depende: 'Si está presente, oculta siempre el upsell de "Agregar bebida (opcional)", sin importar el valor de "permiteBebidaOpcional".' },
            { nombre: 'opcionesProteina', tipo: 'lista', descripcion: 'Opciones de proteína para elegir en un combo (ej: Pollo, Res, Cerdo).' },
        ]
    },
    {
        titulo: 'Personalización — papas y salsas (se agregan como "Atributo adicional")',
        atributos: [
            { nombre: 'papas', tipo: 'sí/no', descripcion: 'Indica que el producto incluye una orden de papas fritas. Activa el toggle "¿Papas con salsa? Sí/No" en el personalizador, y el checkbox de "Agrandar papas" (con costo) en el carrito.' },
            { nombre: 'salsa', tipo: 'lista', descripcion: 'Usado en productos de papas pequeñas/grandes para elegir "Con salsa" o "Sin salsa" como opciones a escoger.', depende: 'Es un campo distinto de "papas" de arriba — no confundirlos, uno es un toggle Sí/No y este es una lista de opciones.' },
            { nombre: 'permiteAnadirPapas', tipo: 'sí/no', descripcion: 'Muestra un checkbox para agregar una orden de papas fritas totalmente gratis (cortesía), pensado para productos tipo "cantón". Nunca se cobra, sin importar qué tan seguido se marque.' },
            { nombre: 'salsasDisponibles', tipo: 'sí/no', descripcion: 'Muestra el selector de hasta 2 salsas (viene de la colección "salsas") en productos que no se llaman "Alitas Mania" pero también ofrecen elegir salsas, como Nuggets.', depende: 'Los productos que tienen "Alitas Mania" en el nombre ya muestran este selector automáticamente, sin necesitar este campo.' },
        ]
    },
    {
        titulo: 'Canje con ManiaCoins',
        atributos: [
            { nombre: 'ValidoParaCambio', tipo: 'sí/no', descripcion: 'Marca que un producto de las categorías de comida también puede canjearse con ManiaCoins en la pestaña "Canjear", además de comprarse con colones.', depende: 'Necesita también tener "puntosCanje" mayor a 0. Este campo solo aplica a comida — los productos de Merchandising aparecen en Canjear automáticamente con solo tener puntosCanje, sin necesitar este campo.' },
        ]
    },
]

let tempCounter = 0

const mostrarMensaje = (msg, tipo = 'success') => {
    mensaje.value = msg
    mensajeTipo.value = tipo
    setTimeout(() => { mensaje.value = '' }, 3000)
}

// ── Atributos adicionales (campos libres, cualquier producto) ──────────────
// Campos que ya tienen su propio input en el formulario — todo lo demás que
// traiga el documento de Firestore se muestra como "atributo adicional".
const CAMPOS_FIJOS = ['nombre', 'descripcion', 'precio', 'incluye', 'imagen', 'puntosCanje', 'talla', 'permiteBebidaOpcional']

const inferirTipo = (valor) => {
    if (typeof valor === 'boolean') return 'boolean'
    if (typeof valor === 'number') return 'number'
    if (Array.isArray(valor)) return 'array'
    if (valor !== null && typeof valor === 'object') return 'object'
    return 'string'
}

const construirAtributosExtra = (data) => {
    return Object.entries(data)
        .filter(([clave]) => !CAMPOS_FIJOS.includes(clave))
        .map(([clave, valorOriginal]) => {
            const tipo = inferirTipo(valorOriginal)
            let valor = valorOriginal
            if (tipo === 'array') valor = (valorOriginal || []).join(', ')
            else if (tipo === 'object') valor = JSON.stringify(valorOriginal, null, 2)
            return { clave, tipo, valor }
        })
}

const convertirAtributoAValor = (attr) => {
    if (attr.tipo === 'number') return Number(attr.valor) || 0
    if (attr.tipo === 'boolean') return !!attr.valor
    if (attr.tipo === 'array') return attr.valor ? attr.valor.split(',').map(s => s.trim()).filter(Boolean) : []
    if (attr.tipo === 'object') return JSON.parse(attr.valor)
    return attr.valor
}

const mostrarFormNuevoAtributo = (producto) => {
    producto._nuevoAtributo = { clave: '', tipo: 'string', valor: '' }
}

const confirmarNuevoAtributo = (producto) => {
    const clave = producto._nuevoAtributo.clave.trim()
    if (!clave) return mostrarMensaje('Ingresá un nombre para el atributo', 'error')
    if (clave.includes('.')) return mostrarMensaje('El nombre del atributo no puede contener puntos', 'error')
    if (CAMPOS_FIJOS.includes(clave) || producto.atributosExtra.some(a => a.clave === clave)) {
        return mostrarMensaje('Ese atributo ya existe', 'error')
    }
    producto.atributosExtra.push({ ...producto._nuevoAtributo, clave })
    producto._atributosEliminados = producto._atributosEliminados.filter(k => k !== clave)
    producto._nuevoAtributo = null
}

const eliminarAtributo = (producto, idx) => {
    const [attr] = producto.atributosExtra.splice(idx, 1)
    if (attr) producto._atributosEliminados.push(attr.clave)
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
                permiteBebidaOpcional: data.permiteBebidaOpcional ?? true,
                atributosExtra: construirAtributosExtra(data),
                _atributosEliminados: [],
                _nuevoAtributo: null,
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
        permiteBebidaOpcional: true,
        atributosExtra: [],
        _atributosEliminados: [],
        _nuevoAtributo: null,
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
    for (const attr of producto.atributosExtra) {
        if (attr.tipo === 'object') {
            try {
                JSON.parse(attr.valor)
            } catch {
                mostrarMensaje(`El atributo "${attr.clave}" tiene un JSON inválido`, 'error')
                return
            }
        }
    }
    producto._guardando = true
    try {
        const imagenPath = await subirImagenSiHaceFalta(producto)
        const payload = {
            nombre: producto.nombre.trim(),
            descripcion: producto.descripcion.trim(),
            incluye: producto.incluye.trim(),
            imagen: imagenPath,
            precio: Number(producto.precio) || 0,
        }
        if (coleccionActiva.value === 'merchandising') {
            payload.puntosCanje = Number(producto.puntosCanje) || 0
            payload.talla = producto.talla
                ? producto.talla.split(',').map(t => t.trim()).filter(Boolean)
                : []
        }
        if (coleccionActiva.value !== 'bebidas' && coleccionActiva.value !== 'merchandising') {
            payload.permiteBebidaOpcional = !!producto.permiteBebidaOpcional
        }
        for (const attr of producto.atributosExtra) {
            payload[attr.clave] = convertirAtributoAValor(attr)
        }
        for (const clave of producto._atributosEliminados) {
            payload[clave] = deleteField()
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
        producto._atributosEliminados = []
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
