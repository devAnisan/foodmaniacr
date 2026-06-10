// Sistema ManiaCoins — Foodmania CR

export const COLONES_POR_COIN = 100
export const MES_EN_MS = 30 * 24 * 60 * 60 * 1000
const SEIS_MESES_EN_MS = 6 * MES_EN_MS

export const NIVELES = [
  { nombre: 'Rookie', coinsMin: 500, beneficios: 'Acceso al sistema de recompensas', mantenimiento: 'Siempre', diasMax: Infinity },
  { nombre: 'Maniatico', coinsMin: 1000, beneficios: 'Multiplicadores de coins, promociones exclusivas', mantenimiento: '1 compra/mes', diasMax: 30 },
  { nombre: 'Supremo', coinsMin: 2000, beneficios: 'Prioridad en promociones, coins extras, 10% desc.', mantenimiento: '1 compra/15 días', diasMax: 15 },
  { nombre: 'Rey FoodMania', coinsMin: 3000, beneficios: 'Promos VIP, productos exclusivos, regalías', mantenimiento: '1 compra/semana', diasMax: 7 },
]

export const COIN_COSTOS = {
  AGRANDAR: 100,
  BEBIDA_REGULAR: 150,
  BEBIDA_GRANDE: 300,
}

export const obtenerCoinsValidos = (coins, ultimaGananciaCoins) => {
  if (!coins || coins <= 0) return 0
  if (!ultimaGananciaCoins) return coins
  const ahora = Date.now()
  const ultimaGanancia = ultimaGananciaCoins.toMillis ? ultimaGananciaCoins.toMillis() : new Date(ultimaGananciaCoins).getTime()
  if (ahora - ultimaGanancia > SEIS_MESES_EN_MS) return 0
  return coins
}

export const obtenerNivel = (coins) => {
  if (!coins || coins < 500) return null
  for (let i = NIVELES.length - 1; i >= 0; i--) {
    if (coins >= NIVELES[i].coinsMin) return NIVELES[i]
  }
  return null
}

export const obtenerNivelReal = (coins, ultimaGananciaCoins, ultimaCompra) => {
  const coinsValidos = obtenerCoinsValidos(coins, ultimaGananciaCoins)
  if (coinsValidos < 500) return null

  const ahora = Date.now()
  const ultimaCompraMs = ultimaCompra
    ? (ultimaCompra.toMillis ? ultimaCompra.toMillis() : new Date(ultimaCompra).getTime())
    : 0
  const diasDesdeUltimaCompra = ultimaCompraMs ? (ahora - ultimaCompraMs) / (24 * 60 * 60 * 1000) : Infinity

  for (let i = NIVELES.length - 1; i >= 0; i--) {
    const nivel = NIVELES[i]
    if (coinsValidos >= nivel.coinsMin && diasDesdeUltimaCompra <= nivel.diasMax) {
      return nivel
    }
  }
  return null
}

export const obtenerSiguienteNivel = (coins, ultimaGananciaCoins) => {
  const coinsValidos = obtenerCoinsValidos(coins, ultimaGananciaCoins)
  if (!coinsValidos) return { ...NIVELES[0], coinsFaltantes: NIVELES[0].coinsMin }
  for (const nivel of NIVELES) {
    if (coinsValidos < nivel.coinsMin) return { ...nivel, coinsFaltantes: nivel.coinsMin - coinsValidos }
  }
  return null
}

export const obtenerNivelProximo = (coins, ultimaGananciaCoins, ultimaCompra) => {
  const nivelActual = obtenerNivelReal(coins, ultimaGananciaCoins, ultimaCompra)
  if (!nivelActual) return NIVELES[0]

  const idx = NIVELES.indexOf(nivelActual)
  if (idx < NIVELES.length - 1) return NIVELES[idx + 1]
  return null
}

export const costoEnManiaCoins = (precio) => {
  if (precio <= 2000) return 150
  if (precio <= 5000) return 300
  if (precio <= 8000) return 600
  if (precio <= 12000) return 1000
  return 1500
}

export const costoBebidaManiaCoins = (precioBebida) => {
  return precioBebida >= 2500 ? COIN_COSTOS.BEBIDA_GRANDE : COIN_COSTOS.BEBIDA_REGULAR
}

export const obtenerTiempoRestanteExpiracion = (ultimaGananciaCoins) => {
  if (!ultimaGananciaCoins) return null
  const ahora = Date.now()
  const ultimaGanancia = ultimaGananciaCoins.toMillis ? ultimaGananciaCoins.toMillis() : new Date(ultimaGananciaCoins).getTime()
  const tiempoTranscurrido = ahora - ultimaGanancia
  if (tiempoTranscurrido >= SEIS_MESES_EN_MS) return null

  const tiempoRestante = SEIS_MESES_EN_MS - tiempoTranscurrido
  const meses = Math.floor(tiempoRestante / MES_EN_MS)
  const dias = Math.floor((tiempoRestante % MES_EN_MS) / (24 * 60 * 60 * 1000))
  if (meses === 0 && dias === 0) return 'menos de 1 día'
  if (meses === 0) return `${dias} día${dias !== 1 ? 's' : ''}`
  if (dias === 0) return `${meses} mes${meses !== 1 ? 'es' : ''}`
  return `${meses} mes${meses !== 1 ? 'es' : ''} y ${dias} día${dias !== 1 ? 's' : ''}`
}

export const coinsAGanar = (cashTotal) => {
  return Math.floor(cashTotal / COLONES_POR_COIN)
}

export const BONUS_CUMPLEANOS = 100

export const esCumpleanos = (cumpleanos) => {
  if (!cumpleanos) return false
  const hoy = new Date()
  const [, mes, dia] = cumpleanos.split('-')
  return hoy.getMonth() + 1 === parseInt(mes) && hoy.getDate() === parseInt(dia)
}

export const formatearCumpleanos = (cumpleanos) => {
  if (!cumpleanos) return ''
  const [ano, mes, dia] = cumpleanos.split('-')
  return `${dia}/${mes}/${ano}`
}
