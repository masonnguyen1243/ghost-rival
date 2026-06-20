import {
  parseDurationToSeconds,
  formatDuration,
  formatDistanceDisplay,
  convertDistanceToMeters,
  calculatePaceSecPerKm,
  formatPace,
  formatDurationAccessibility,
  formatDistanceAccessibility,
} from './cardio.mapper'

describe('parseDurationToSeconds', () => {
  it('parses valid minutes and seconds', () => {
    expect(parseDurationToSeconds('25', '00')).toBe(1500)
    expect(parseDurationToSeconds('1', '30')).toBe(90)
    expect(parseDurationToSeconds('0', '45')).toBe(45)
  })

  it('returns 0 for empty fields', () => {
    expect(parseDurationToSeconds('', '')).toBe(0)
    expect(parseDurationToSeconds('0', '0')).toBe(0)
  })

  it('handles non-numeric input gracefully', () => {
    expect(parseDurationToSeconds('abc', '30')).toBe(30)
    expect(parseDurationToSeconds('5', 'xyz')).toBe(300)
  })

  it('clamps seconds > 59 to 0', () => {
    expect(parseDurationToSeconds('5', '60')).toBe(300)
    expect(parseDurationToSeconds('5', '99')).toBe(300)
  })
})

describe('formatDuration', () => {
  it('formats seconds to mm:ss', () => {
    expect(formatDuration(1500)).toBe('25:00')
    expect(formatDuration(90)).toBe('1:30')
    expect(formatDuration(45)).toBe('0:45')
    expect(formatDuration(0)).toBe('0:00')
  })

  it('zero-pads seconds', () => {
    expect(formatDuration(61)).toBe('1:01')
    expect(formatDuration(600)).toBe('10:00')
  })

  it('handles negative input gracefully', () => {
    expect(formatDuration(-10)).toBe('0:00')
  })
})

describe('formatDistanceDisplay', () => {
  it('returns null when distanceM is null', () => {
    expect(formatDistanceDisplay(null, 'kg')).toBeNull()
    expect(formatDistanceDisplay(null, 'lb')).toBeNull()
  })

  it('converts to km when unit is kg', () => {
    expect(formatDistanceDisplay(5000, 'kg')).toBe('5.00 km')
    expect(formatDistanceDisplay(1000, 'kg')).toBe('1.00 km')
  })

  it('converts to miles when unit is lb', () => {
    expect(formatDistanceDisplay(1609.344, 'lb')).toBe('1.00 mi')
    expect(formatDistanceDisplay(8046.72, 'lb')).toBe('5.00 mi')
  })
})

describe('convertDistanceToMeters', () => {
  it('converts km to meters when unit is kg', () => {
    expect(convertDistanceToMeters(5, 'kg')).toBe(5000)
    expect(convertDistanceToMeters(1, 'kg')).toBe(1000)
  })

  it('converts miles to meters when unit is lb', () => {
    expect(convertDistanceToMeters(1, 'lb')).toBeCloseTo(1609.344, 1)
    expect(convertDistanceToMeters(5, 'lb')).toBeCloseTo(8046.72, 1)
  })
})

describe('calculatePaceSecPerKm', () => {
  it('calculates pace correctly', () => {
    // 30 minutes for 5km = 360 sec/km
    expect(calculatePaceSecPerKm(1800, 5000)).toBe(360)
    // 10 min for 1km = 600 sec/km
    expect(calculatePaceSecPerKm(600, 1000)).toBe(600)
  })
})

describe('formatPace', () => {
  it('formats pace as mm:ss /km when unit is kg', () => {
    expect(formatPace(360, 'kg')).toBe('6:00 /km')
    expect(formatPace(390, 'kg')).toBe('6:30 /km')
  })

  it('formats pace as mm:ss /mi when unit is lb', () => {
    // 360 sec/km * 1.60934 ≈ 579.36 sec/mi ≈ 9:39 /mi
    const result = formatPace(360, 'lb')
    expect(result).toMatch(/\/mi$/)
  })
})

describe('formatDurationAccessibility', () => {
  it('returns verbose minutes only', () => {
    expect(formatDurationAccessibility(300)).toBe('5 minutes')
    expect(formatDurationAccessibility(60)).toBe('1 minute')
  })

  it('returns verbose seconds only', () => {
    expect(formatDurationAccessibility(45)).toBe('45 seconds')
    expect(formatDurationAccessibility(1)).toBe('1 second')
  })

  it('returns both minutes and seconds', () => {
    expect(formatDurationAccessibility(90)).toBe('1 minute 30 seconds')
    expect(formatDurationAccessibility(1500)).toBe('25 minutes')
  })
})

describe('formatDistanceAccessibility', () => {
  it('returns null when distanceM is null', () => {
    expect(formatDistanceAccessibility(null, 'kg')).toBeNull()
  })

  it('returns kilometres when unit is kg', () => {
    expect(formatDistanceAccessibility(5000, 'kg')).toBe('5.00 kilometres')
  })

  it('returns miles when unit is lb', () => {
    expect(formatDistanceAccessibility(1609.344, 'lb')).toBe('1.00 miles')
  })
})
