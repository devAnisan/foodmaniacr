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
  if (distanciaKm <= 1.5) return 1000
  if (distanciaKm <= 2) return 1300
  if (distanciaKm <= 2.5) return 1500
  if (distanciaKm <= 3) return 1800
  if (distanciaKm <= 4) return 2000
  if (distanciaKm <= 5) return 2200
  if (distanciaKm <= 6) return 2300
  if (distanciaKm <= 7) return 2500
  if (distanciaKm <= 8) return 2700
  if (distanciaKm <= 9) return 3000
  if (distanciaKm <= 10) return 3500
  return Math.round(distanciaKm * 350)
}

function descripcionTarifaEnvio(distanciaKm) {
  if (distanciaKm <= 0) return ''
  if (distanciaKm <= 1.5) return '0–1.5 km'
  if (distanciaKm <= 2) return '1.5–2 km'
  if (distanciaKm <= 2.5) return '2–2.5 km'
  if (distanciaKm <= 3) return '2.5–3 km'
  if (distanciaKm <= 4) return '3–4 km'
  if (distanciaKm <= 5) return '4–5 km'
  if (distanciaKm <= 6) return '5–6 km'
  if (distanciaKm <= 7) return '6–7 km'
  if (distanciaKm <= 8) return '7–8 km'
  if (distanciaKm <= 9) return '8–9 km'
  if (distanciaKm <= 10) return '9–10 km'
  return `${distanciaKm} km — tarifa larga distancia`
}

function esDiaDoble(fecha = new Date()) {
  const crDate = new Date(fecha.getTime() - 6 * 60 * 60 * 1000)
  const dia = crDate.getUTCDay()
  return dia === 0 || dia === 2
}

function nombreDiaDoble(fecha = new Date()) {
  const crDate = new Date(fecha.getTime() - 6 * 60 * 60 * 1000)
  const dia = crDate.getUTCDay()
  if (dia === 0) return 'Domingo FoodManiacos'
  if (dia === 2) return 'Martes FoodManiacos'
  return null
}

function precioConDescuentoProducto(precio, descuentoProducto) {
  const descuento = Number(descuentoProducto) || 0
  if (descuento <= 0) return precio
  return Math.round(precio * (1 - descuento / 100))
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

function calculateOrderTotals(items, distanciaKm, withDrawType, agrandarMap, agrandarPuntosMap, bebidaPuntosMap, descuentoGlobal = { activo: false, porcentaje: 0 }) {
  const AGRANDAR_COSTO = 500
  const descuentoGlobalActivo = !!descuentoGlobal?.activo

  const baseCashTotal = items.reduce((acc, item) => {
    if (item.esCanje) return acc
    const precio = descuentoGlobalActivo
      ? Number(item.precio)
      : precioConDescuentoProducto(Number(item.precio), item.descuento)
    return acc + precio * Number(item.cantidad)
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

  const cashTotalSinDescuento = baseCashTotal + totalBebidasCash + totalAgrandarCash
  const porcentajeDescuentoGlobal = Number(descuentoGlobal?.porcentaje) || 0
  const cashTotalSinEnvio = descuentoGlobalActivo && porcentajeDescuentoGlobal > 0
    ? Math.round(cashTotalSinDescuento * (1 - porcentajeDescuentoGlobal / 100))
    : cashTotalSinDescuento
  const montoDescuento = cashTotalSinDescuento - cashTotalSinEnvio
  const costoEnvio = withDrawType === 'domicilio' ? calcularTarifaEnvio(distanciaKm) : 0
  const totalConEnvio = cashTotalSinEnvio + costoEnvio
  const coinsGanados = coinsAGanar(cashTotalSinEnvio)

  return {
    baseCashTotal,
    totalBebidasCash,
    totalAgrandarCash,
    cashTotalSinEnvio,
    montoDescuento,
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
  esDiaDoble,
  nombreDiaDoble,
  esPromocionActiva,
  precioConDescuentoProducto,
  calculateOrderTotals,
  COLONES_POR_COIN,
  COIN_COSTOS,
  NIVELES,
}
