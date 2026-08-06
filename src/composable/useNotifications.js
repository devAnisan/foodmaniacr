import { doc, setDoc } from 'firebase/firestore'
import { app, db, VAPID_KEY } from '../firebase.js'

// firebase/messaging solo se carga cuando realmente se usa (notificaciones push),
// para que no pese en el bundle inicial de páginas que nunca lo necesitan.
let messagingPromise = null
const getMessagingInstance = () => {
  if (!messagingPromise) {
    messagingPromise = import('firebase/messaging').then(({ getMessaging }) => getMessaging(app))
  }
  return messagingPromise
}

export function useNotifications() {

  const tienePermiso = () => {
    if (!('Notification' in window)) return false
    return Notification.permission === 'granted'
  }

  const permisoPendiente = () => {
    if (!('Notification' in window)) return false
    return Notification.permission === 'default'
  }

  const solicitarPermiso = async (userId) => {
    if (!('Notification' in window)) return null
    if (!userId) return null

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const [{ getToken }, messaging] = await Promise.all([import('firebase/messaging'), getMessagingInstance()])
    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    if (!token) return null

    await setDoc(doc(db, 'clientes', userId), {
      fcmToken: token,
      fcmTokenActualizado: new Date()
    }, { merge: true })

    return token
  }

  const escucharMensajes = async (onMessageReceived) => {
    const [{ onMessage }, messaging] = await Promise.all([import('firebase/messaging'), getMessagingInstance()])
    return onMessage(messaging, (payload) => {
      if (onMessageReceived) onMessageReceived(payload)
    })
  }

  return {
    tienePermiso,
    permisoPendiente,
    solicitarPermiso,
    escucharMensajes
  }
}
