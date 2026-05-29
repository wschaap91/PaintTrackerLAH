// ---------------------------------------------------------------------------
// colorFamily.ts — pure color classification logic (no DB access)
// ---------------------------------------------------------------------------

/**
 * Classify a paint's color family from its hex color and finish.
 *
 * Returns one of: red | orange | yellow | green | blue | purple | pink |
 *                 brown | black | white | grey | metallic
 *
 * Classification rules:
 * 1. finish === 'metallic' → always 'metallic' regardless of hue
 * 2. null/missing hexColor → 'grey'
 * 3. Very dark colors (lightness < 12%) → 'black'
 * 4. Very light colors (lightness > 88%) → 'white'
 * 5. Low saturation (< 12%) → 'grey'
 * 6. Brown: low-saturation oranges (hue 20–45°, saturation 12–50%, lightness 20–55%)
 * 7. Remaining hue bands → mapped to named color family
 */
export function classifyColorFamily(
  hexColor: string | null,
  finish: string | null,
): string {
  // Rule 1: metallic finish always wins
  if (finish === 'metallic') return 'metallic'

  // Rule 2: no color information
  if (!hexColor) return 'grey'

  const rgb = hexToRgb(hexColor)
  if (!rgb) {
    console.warn(`classifyColorFamily: could not parse hex "${hexColor}", defaulting to grey`)
    return 'grey'
  }

  const [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b)

  // Rule 3: near-black
  if (l < 12) return 'black'

  // Rule 4: near-white
  if (l > 88) return 'white'

  // Rule 5: achromatic / very low saturation
  if (s < 12) return 'grey'

  // Rule 6: brown — warm hue, moderate saturation, mid-low lightness
  if (h >= 20 && h <= 45 && s >= 12 && s <= 50 && l >= 20 && l <= 55) return 'brown'

  // Rule 7: hue bands (degrees, 0–360)
  if (h < 10 || h >= 345) return 'red'
  if (h < 20) return 'orange' // deep orange / red-orange
  if (h < 46) return 'orange'
  if (h < 65) return 'yellow'
  if (h < 165) return 'green'
  if (h < 195) return 'blue' // cyan counts as blue
  if (h < 255) return 'blue'
  if (h < 285) return 'purple'
  if (h < 325) return 'pink'
  if (h < 345) return 'red'

  // Fallback (should not be reached)
  return 'grey'
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface Rgb {
  r: number
  g: number
  b: number
}

/** Parse a hex string like '#FF0000' or 'FF0000' into RGB (0–255). Returns null on bad input. */
function hexToRgb(hex: string): Rgb | null {
  const clean = hex.replace(/^#/, '').trim()
  if (clean.length !== 6 && clean.length !== 3) return null

  const expanded =
    clean.length === 3
      ? clean
          .split('')
          .map(c => c + c)
          .join('')
      : clean

  const num = parseInt(expanded, 16)
  if (isNaN(num)) return null

  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  }
}

/**
 * Convert RGB (0–255) to HSL.
 * Returns [hue (0–360), saturation (0–100), lightness (0–100)].
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255

  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min

  const l = (max + min) / 2

  if (delta === 0) {
    return [0, 0, Math.round(l * 100)]
  }

  const s = delta / (1 - Math.abs(2 * l - 1))

  let h: number
  if (max === rn) {
    h = ((gn - bn) / delta) % 6
  } else if (max === gn) {
    h = (bn - rn) / delta + 2
  } else {
    h = (rn - gn) / delta + 4
  }

  h = Math.round(h * 60)
  if (h < 0) h += 360

  return [h, Math.round(s * 100), Math.round(l * 100)]
}
