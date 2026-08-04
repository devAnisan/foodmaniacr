import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { esPromocionActivaHoy, descripcionDias } from '../promociones'

describe('esPromocionActivaHoy', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true every day when diasActivos is empty or missing', () => {
    for (let dia = 0; dia < 7; dia++) {
      vi.setSystemTime(new Date(2025, 0, 6 + dia))
      expect(esPromocionActivaHoy([])).toBe(true)
      expect(esPromocionActivaHoy(undefined)).toBe(true)
    }
  })

  it('returns true only on the configured day (martes = 2)', () => {
    vi.setSystemTime(new Date(2025, 0, 7))
    expect(new Date().getDay()).toBe(2)
    expect(esPromocionActivaHoy([2])).toBe(true)
  })

  it('returns false outside the configured day', () => {
    vi.setSystemTime(new Date(2025, 0, 6))
    expect(new Date().getDay()).toBe(1)
    expect(esPromocionActivaHoy([2])).toBe(false)
  })

  it('supports multiple configured days', () => {
    vi.setSystemTime(new Date(2025, 0, 6)) // lunes
    expect(esPromocionActivaHoy([1, 4])).toBe(true)
    vi.setSystemTime(new Date(2025, 0, 9)) // jueves
    expect(esPromocionActivaHoy([1, 4])).toBe(true)
    vi.setSystemTime(new Date(2025, 0, 7)) // martes
    expect(esPromocionActivaHoy([1, 4])).toBe(false)
  })
})

describe('descripcionDias', () => {
  it('returns "Todos los días" when empty or missing', () => {
    expect(descripcionDias([])).toBe('Todos los días')
    expect(descripcionDias(undefined)).toBe('Todos los días')
  })

  it('describes a single day', () => {
    expect(descripcionDias([2])).toBe('Solo los martes')
    expect(descripcionDias([4])).toBe('Solo los jueves')
    expect(descripcionDias([0])).toBe('Solo los domingos')
    expect(descripcionDias([6])).toBe('Solo los sábados')
  })

  it('describes multiple days joined with commas and "y"', () => {
    expect(descripcionDias([1, 4])).toBe('Solo lunes y jueves')
    expect(descripcionDias([0, 3, 5])).toBe('Solo domingo, miércoles y viernes')
  })
})
