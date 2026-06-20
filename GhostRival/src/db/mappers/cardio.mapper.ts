export function parseDurationToSeconds(minutes: string, seconds: string): number {
  const m = parseInt(minutes, 10)
  const s = parseInt(seconds, 10)
  const mins = Number.isFinite(m) && m >= 0 ? m : 0
  const secs = Number.isFinite(s) && s >= 0 && s <= 59 ? s : 0
  return mins * 60 + secs
}

export function formatDuration(durationS: number): string {
  const totalSecs = Math.max(0, Math.round(durationS))
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export function formatDistanceDisplay(distanceM: number | null, unit: 'kg' | 'lb'): string | null {
  if (distanceM === null) return null
  if (unit === 'lb') {
    return `${(distanceM / 1609.344).toFixed(2)} mi`
  }
  return `${(distanceM / 1000).toFixed(2)} km`
}

export function convertDistanceToMeters(value: number, unit: 'kg' | 'lb'): number {
  return unit === 'lb' ? value * 1609.344 : value * 1000
}

export function calculatePaceSecPerKm(durationS: number, distanceM: number): number {
  return durationS / (distanceM / 1000)
}

export function formatPace(paceSecPerKm: number, unit: 'kg' | 'lb'): string {
  const paceSeconds = unit === 'lb' ? paceSecPerKm * 1.60934 : paceSecPerKm
  const totalSecs = Math.round(paceSeconds)
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  const suffix = unit === 'lb' ? '/mi' : '/km'
  return `${mins}:${String(secs).padStart(2, '0')} ${suffix}`
}

export function formatDurationAccessibility(durationS: number): string {
  const totalSecs = Math.max(0, Math.round(durationS))
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  if (mins === 0) return `${secs} ${secs !== 1 ? 'seconds' : 'second'}`
  if (secs === 0) return `${mins} ${mins !== 1 ? 'minutes' : 'minute'}`
  return `${mins} ${mins !== 1 ? 'minutes' : 'minute'} ${secs} ${secs !== 1 ? 'seconds' : 'second'}`
}

export function formatDistanceAccessibility(distanceM: number | null, unit: 'kg' | 'lb'): string | null {
  if (distanceM === null) return null
  if (unit === 'lb') {
    return `${(distanceM / 1609.344).toFixed(2)} miles`
  }
  return `${(distanceM / 1000).toFixed(2)} kilometres`
}
