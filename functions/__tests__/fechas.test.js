import { describe, it, expect } from 'vitest'
const { fechaVentaCR, inicioSemanaCR, diasDeSemanaCR, semanaIdCR } = require('../fechas')

describe('fechaVentaCR', () => {
  it('keeps the same CR day for a time well within the day', () => {
    // 2026-08-02 18:00 UTC = 2026-08-02 12:00 CR (UTC-6)
    expect(fechaVentaCR(new Date('2026-08-02T18:00:00.000Z'))).toBe('2026-08-02')
  })

  it('rolls back to the previous CR day right after UTC midnight', () => {
    // 2026-08-03 02:00 UTC = 2026-08-02 20:00 CR
    expect(fechaVentaCR(new Date('2026-08-03T02:00:00.000Z'))).toBe('2026-08-02')
  })

  it('rolls over to the next CR day at 06:00 UTC (00:00 CR)', () => {
    expect(fechaVentaCR(new Date('2026-08-03T06:00:00.000Z'))).toBe('2026-08-03')
  })
})

describe('inicioSemanaCR / diasDeSemanaCR', () => {
  it('returns Monday as the start of the week for a mid-week date', () => {
    // 2026-08-05 is a Wednesday
    expect(inicioSemanaCR(new Date('2026-08-05T18:00:00.000Z'))).toBe('2026-08-03')
  })

  it('treats Sunday as the last day of its own week, not the next one', () => {
    // 2026-08-09 is a Sunday
    expect(inicioSemanaCR(new Date('2026-08-09T18:00:00.000Z'))).toBe('2026-08-03')
  })

  it('returns 7 consecutive days from Monday to Sunday', () => {
    expect(diasDeSemanaCR(new Date('2026-08-05T18:00:00.000Z'))).toEqual([
      '2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06',
      '2026-08-07', '2026-08-08', '2026-08-09',
    ])
  })

  it('handles a week that crosses a month boundary', () => {
    // 2026-08-31 is a Monday
    expect(diasDeSemanaCR(new Date('2026-08-31T18:00:00.000Z'))).toEqual([
      '2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03',
      '2026-09-04', '2026-09-05', '2026-09-06',
    ])
  })
})

describe('semanaIdCR', () => {
  it('is stable across every day of the same week', () => {
    const dias = diasDeSemanaCR(new Date('2026-08-05T18:00:00.000Z'))
    const ids = dias.map(d => semanaIdCR(new Date(`${d}T18:00:00.000Z`)))
    expect(new Set(ids).size).toBe(1)
  })

  it('changes between consecutive weeks', () => {
    const semana1 = semanaIdCR(new Date('2026-08-05T18:00:00.000Z'))
    const semana2 = semanaIdCR(new Date('2026-08-12T18:00:00.000Z'))
    expect(semana1).not.toBe(semana2)
  })

  it('assigns the ISO week number correctly around a year boundary', () => {
    // 2025-12-29 (Monday) belongs to ISO week 2026-W01 (its Thursday falls in 2026)
    expect(semanaIdCR(new Date('2025-12-29T18:00:00.000Z'))).toBe('2026-W01')
  })
})
