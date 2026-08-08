import { readFileSync } from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

// ── Corrección manual — ManiaCoins de pruebas pre-lanzamiento ──────────────
// Decisión tomada el 2026-08-06 tras la auditoría (ver scripts/auditoria-maniacoins.mjs):
// hernandezyasiel211@gmail.com tenía 924 puntos sin ningún pedido desde el estreno
// (3 de agosto) — coins de pedidos de prueba previos al lanzamiento. Se resetea a 0.
//
// Ejecutar: node scripts/corregir-puntos-pretest.mjs

const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json'
const UID = 'USID6jbuJwVMvUjNsvxL6QZKdd12'
const EMAIL_ESPERADO = 'hernandezyasiel211@gmail.com'
const PUNTOS_ESPERADOS_ANTES = 924
const PUNTOS_NUEVOS = 0

async function main() {
  const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'))
  const app = initializeApp({ credential: cert(serviceAccount) })
  const db = getFirestore(app)

  const clienteRef = db.collection('clientes').doc(UID)
  const snap = await clienteRef.get()

  if (!snap.exists) {
    console.error(`❌ No existe clientes/${UID}`)
    return
  }

  const data = snap.data()
  if (data.email !== EMAIL_ESPERADO) {
    console.error(`❌ Email no coincide. Esperado: ${EMAIL_ESPERADO}, encontrado: ${data.email}`)
    return
  }

  const puntosActuales = Number(data.puntos) || 0
  if (puntosActuales !== PUNTOS_ESPERADOS_ANTES) {
    console.error(`❌ Los puntos actuales (${puntosActuales}) no coinciden con lo esperado (${PUNTOS_ESPERADOS_ANTES}). Abortando por seguridad — revisar manualmente.`)
    return
  }

  await clienteRef.update({ puntos: PUNTOS_NUEVOS })

  await db.collection('auditLogs').add({
    accion: 'correccion_manual_puntos',
    clienteUid: UID,
    clienteEmail: EMAIL_ESPERADO,
    puntosAnterior: puntosActuales,
    puntosNuevo: PUNTOS_NUEVOS,
    motivo: 'ManiaCoins de pedidos de prueba anteriores al lanzamiento (3 de agosto) — cliente sin pedidos reales desde el estreno.',
    ejecutadoPor: 'dmejia@gruposervica.com',
    creadoEn: Timestamp.now(),
  })

  console.log(`✅ clientes/${UID} (${EMAIL_ESPERADO}): puntos ${puntosActuales} → ${PUNTOS_NUEVOS}`)
  console.log('✅ Registro agregado a auditLogs.')
}

main().catch(console.error)
