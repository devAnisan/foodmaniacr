import { describe, it, expect } from 'vitest'
import { calcDistance, calcularTarifaEnvio, descripcionTarifaEnvio } from '../saberDistancia'

describe('calcularTarifaEnvio', () => {
  it('returns 0 for 0 km', () => {
    expect(calcularTarifaEnvio(0)).toBe(0)
  })

  it('charges ₡1,000 for 0–1 km', () => {
    expect(calcularTarifaEnvio(0.5)).toBe(1000)
    expect(calcularTarifaEnvio(1)).toBe(1000)
  })

  it('charges ₡1,600 for 1–3 km', () => {
    expect(calcularTarifaEnvio(1.1)).toBe(1600)
    expect(calcularTarifaEnvio(2)).toBe(1600)
    expect(calcularTarifaEnvio(3)).toBe(1600)
  })

  it('charges ₡2,000 for 3–5 km', () => {
    expect(calcularTarifaEnvio(3.1)).toBe(2000)
    expect(calcularTarifaEnvio(4)).toBe(2000)
    expect(calcularTarifaEnvio(5)).toBe(2000)
  })

  it('charges ₡2,500 for 5–8 km', () => {
    expect(calcularTarifaEnvio(5.1)).toBe(2500)
    expect(calcularTarifaEnvio(6.5)).toBe(2500)
    expect(calcularTarifaEnvio(8)).toBe(2500)
  })

  it('charges ₡3,500 for 8–12 km', () => {
    expect(calcularTarifaEnvio(8.1)).toBe(3500)
    expect(calcularTarifaEnvio(10)).toBe(3500)
    expect(calcularTarifaEnvio(12)).toBe(3500)
  })

  it('charges ₡3,500 + ₡300/km beyond 12 km', () => {
    expect(calcularTarifaEnvio(12.1)).toBe(3500 + 300)
    expect(calcularTarifaEnvio(13)).toBe(3500 + 300)
    expect(calcularTarifaEnvio(14)).toBe(3500 + 600)
    expect(calcularTarifaEnvio(20)).toBe(3500 + 2400)
  })
})

describe('descripcionTarifaEnvio', () => {
  it('returns empty for 0 km', () => {
    expect(descripcionTarifaEnvio(0)).toBe('')
  })

  it('describes each tier correctly', () => {
    expect(descripcionTarifaEnvio(0.5)).toBe('0–1 km')
    expect(descripcionTarifaEnvio(2)).toBe('1–3 km')
    expect(descripcionTarifaEnvio(4)).toBe('3–5 km')
    expect(descripcionTarifaEnvio(6.5)).toBe('5–8 km')
    expect(descripcionTarifaEnvio(10)).toBe('8–12 km')
    expect(descripcionTarifaEnvio(15)).toContain('km adicionales')
  })
})

describe('calcDistance', () => {
  it('returns 0 for the same point', () => {
    const d = calcDistance(9.9345, -84.0786, 9.9345, -84.0786)
    expect(d).toBe(0)
  })

  it('calculates distance between San José and Alajuela (~17km)', () => {
    const d = calcDistance(9.9345, -84.0786, 10.0169, -84.2141)
    expect(d).toBeGreaterThan(15)
    expect(d).toBeLessThan(20)
  })

  it('calculates distance between San José and Heredia (~11km)', () => {
    const d = calcDistance(9.9345, -84.0786, 9.9986, -84.1168)
    expect(d).toBeGreaterThan(8)
    expect(d).toBeLessThan(14)
  })

  it('handles negative coordinates (southern hemisphere)', () => {
    const d = calcDistance(-33.8688, 151.2093, -33.8688, 151.2093)
    expect(d).toBe(0)
  })
})
