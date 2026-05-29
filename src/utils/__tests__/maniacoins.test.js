import { describe, it, expect } from 'vitest'
import {
  obtenerNivel, obtenerSiguienteNivel, obtenerNivelReal, obtenerCoinsValidos,
  obtenerTiempoRestanteExpiracion,
  costoEnManiaCoins, costoBebidaManiaCoins, coinsAGanar, NIVELES, COLONES_POR_COIN,
  MES_EN_MS
} from '../maniacoins'

const mockTimestamp = (ms) => {
  if (ms === undefined) return undefined
  return { toMillis: () => ms }
}

describe('coinsAGanar', () => {
  it('earns 1 coin per ₡100', () => {
    expect(coinsAGanar(100)).toBe(1)
    expect(coinsAGanar(200)).toBe(2)
    expect(coinsAGanar(150)).toBe(1)
    expect(coinsAGanar(0)).toBe(0)
    expect(coinsAGanar(9999)).toBe(99)
  })
})

describe('costoEnManiaCoins', () => {
  it('returns 150 for items ≤ ₡2000', () => {
    expect(costoEnManiaCoins(1500)).toBe(150)
    expect(costoEnManiaCoins(2000)).toBe(150)
  })
  it('returns 300 for items ₡2001-5000', () => {
    expect(costoEnManiaCoins(2500)).toBe(300)
    expect(costoEnManiaCoins(5000)).toBe(300)
  })
  it('returns 600 for items ₡5001-8000', () => {
    expect(costoEnManiaCoins(6000)).toBe(600)
    expect(costoEnManiaCoins(8000)).toBe(600)
  })
  it('returns 1000 for items ₡8001-12000', () => {
    expect(costoEnManiaCoins(9000)).toBe(1000)
    expect(costoEnManiaCoins(12000)).toBe(1000)
  })
  it('returns 1500 for items over ₡12000', () => {
    expect(costoEnManiaCoins(15000)).toBe(1500)
    expect(costoEnManiaCoins(999999)).toBe(1500)
  })
})

describe('costoBebidaManiaCoins', () => {
  it('returns 150 for regular bebidas (< ₡2500)', () => {
    expect(costoBebidaManiaCoins(1000)).toBe(150)
    expect(costoBebidaManiaCoins(2499)).toBe(150)
  })
  it('returns 300 for large bebidas (≥ ₡2500)', () => {
    expect(costoBebidaManiaCoins(2500)).toBe(300)
    expect(costoBebidaManiaCoins(3000)).toBe(300)
  })
})

describe('obtenerNivel', () => {
  it('returns null for < 500 coins', () => {
    expect(obtenerNivel(0)).toBeNull()
    expect(obtenerNivel(499)).toBeNull()
  })
  it('returns Rookie for 500-999 coins', () => {
    expect(obtenerNivel(500).nombre).toBe('Rookie')
    expect(obtenerNivel(999).nombre).toBe('Rookie')
  })
  it('returns Maniatico for 1000-1999 coins', () => {
    expect(obtenerNivel(1000).nombre).toBe('Maniatico')
    expect(obtenerNivel(1999).nombre).toBe('Maniatico')
  })
  it('returns Supremo for 2000-2999 coins', () => {
    expect(obtenerNivel(2000).nombre).toBe('Supremo')
    expect(obtenerNivel(2999).nombre).toBe('Supremo')
  })
  it('returns Rey FoodMania for 3000+ coins', () => {
    expect(obtenerNivel(3000).nombre).toBe('Rey FoodMania')
    expect(obtenerNivel(9999).nombre).toBe('Rey FoodMania')
  })
})

describe('obtenerSiguienteNivel', () => {
  const reciente = Date.now()
  const mockReciente = { toMillis: () => reciente }

  it('returns first level for 0 coins', () => {
    const next = obtenerSiguienteNivel(0)
    expect(next.nombre).toBe('Rookie')
    expect(next.coinsFaltantes).toBe(500)
  })
  it('returns Maniatico for Rookie', () => {
    const next = obtenerSiguienteNivel(500, mockReciente)
    expect(next.nombre).toBe('Maniatico')
    expect(next.coinsFaltantes).toBe(500)
  })
  it('returns null for max level', () => {
    expect(obtenerSiguienteNivel(3000, mockReciente)).toBeNull()
  })
})

describe('obtenerCoinsValidos', () => {
  const ahora = Date.now()

  it('returns 0 if no coins', () => {
    expect(obtenerCoinsValidos(0, mockTimestamp(ahora))).toBe(0)
    expect(obtenerCoinsValidos(null, mockTimestamp(ahora))).toBe(0)
  })

  it('returns coins if no ultimaGananciaCoins (unknown age, assume valid)', () => {
    expect(obtenerCoinsValidos(1000, null)).toBe(1000)
    expect(obtenerCoinsValidos(1000, undefined)).toBe(1000)
  })

  it('returns coins if earned less than 6 months ago', () => {
    const haceUnMes = ahora - MES_EN_MS
    expect(obtenerCoinsValidos(1000, mockTimestamp(haceUnMes))).toBe(1000)
  })

  it('returns 0 if earned more than 6 months ago', () => {
    const hace7Meses = ahora - 7 * MES_EN_MS
    expect(obtenerCoinsValidos(1000, mockTimestamp(hace7Meses))).toBe(0)
  })

  it('returns coins if earned just under 6 months ago', () => {
    const hace6Menos1Hora = ahora - 6 * MES_EN_MS + 60 * 60 * 1000
    expect(obtenerCoinsValidos(1000, mockTimestamp(hace6Menos1Hora))).toBe(1000)
  })
})

describe('obtenerTiempoRestanteExpiracion', () => {
  it('returns null if no ultimaGananciaCoins', () => {
    expect(obtenerTiempoRestanteExpiracion(null)).toBeNull()
    expect(obtenerTiempoRestanteExpiracion(undefined)).toBeNull()
  })
  it('returns null if already expired', () => {
    const hace7Meses = Date.now() - 7 * MES_EN_MS
    expect(obtenerTiempoRestanteExpiracion({ toMillis: () => hace7Meses })).toBeNull()
  })
  it('returns meses for future expiry', () => {
    const hace2Meses = Date.now() - 2 * MES_EN_MS
    const result = obtenerTiempoRestanteExpiracion({ toMillis: () => hace2Meses })
    expect(result).toMatch(/4 mes/)
  })
  it('returns days for short remaining time', () => {
    const hace5Meses20Dias = Date.now() - (5 * MES_EN_MS + 20 * 24 * 60 * 60 * 1000)
    const result = obtenerTiempoRestanteExpiracion({ toMillis: () => hace5Meses20Dias })
    expect(result).toMatch(/día/)
  })
  it('returns "menos de 1 día" for near-expiry', () => {
    const casi6Meses = Date.now() - 6 * MES_EN_MS + 60 * 60 * 1000
    expect(obtenerTiempoRestanteExpiracion({ toMillis: () => casi6Meses })).toBe('menos de 1 día')
  })
})

describe('obtenerNivelReal', () => {
  const ahora = Date.now()
  const hoy = mockTimestamp(ahora)
  const hace5Dias = mockTimestamp(ahora - 5 * 24 * 60 * 60 * 1000)
  const hace20Dias = mockTimestamp(ahora - 20 * 24 * 60 * 60 * 1000)
  const hace60Dias = mockTimestamp(ahora - 60 * 24 * 60 * 60 * 1000)

  it('returns null if coins expired', () => {
    const hace7Meses = mockTimestamp(ahora - 7 * MES_EN_MS)
    expect(obtenerNivelReal(1000, hace7Meses, hoy)).toBeNull()
  })

  it('returns Rookie regardless of ultimaCompra', () => {
    expect(obtenerNivelReal(500, hoy, null)).not.toBeNull()
    expect(obtenerNivelReal(500, hoy, null).nombre).toBe('Rookie')
  })

  it('returns Maniatico if purchase within 30 days', () => {
    const nivel = obtenerNivelReal(1000, hoy, hace5Dias)
    expect(nivel.nombre).toBe('Maniatico')
  })

  it('downgrades Maniatico to Rookie if no purchase in 30+ days', () => {
    const nivel = obtenerNivelReal(1000, hoy, hace60Dias)
    expect(nivel.nombre).toBe('Rookie')
  })

  it('returns Supremo if purchase within 15 days', () => {
    const nivel = obtenerNivelReal(2000, hoy, hace5Dias)
    expect(nivel.nombre).toBe('Supremo')
  })

  it('downgrades Supremo to Maniatico if purchase > 15 days ago but < 30', () => {
    const nivel = obtenerNivelReal(2000, hoy, hace20Dias)
    expect(nivel.nombre).toBe('Maniatico')
  })

  it('returns Rey FoodMania if purchase within 7 days', () => {
    const nivel = obtenerNivelReal(3000, hoy, hace5Dias)
    expect(nivel.nombre).toBe('Rey FoodMania')
  })

  it('downgrades Rey to Supremo if purchase > 7 days ago but < 15', () => {
    const hace10Dias = mockTimestamp(ahora - 10 * 24 * 60 * 60 * 1000)
    const nivel = obtenerNivelReal(3000, hoy, hace10Dias)
    expect(nivel.nombre).toBe('Supremo')
  })
})
