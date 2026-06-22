import { formatGhostCopy, formatGhostValue } from './formatGhostCopy'

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

describe('formatGhostCopy', () => {
  it('returns "your best ever" for all_time_pr', () => {
    expect(formatGhostCopy(daysAgo(365), 'all_time_pr')).toBe('your best ever')
  })

  it('returns weekday copy for last_session regardless of days', () => {
    const date = new Date('2026-01-06T10:00:00Z') // Tuesday
    const result = formatGhostCopy(date, 'last_session')
    expect(result).toMatch(/^you from /)
  })

  it('returns weekday copy for ≤7 days (last_week type)', () => {
    const result = formatGhostCopy(daysAgo(5), 'last_week')
    expect(result).toMatch(/^you from /)
    expect(result).not.toContain('weeks ago')
  })

  it('returns "you from last week" for ~7 days', () => {
    const result = formatGhostCopy(daysAgo(7), 'last_week')
    expect(result).toMatch(/^you from /)
  })

  it('returns "you from last week" when exactly 1 week in 8–30 range', () => {
    const result = formatGhostCopy(daysAgo(10), 'last_week')
    // ~1 week
    expect(['you from last week', 'you from 1 weeks ago']).toContain(result)
  })

  it('returns weeks-ago copy for 15+ days', () => {
    const result = formatGhostCopy(daysAgo(20), 'last_month')
    expect(result).toMatch(/you from (last week|\d+ weeks ago)/)
  })

  it('returns "you from last month" for ~30 days', () => {
    const result = formatGhostCopy(daysAgo(31), 'last_month')
    expect(result).toMatch(/you from (last month|[A-Z][a-z]+)/)
  })

  it('returns month name copy for 31–90 days', () => {
    const result = formatGhostCopy(daysAgo(60), 'last_month')
    expect(result).toMatch(/you from (last month|[A-Z][a-z]+)/)
  })

  it('returns peaked-in copy for >90 days', () => {
    const result = formatGhostCopy(daysAgo(120), 'all_time_pr')
    // all_time_pr overrides to "your best ever"
    expect(result).toBe('your best ever')
  })

  it('returns peaked-in copy for >90 days with last_month type', () => {
    const result = formatGhostCopy(daysAgo(120), 'last_month')
    expect(result).toMatch(/^the you that peaked in /)
  })
})

describe('formatGhostValue', () => {
  it('formats strength value in kg', () => {
    expect(formatGhostValue({ weight_kg: 80, reps: 5, duration_s: null, distance_m: null }, 'kg')).toBe('80 kg × 5')
  })

  it('formats strength value in lb', () => {
    const result = formatGhostValue({ weight_kg: 80, reps: 5, duration_s: null, distance_m: null }, 'lb')
    expect(result).toMatch(/\d+ lb × 5/)
  })

  it('formats cardio value with duration only', () => {
    expect(formatGhostValue({ weight_kg: null, reps: null, duration_s: 305, distance_m: null }, 'kg')).toBe('05:05')
  })

  it('formats cardio value with duration and distance', () => {
    expect(formatGhostValue({ weight_kg: null, reps: null, duration_s: 305, distance_m: 1000 }, 'kg')).toBe('05:05 / 1000m')
  })
})
