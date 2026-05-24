const functions = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp()

const db = admin.firestore()

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000
const RATE_LIMIT_MAX = 3

exports.createOrder = functions.https.onCall(async (data, context) => {
  const pedidoData = data.pedido
  const email = context.auth?.token?.email || null
  const uid = context.auth?.uid || null
  const ip = context.rawRequest?.ip
  const rateKey = email || ip || 'unknown'

  const cincoMinAtras = new Date(Date.now() - RATE_LIMIT_WINDOW_MS)
  const recent = await db.collection('pedidos')
    .where('usuario', '==', rateKey)
    .where('creadoEn', '>', cincoMinAtras)
    .get()

  if (recent.size >= RATE_LIMIT_MAX) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Demasiados pedidos en poco tiempo. Esperá unos minutos e intentá de nuevo.'
    )
  }

  const order = {
    ...pedidoData,
    usuario: email || 'Anónimo',
    creadoEn: admin.firestore.Timestamp.now()
  }

  const docRef = await db.collection('pedidos').add(order)

  if (uid && pedidoData.puntosCanjeados > 0) {
    const clientRef = db.collection('clientes').doc(uid)
    const clientSnap = await clientRef.get()

    if (clientSnap.exists) {
      const puntosActuales = clientSnap.data().puntos || 0
      if (puntosActuales >= pedidoData.puntosCanjeados) {
        await clientRef.update({
          puntos: admin.firestore.FieldValue.increment(-pedidoData.puntosCanjeados)
        })
      }
    }
  }

  return { id: docRef.id }
})
