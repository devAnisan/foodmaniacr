import { ref as vueRef, watch } from 'vue'
import { auth, db } from '../firebase.js'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { useCartStore } from '../stores/cartStores.js'

export function useAuth() {
  const user = vueRef(null)
  const esAdmin = vueRef(false)
  const justLogin = vueRef(true)
  const forgotPassword = vueRef(false)
  const email = vueRef('')
  const password1 = vueRef('')
  const password2 = vueRef('')
  const successMsg = vueRef('')
  const errorMsg = vueRef('')
  const menuLogIn = vueRef(false)
  const showUserModal = vueRef(false)

  watch(menuLogIn, val => { document.body.style.overflow = val ? 'hidden' : '' })

  const openLogin = () => {
    if (user.value) showUserModal.value = !showUserModal.value
    else menuLogIn.value = true
  }

  const cerrarSesion = async () => {
    useCartStore().items = []
    await signOut(auth)
    showUserModal.value = false
  }

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email)
      successMsg.value = 'Correo de recuperación enviado 📧'
      errorMsg.value = ''
    } catch { errorMsg.value = 'Error al enviar el correo.'; successMsg.value = '' }
  }

  const register = async (email, password1, password2) => {
    if (password1 !== password2) {
      errorMsg.value = "Las contraseñas no coinciden. Por favor, intentalo de nuevo."
      return
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password1)
      await sendEmailVerification(userCredential.user)
      successMsg.value = "Cuenta creada exitosamente. Por favor verificá tu correo electrónico 📧"
      errorMsg.value = ""
    } catch (error) {
      console.error("Error en Auth:", error.code)
      errorMsg.value = "Error al crear la cuenta. Verificá que los datos sean correctos."
      return
    }

    try {
      await setDoc(doc(db, 'clientes', auth.currentUser.uid), {
        email: email,
        creadoEn: Timestamp.now(),
        telefono: '',
        nombre: '',
        direccion: '',
        lat: '',
        lng: ''
      })
    } catch (error) {
      console.error("Error en Firestore:", error)
    }

    setTimeout(() => {
      successMsg.value = "Cuenta creada exitosamente. Por favor verificá tu correo electrónico 📧"
      menuLogIn.value = false
    }, 2000)
  }

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      successMsg.value = 'Inicio de sesión exitoso ✅'
      errorMsg.value = ''
      setTimeout(() => {
        menuLogIn.value = false
      }, 1000)
    } catch { errorMsg.value = 'Credenciales incorrectas.'; successMsg.value = '' }
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
        esAdmin.value = docSnap.data().rol === "administrador"
      }
    } catch (error) {
      console.error("Error verificando admin:", error)
      esAdmin.value = false
    }
  }

  const initAuthListener = (onUserChange) => {
    onAuthStateChanged(auth, (currentUser) => {
      user.value = currentUser
      if (onUserChange) onUserChange(currentUser)
    })
  }

  return {
    user, esAdmin, justLogin, forgotPassword, email, password1, password2,
    successMsg, errorMsg, menuLogIn, showUserModal,
    openLogin, cerrarSesion, resetPassword, register, login,
    verificarAdmin, initAuthListener
  }
}
