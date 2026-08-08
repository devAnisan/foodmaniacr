import { readFileSync, writeFileSync } from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

// ── Auditoría ManiaCoins pre-lanzamiento ────────────────────────────────────
// Solo LECTURA. No modifica clientes ni pedidos.
//
// Objetivo:
//  1. Clientes con puntos > 0 que no tienen NINGÚN pedido desde el estreno.
//  2. Clientes cuyo saldo actual de puntos excede lo que sus pedidos reales
//     desde el estreno podrían haber generado (indicio de coins de pruebas
//     pre-lanzamiento que nunca se limpiaron).
//
// Ejecutar: node scripts/auditoria-maniacoins.mjs

const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json'
const LANZAMIENTO_OFICIAL = new Date('2026-08-03T06:00:00.000Z') // 00:00 CR, igual a functions/index.js

async function main() {
  const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'))
  const app = initializeApp({ credential: cert(serviceAccount) })
  const db = getFirestore(app)

  console.log(`Lanzamiento oficial: ${LANZAMIENTO_OFICIAL.toISOString()}\n`)

  const [clientesSnap, pedidosSnap] = await Promise.all([
    db.collection('clientes').get(),
    db.collection('pedidos').get(),
  ])

  console.log(`Clientes totales: ${clientesSnap.size}`)
  console.log(`Pedidos totales en la colección: ${pedidosSnap.size}\n`)

  // Agrupar pedidos por email de usuario
  const pedidosPorEmail = new Map()
  let pedidosAntesDeLanzamiento = 0

  pedidosSnap.forEach(doc => {
    const d = doc.data()
    const email = d.usuario
    if (!email || email === 'Anónimo') return

    const creadoEnMs = d.creadoEn?.toMillis ? d.creadoEn.toMillis() : null
    if (creadoEnMs && creadoEnMs < LANZAMIENTO_OFICIAL.getTime()) {
      pedidosAntesDeLanzamiento++
    }

    if (!pedidosPorEmail.has(email)) pedidosPorEmail.set(email, [])
    pedidosPorEmail.get(email).push({
      id: doc.id,
      estado: d.estado || null,
      total: Number(d.total) || 0,
      puntosGanados: Number(d.puntosGanados) || 0,
      puntosCanjeados: Number(d.puntosCanjeados) || 0,
      creadoEnMs,
    })
  })

  if (pedidosAntesDeLanzamiento > 0) {
    console.log(`⚠️  ${pedidosAntesDeLanzamiento} pedido(s) en la colección tienen creadoEn ANTES del lanzamiento (revisar aparte).\n`)
  }

  const clientesConCoins = clientesSnap.docs
    .map(doc => ({ uid: doc.id, ...doc.data() }))
    .filter(c => (Number(c.puntos) || 0) > 0)

  console.log(`Clientes con puntos > 0: ${clientesConCoins.length}\n`)

  const sinPedidosDesdeEstreno = []
  const conDiscrepancia = []
  const detalleTodos = []

  for (const cliente of clientesConCoins) {
    const email = cliente.email || null
    const puntosActuales = Number(cliente.puntos) || 0
    const pedidosDelCliente = email ? (pedidosPorEmail.get(email) || []) : []

    const totalPedidos = pedidosDelCliente.length
    const pedidosFinalizados = pedidosDelCliente.filter(p => p.estado === 'finalizado')
    const sumaPuntosGanados = pedidosFinalizados.reduce((acc, p) => acc + p.puntosGanados, 0)
    const sumaPuntosCanjeados = pedidosDelCliente.reduce((acc, p) => acc + p.puntosCanjeados, 0)
    const saldoEsperado = sumaPuntosGanados - sumaPuntosCanjeados
    const discrepancia = puntosActuales - saldoEsperado

    const fila = {
      uid: cliente.uid,
      email,
      puntosActuales,
      totalPedidos,
      pedidosFinalizados: pedidosFinalizados.length,
      sumaPuntosGanados,
      sumaPuntosCanjeados,
      saldoEsperado,
      discrepancia,
    }
    detalleTodos.push(fila)

    if (totalPedidos === 0) {
      sinPedidosDesdeEstreno.push(fila)
    } else if (discrepancia > 0) {
      conDiscrepancia.push(fila)
    }
  }

  sinPedidosDesdeEstreno.sort((a, b) => b.puntosActuales - a.puntosActuales)
  conDiscrepancia.sort((a, b) => b.discrepancia - a.discrepancia)

  console.log('════════════════════════════════════════════════════════════')
  console.log(`1) SIN PEDIDOS DESDE EL ESTRENO — ${sinPedidosDesdeEstreno.length} cliente(s)`)
  console.log('════════════════════════════════════════════════════════════')
  sinPedidosDesdeEstreno.forEach(f => {
    console.log(`  ${(f.email || f.uid).padEnd(35)} puntos=${f.puntosActuales}`)
  })

  console.log('\n════════════════════════════════════════════════════════════')
  console.log(`2) DISCREPANCIA (puntos > lo que explican sus pedidos reales) — ${conDiscrepancia.length} cliente(s)`)
  console.log('════════════════════════════════════════════════════════════')
  conDiscrepancia.forEach(f => {
    console.log(`  ${(f.email || f.uid).padEnd(35)} puntos=${f.puntosActuales}  pedidos=${f.totalPedidos} (finalizados=${f.pedidosFinalizados})  esperado=${f.saldoEsperado}  discrepancia=+${f.discrepancia}`)
  })

  const salida = {
    generadoEn: new Date().toISOString(),
    lanzamientoOficial: LANZAMIENTO_OFICIAL.toISOString(),
    totales: {
      clientes: clientesSnap.size,
      pedidos: pedidosSnap.size,
      pedidosAntesDeLanzamiento,
      clientesConCoins: clientesConCoins.length,
    },
    sinPedidosDesdeEstreno,
    conDiscrepancia,
    detalleTodos,
  }

  const outPath = './scripts/auditoria-maniacoins-resultado.json'
  writeFileSync(outPath, JSON.stringify(salida, null, 2))
  console.log(`\nResultado completo guardado en ${outPath}`)
}

main().catch(console.error)
