import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { esPromocionActiva, diaPromocion } from '../promociones'

describe('esPromocionActiva', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true for "2 Enteros" every day', () => {
    for (let dia = 0; dia < 7; dia++) {
      const fecha = new Date(2025, 0, 6 + dia)
      vi.setSystemTime(fecha)
      expect(esPromocionActiva('2 Enteros')).toBe(true)
    }
  })

  it('returns true for "2X1 Tacos" only on Tuesday (day 2)', () => {
    vi.setSystemTime(new Date(2025, 0, 7))
    expect(new Date().getDay()).toBe(2)
    expect(esPromocionActiva('2X1 Tacos')).toBe(true)
  })

  it('returns false for "2X1 Tacos" outside Tuesday', () => {
    vi.setSystemTime(new Date(2025, 0, 6))
    expect(new Date().getDay()).toBe(1)
    expect(esPromocionActiva('2X1 Tacos')).toBe(false)
  })

  it('returns false for unknown products', () => {
    expect(esPromocionActiva('Producto inexistente')).toBe(false)
  })
})

describe('diaPromocion', () => {
  it('returns the correct day for known promos', () => {
    expect(diaPromocion('2X1 Tacos')).toBe('Solo los martes')
    expect(diaPromocion('2 Enteros')).toBe('Todos los días')
    expect(diaPromocion('Jueves de Alitas')).toBe('Solo los jueves')
  })

  it('returns empty string for unknown products', () => {
    expect(diaPromocion('Nada')).toBe('')
  })
})
