import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useDescuentoGlobalStore } from '../stores/cartStores.js'

let unsub = null

export function cargarDescuentoGlobal() {
  if (unsub) return
  const descuentoGlobalStore = useDescuentoGlobalStore()
  unsub = onSnapshot(doc(db, 'descuento_global', 'descuento_glbl'), (snap) => {
    const data = snap.exists() ? snap.data() : {}
    descuentoGlobalStore.activo = !!data.estado
    descuentoGlobalStore.porcentaje = Number(data.descuento) || 0
  }, (error) => {
    console.error('Error escuchando descuento global:', error)
  })
}
