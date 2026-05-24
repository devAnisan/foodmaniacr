<template>
  <ul
    class="flex flex-col p-2 box-border absolute top-25 right-4 bg-white rounded-lg shadow-lg w-44 space-y-2"
  >
    <li class="p-1"><a href="#">Inicio</a></li>
    <li class="p-1"><a href="#menu">Menú</a></li>
    <li class="p-1"><a href="#sucursales">Sucursales</a></li>
    <li class="p-1"><a href="#dondeComprar">¿Dónde comprar?</a></li>
    <li v-if="esAdmin">
      <button @click="irAAdmin"
        class="w-full border border-green-500 text-green-600 p-1.5 rounded-full text-sm font-bold hover:bg-green-50 transition-colors hover:cursor-pointer">
        Admin
      </button>
    </li>
    <li>
      <button @click="openLogin"
        class="w-full border p-2 rounded-full font-bold hover:bg-gray-50 transition-colors hover:cursor-pointer">
        {{ user ? user.email.split('@')[0] : "Inicia sesión" }}
      </button>
    </li>
    <button
      id="extrabold"
      class="border my-0.5 p-2 pl-3 pr-3 rounded-full hover:cursor-pointer"
    >
      <a href="/menu" target="_blank">Ordena aquí</a>
    </button>
  </ul>
</template>

<script setup>
import { ref as vueRef, onMounted } from "vue"
import { useRouter } from "vue-router"
import { auth, db } from "../firebase.js"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { useCartStore } from "../stores/carStores.js"

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
