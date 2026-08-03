import { describe, it, expect } from 'vitest'
import { precioItemConDescuento, aplicarDescuentoGlobal } from '../descuentos'

describe('precioItemConDescuento', () => {
  it('returns the plain price when there is no product discount', () => {
    expect(precioItemConDescuento({ precio: 1000 }, { activo: false })).toBe(1000)
  })

  it('applies the product discount when there is no active global discount', () => {
    expect(precioItemConDescuento({ precio: 1000, descuento: 10 }, { activo: false })).toBe(900)
  })

  it('ignores the product discount when the global discount is active', () => {
    expect(precioItemConDescuento({ precio: 1000, descuento: 10 }, { activo: true, porcentaje: 50 })).toBe(1000)
  })

  it('ignores a zero or missing product discount', () => {
    expect(precioItemConDescuento({ precio: 1000, descuento: 0 }, { activo: false })).toBe(1000)
    expect(precioItemConDescuento({ precio: 1000 }, { activo: false })).toBe(1000)
  })
})

describe('aplicarDescuentoGlobal', () => {
  it('returns the plain amount when the global discount is not active', () => {
    expect(aplicarDescuentoGlobal(1000, { activo: false, porcentaje: 20 })).toBe(1000)
    expect(aplicarDescuentoGlobal(1000, null)).toBe(1000)
  })

  it('applies the global percentage when active', () => {
    expect(aplicarDescuentoGlobal(1000, { activo: true, porcentaje: 20 })).toBe(800)
  })

  it('rounds the resulting amount', () => {
    expect(aplicarDescuentoGlobal(999, { activo: true, porcentaje: 10 })).toBe(899)
  })
})
