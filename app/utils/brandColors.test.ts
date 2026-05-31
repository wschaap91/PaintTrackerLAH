import { describe, it, expect } from 'vitest'
import { getBrandColor } from './brandColors'

describe('getBrandColor', () => {
  it('returns correct hex for known brand', () => {
    expect(getBrandColor('Citadel')).toBe('#1565C0')
    expect(getBrandColor('Vallejo')).toBe('#C62828')
    expect(getBrandColor('Pro Acryl')).toBe('#4527A0')
  })

  it('returns default gray for unknown brand', () => {
    expect(getBrandColor('Unknown')).toBe('#616161')
  })

  it('returns default for empty string', () => {
    expect(getBrandColor('')).toBe('#616161')
  })
})
