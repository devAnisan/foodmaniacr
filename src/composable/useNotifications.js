import { getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc } from 'firebase/firestore'
import { messaging, db, VAPID_KEY } from '../firebase.js'

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

    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    if (!token) return null

    await setDoc(doc(db, 'clientes', userId), {
      fcmToken: token,
      fcmTokenActualizado: new Date()
    }, { merge: true })

    return token
  }

  const escucharMensajes = (onMessageReceived) => {
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
