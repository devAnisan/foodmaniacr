import { describe, it, expect } from 'vitest'
import { calcDistance, calcularTarifaEnvio, descripcionTarifaEnvio } from '../saberDistancia'

describe('calcularTarifaEnvio', () => {
  it('returns 0 for 0 km', () => {
    expect(calcularTarifaEnvio(0)).toBe(0)
  })

  it('charges ₡1,000 for 0–1.5 km', () => {
    expect(calcularTarifaEnvio(0.5)).toBe(1000)
    expect(calcularTarifaEnvio(1.5)).toBe(1000)
  })

  it('charges ₡1,300 for 1.5–2 km', () => {
    expect(calcularTarifaEnvio(1.6)).toBe(1300)
    expect(calcularTarifaEnvio(2)).toBe(1300)
  })

  it('charges ₡1,500 for 2–2.5 km', () => {
    expect(calcularTarifaEnvio(2.1)).toBe(1500)
    expect(calcularTarifaEnvio(2.5)).toBe(1500)
  })

  it('charges ₡1,800 for 2.5–3 km', () => {
    expect(calcularTarifaEnvio(2.6)).toBe(1800)
    expect(calcularTarifaEnvio(3)).toBe(1800)
  })

  it('charges ₡2,000 for 3–4 km', () => {
    expect(calcularTarifaEnvio(3.1)).toBe(2000)
    expect(calcularTarifaEnvio(4)).toBe(2000)
  })

  it('charges ₡2,200 for 4–5 km', () => {
    expect(calcularTarifaEnvio(4.1)).toBe(2200)
    expect(calcularTarifaEnvio(5)).toBe(2200)
  })

  it('charges ₡2,300 for 5–6 km', () => {
    expect(calcularTarifaEnvio(5.1)).toBe(2300)
    expect(calcularTarifaEnvio(6)).toBe(2300)
  })

  it('charges ₡2,500 for 6–7 km', () => {
    expect(calcularTarifaEnvio(6.1)).toBe(2500)
    expect(calcularTarifaEnvio(7)).toBe(2500)
  })

  it('charges ₡2,700 for 7–8 km', () => {
    expect(calcularTarifaEnvio(7.1)).toBe(2700)
    expect(calcularTarifaEnvio(8)).toBe(2700)
  })

  it('charges ₡3,000 for 8–9 km', () => {
    expect(calcularTarifaEnvio(8.1)).toBe(3000)
    expect(calcularTarifaEnvio(9)).toBe(3000)
  })

  it('charges ₡3,500 for 9–10 km', () => {
    expect(calcularTarifaEnvio(9.1)).toBe(3500)
    expect(calcularTarifaEnvio(10)).toBe(3500)
  })

  it('charges distanciaKm × ₡350 beyond 10 km', () => {
    expect(calcularTarifaEnvio(11)).toBe(3850)
    expect(calcularTarifaEnvio(15)).toBe(5250)
    expect(calcularTarifaEnvio(20)).toBe(7000)
  })
})

describe('descripcionTarifaEnvio', () => {
  it('returns empty for 0 km', () => {
    expect(descripcionTarifaEnvio(0)).toBe('')
  })

  it('describes each tier correctly', () => {
    expect(descripcionTarifaEnvio(0.5)).toBe('0–1.5 km')
    expect(descripcionTarifaEnvio(2)).toBe('1.5–2 km')
    expect(descripcionTarifaEnvio(2.5)).toBe('2–2.5 km')
    expect(descripcionTarifaEnvio(3)).toBe('2.5–3 km')
    expect(descripcionTarifaEnvio(4)).toBe('3–4 km')
    expect(descripcionTarifaEnvio(5)).toBe('4–5 km')
    expect(descripcionTarifaEnvio(6)).toBe('5–6 km')
    expect(descripcionTarifaEnvio(7)).toBe('6–7 km')
    expect(descripcionTarifaEnvio(8)).toBe('7–8 km')
    expect(descripcionTarifaEnvio(9)).toBe('8–9 km')
    expect(descripcionTarifaEnvio(10)).toBe('9–10 km')
    expect(descripcionTarifaEnvio(15)).toContain('tarifa larga distancia')
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
