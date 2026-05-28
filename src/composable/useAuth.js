import { ref as vueRef, watch } from 'vue'
import { auth, db } from '../firebase.js'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { useCartStore } from '../stores/cartStores.js'

const sendVerificationCode = httpsCallable(getFunctions(), 'sendVerificationCode')
const verifyCodeFn = httpsCallable(getFunctions(), 'verifyCode')

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
  const showVerifyCode = vueRef(false)
  const showCompleteProfile = vueRef(false)
  const pendingEmail = vueRef('')
  const codigoInput = vueRef('')
  const datosNuevos = vueRef({ nombre: '', telefono: '', direccion: '', lat: '', lng: '' })

  watch(menuLogIn, val => { document.body.style.overflow = val ? 'hidden' : '' })

  const openLogin = () => {
    if (user.value) showUserModal.value = !showUserModal.value
    else menuLogIn.value = true
  }

  const resetState = () => {
    showVerifyCode.value = false
    showCompleteProfile.value = false
    pendingEmail.value = ''
    codigoInput.value = ''
    datosNuevos.value = { nombre: '', telefono: '', direccion: '', lat: '', lng: '' }
    errorMsg.value = ''
    successMsg.value = ''
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
      errorMsg.value = "Las contraseñas no coinciden."
      return
    }

    let uid
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password1)
      uid = userCredential.user.uid
      await setDoc(doc(db, 'clientes', uid), {
        email: email,
        creadoEn: Timestamp.now(),
        telefono: '',
        nombre: '',
        direccion: '',
        lat: '',
        lng: ''
      })
      await signOut(auth)
    } catch (error) {
      console.error("Error en Auth:", error.code)
      errorMsg.value = "Error al crear la cuenta. Verificá que los datos sean correctos."
      return
    }

    try {
      await sendVerificationCode({ email })
      pendingEmail.value = email
      showVerifyCode.value = true
      justLogin.value = false
      successMsg.value = `Te enviamos un código a ${email} 📧`
      errorMsg.value = ''
    } catch (error) {
      errorMsg.value = 'Error al enviar el código. Intentá de nuevo.'
    }
  }

  const verificarCodigo = async () => {
    if (!codigoInput.value || codigoInput.value.length !== 6) {
      errorMsg.value = 'Ingresá el código de 6 dígitos.'
      return
    }
    try {
      errorMsg.value = ''
      await verifyCodeFn({ email: pendingEmail.value, code: codigoInput.value })
      successMsg.value = '✅ Correo verificado correctamente'
      showVerifyCode.value = false
      showCompleteProfile.value = true
    } catch (error) {
      errorMsg.value = error.message || 'Código incorrecto o expirado.'
    }
  }

  const completarPerfil = async () => {
    if (!datosNuevos.value.nombre) return errorMsg.value = 'Ingresá tu nombre.'
    if (!datosNuevos.value.telefono) return errorMsg.value = 'Ingresá tu teléfono.'

    try {
      const userCredential = await signInWithEmailAndPassword(auth, pendingEmail.value, password1.value)
      await setDoc(doc(db, 'clientes', userCredential.user.uid), {
        nombre: datosNuevos.value.nombre,
        telefono: datosNuevos.value.telefono,
        direccion: datosNuevos.value.direccion,
        lat: datosNuevos.value.lat,
        lng: datosNuevos.value.lng
      }, { merge: true })
      successMsg.value = '¡Perfil completado! ✅'
      resetState()
      setTimeout(() => { menuLogIn.value = false }, 1000)
    } catch {
      errorMsg.value = 'Error al iniciar sesión. Ingresá manualmente.'
      showCompleteProfile.value = false
      justLogin.value = true
    }
  }

  const obtenerUbicacionPerfil = () => {
    if (!navigator.geolocation) {
      errorMsg.value = 'Geolocalización no disponible.'
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        datosNuevos.value.lat = pos.coords.latitude.toString()
        datosNuevos.value.lng = pos.coords.longitude.toString()
        successMsg.value = '📍 Ubicación obtenida'
      },
      () => { errorMsg.value = 'No se pudo obtener la ubicación.' }
    )
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
    showVerifyCode, showCompleteProfile, pendingEmail, codigoInput, datosNuevos,
    openLogin, cerrarSesion, resetPassword, resetState,
    register, login, verificarCodigo, completarPerfil, obtenerUbicacionPerfil,
    verificarAdmin, initAuthListener
  }
}
