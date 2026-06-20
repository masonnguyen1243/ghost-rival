import type { DbSet } from '../../types'

export type { DbSet }

export function formatWeight(weightKg: number | null, unit: 'kg' | 'lb'): string {
  if (weightKg === null) return '–'
  if (unit === 'lb') return `${(weightKg / 0.453592).toFixed(1)} lb`
  return `${Number.isInteger(weightKg) ? weightKg : weightKg.toFixed(1)} kg`
}

export function convertToKg(value: number, unit: 'kg' | 'lb'): number {
  return unit === 'lb' ? value * 0.453592 : value
}
