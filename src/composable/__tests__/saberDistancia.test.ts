import { describe, it, expect } from 'vitest'
import { calcDistance } from '../saberDistancia'

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
