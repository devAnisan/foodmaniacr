const admin = require('firebase-admin')

const COLONES_POR_COIN = 100
const MES_EN_MS = 30 * 24 * 60 * 60 * 1000
const SEIS_MESES_EN_MS = 6 * MES_EN_MS

const NIVELES = [
  { nombre: 'Rookie', coinsMin: 500, beneficios: 'Acceso al sistema de recompensas', mantenimiento: 'Siempre', diasMax: Infinity },
  { nombre: 'Maniatico', coinsMin: 1000, beneficios: 'Multiplicadores de coins, promociones exclusivas', mantenimiento: '1 compra/mes', diasMax: 30 },
  { nombre: 'Supremo', coinsMin: 2000, beneficios: 'Prioridad en promociones, coins extras, 10% desc.', mantenimiento: '1 compra/15 días', diasMax: 15 },
  { nombre: 'Rey FoodMania', coinsMin: 3000, beneficios: 'Promos VIP, productos exclusivos, regalías', mantenimiento: '1 compra/semana', diasMax: 7 },
]

const COIN_COSTOS = {
  AGRANDAR: 100,
  BEBIDA_REGULAR: 150,
  BEBIDA_GRANDE: 300,
}

function coinsAGanar(cashTotal) {
  return Math.floor(cashTotal / COLONES_POR_COIN)
}

function costoBebidaManiaCoins(precioBebida) {
  return precioBebida >= 2500 ? COIN_COSTOS.BEBIDA_GRANDE : COIN_COSTOS.BEBIDA_REGULAR
}

function obtenerCoinsValidos(coins, ultimaGananciaCoins) {
  if (!coins || coins <= 0) return 0
  if (!ultimaGananciaCoins) return coins
  const ahora = Date.now()
  const ultimaGanancia = ultimaGananciaCoins.toMillis ? ultimaGananciaCoins.toMillis() : new Date(ultimaGananciaCoins).getTime()
  if (ahora - ultimaGanancia > SEIS_MESES_EN_MS) return 0
  return coins
}

function calcularTarifaEnvio(distanciaKm) {
  if (distanciaKm <= 0) return 0
  if (distanciaKm <= 1) return 1000
  if (distanciaKm <= 3) return 1600
  if (distanciaKm <= 5) return 2000
  if (distanciaKm <= 8) return 2500
  if (distanciaKm <= 12) return 3500
  return 3500 + Math.ceil(distanciaKm - 12) * 300
}

function descripcionTarifaEnvio(distanciaKm) {
  if (distanciaKm <= 0) return ''
  if (distanciaKm <= 1) return '0–1 km'
  if (distanciaKm <= 3) return '1–3 km'
  if (distanciaKm <= 5) return '3–5 km'
  if (distanciaKm <= 8) return '5–8 km'
  if (distanciaKm <= 12) return '8–12 km'
  const extra = Math.ceil(distanciaKm - 12)
  return `12 km+ (${extra} km adicionales)`
}

function esPromocionActiva(nombreProducto) {
  const hoy = new Date().getDay()

  const reglas = {
    '2X1 Tacos':        hoy === 2,
    '2X1 Nachos':       hoy === 1,
    '2 Enteros':        true,
    'Jueves de Alitas': hoy === 4,
    '3X2 Enteros':      hoy === 3,
  }

  return reglas[nombreProducto] ?? false
}

function calculateOrderTotals(items, distanciaKm, withDrawType, agrandarMap, agrandarPuntosMap, bebidaPuntosMap) {
  const AGRANDAR_COSTO = 500

  const baseCashTotal = items.reduce((acc, item) => {
    if (item.esCanje) return acc
    return acc + Number(item.precio) * Number(item.cantidad)
  }, 0)

  const totalBebidasCash = items.reduce((acc, item) => {
    const uid = item._uid || item.id
    if (item.bebida && !bebidaPuntosMap[uid]) {
      return acc + (Number(item.bebida.precio) * Number(item.cantidad))
    }
    return acc
  }, 0)

  const totalAgrandarCash = items.reduce((acc, item) => {
    const uid = item._uid || item.id
    if (agrandarMap[uid] && !agrandarPuntosMap[uid]) {
      return acc + (AGRANDAR_COSTO * Number(item.cantidad))
    }
    return acc
  }, 0)

  const cashTotalSinEnvio = baseCashTotal + totalBebidasCash + totalAgrandarCash
  const costoEnvio = withDrawType === 'domicilio' ? calcularTarifaEnvio(distanciaKm) : 0
  const totalConEnvio = cashTotalSinEnvio + costoEnvio
  const coinsGanados = coinsAGanar(cashTotalSinEnvio)

  return {
    baseCashTotal,
    totalBebidasCash,
    totalAgrandarCash,
    cashTotalSinEnvio,
    costoEnvio,
    totalConEnvio,
    coinsGanados,
    descripcionEnvio: descripcionTarifaEnvio(distanciaKm),
  }
}

module.exports = {
  coinsAGanar,
  costoBebidaManiaCoins,
  obtenerCoinsValidos,
  calcularTarifaEnvio,
  descripcionTarifaEnvio,
  esPromocionActiva,
  calculateOrderTotals,
  COLONES_POR_COIN,
  COIN_COSTOS,
  NIVELES,
}
