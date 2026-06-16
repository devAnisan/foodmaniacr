<template>
  <ul
    class="flex flex-col p-3 box-border absolute top-full right-4 mt-2 bg-white rounded-xl shadow-xl w-48 border border-gray-100 space-y-1"
  >
    <li><a href="#" class="block px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Inicio</a></li>
    <li><a href="#menu" class="block px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Menú</a></li>
    <li><a href="#sucursales" class="block px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Sucursales</a></li>
    <li><a href="#dondeComprar" class="block px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">¿Dónde comprar?</a></li>
    <li v-if="esAdmin" class="pt-1 border-t border-gray-100">
      <button @click="irAAdmin"
        class="w-full border border-green-500 text-green-600 py-2 rounded-xl text-sm font-bold hover:bg-green-50 transition-colors hover:cursor-pointer">
        Admin
      </button>
    </li>
    <li>
      <button @click="openLogin"
        class="w-full border border-gray-300 py-2 rounded-xl font-bold hover:bg-gray-50 transition-colors hover:cursor-pointer">
        {{ user ? user.email.split('@')[0] : "Inicia sesión" }}
      </button>
    </li>
    <a href="/menu" target="_blank"
      class="block text-center extrabold border my-0.5 px-4 py-2 rounded-full hover:bg-gray-50 transition-colors">
      Ordena aquí
    </a>
  </ul>
</template>

<script setup>
import { ref as vueRef, onMounted } from "vue"
import { useRouter } from "vue-router"
import { auth, db } from "../firebase.js"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { useCartStore } from "../stores/cartStores.js"

const router = useRouter()
const user = vueRef(null)
const esAdmin = vueRef(false)

const openLogin = () => {
  if (user.value) {
    cerrarSesion()
  } else {
    router.push("/menu")
  }
}

const cerrarSesion = async () => {
  useCartStore().items = []
  await signOut(auth)
}

const irAAdmin = () => {
  router.push("/adminControl")
}

const verificarAdmin = async (currentUser) => {
  if (!currentUser) {
    esAdmin.value = false
    return
  }
  try {
    const docRef = doc(db, "superUser", currentUser.uid)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const superUserData = docSnap.data()
      esAdmin.value = superUserData.rol === "administrador"
    }
  } catch (error) {
    console.error("Error verificando admin:", error)
    esAdmin.value = false
  }
}

onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
    if (currentUser) {
      verificarAdmin(currentUser)
    } else {
      esAdmin.value = false
    }
  })
})
</script>
