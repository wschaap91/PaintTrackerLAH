export interface KnownPaint {
  brand: string
  name: string
  paintType: string
  hexColor: string
  brandCode?: string
  barcode?: string
  transparency?: string
  finish?: string
  specialType?: string
}

export const knownPaints: KnownPaint[] = [
  // Citadel Base
  { brand: 'Citadel', name: 'Abaddon Black', paintType: 'base', hexColor: '#231f20', brandCode: '21-01', transparency: 'opaque', finish: 'matte' },
  { brand: 'Citadel', name: 'Mephiston Red', paintType: 'base', hexColor: '#9a1115', brandCode: '21-03', transparency: 'opaque', finish: 'matte' },
  { brand: 'Citadel', name: 'Macragge Blue', paintType: 'base', hexColor: '#243e78', brandCode: '21-08', transparency: 'opaque', finish: 'matte' },
  { brand: 'Citadel', name: 'Caliban Green', paintType: 'base', hexColor: '#0b4a31', brandCode: '21-13', transparency: 'opaque', finish: 'matte' },
  { brand: 'Citadel', name: 'Retributor Armour', paintType: 'base', hexColor: '#c39e5a', brandCode: '21-53', transparency: 'opaque', finish: 'satin' },
  { brand: 'Citadel', name: 'Leadbelcher', paintType: 'base', hexColor: '#646464', brandCode: '21-28', transparency: 'opaque', finish: 'satin' },
  { brand: 'Citadel', name: 'Corax White', paintType: 'base', hexColor: '#dcdcd6', brandCode: '21-44', transparency: 'opaque', finish: 'matte' },
  { brand: 'Citadel', name: 'Wraithbone', paintType: 'base', hexColor: '#dfd2a7', brandCode: '21-05', transparency: 'opaque', finish: 'matte' },
  { brand: 'Citadel', name: 'Grey Seer', paintType: 'base', hexColor: '#c3c3c5', brandCode: '21-56', transparency: 'opaque', finish: 'matte' },

  // Citadel Layer
  { brand: 'Citadel', name: 'Calgar Blue', paintType: 'layer', hexColor: '#4272b8', brandCode: '22-19', transparency: 'opaque', finish: 'matte' },
  { brand: 'Citadel', name: 'Evil Sunz Scarlet', paintType: 'layer', hexColor: '#d8211d', brandCode: '22-05', transparency: 'opaque', finish: 'matte' },
  { brand: 'Citadel', name: 'Warpstone Glow', paintType: 'layer', hexColor: '#1f7a31', brandCode: '22-26', transparency: 'opaque', finish: 'matte' },
  { brand: 'Citadel', name: 'Fenrisian Grey', paintType: 'layer', hexColor: '#9bbedc', brandCode: '22-77', transparency: 'opaque', finish: 'matte' },
  { brand: 'Citadel', name: 'Auric Armour Gold', paintType: 'layer', hexColor: '#e0b455', brandCode: '22-62', transparency: 'opaque', finish: 'satin' },

  // Citadel Shade
  { brand: 'Citadel', name: 'Nuln Oil', paintType: 'shade', hexColor: '#14100e', brandCode: '24-14', transparency: 'transparent', finish: 'satin', specialType: 'wash' },
  { brand: 'Citadel', name: 'Agrax Earthshade', paintType: 'shade', hexColor: '#4a3826', brandCode: '24-15', transparency: 'transparent', finish: 'satin', specialType: 'wash' },
  { brand: 'Citadel', name: 'Reikland Fleshshade', paintType: 'shade', hexColor: '#8a3a1a', brandCode: '24-24', transparency: 'transparent', finish: 'satin', specialType: 'wash' },
  { brand: 'Citadel', name: 'Drakenhof Nightshade', paintType: 'shade', hexColor: '#0d2a4a', brandCode: '24-18', transparency: 'transparent', finish: 'satin', specialType: 'wash' },

  // Citadel Contrast
  { brand: 'Citadel', name: 'Black Templar', paintType: 'contrast', hexColor: '#1a1a1a', brandCode: '29-39', transparency: 'transparent', finish: 'satin', specialType: 'contrast' },
  { brand: 'Citadel', name: 'Blood Angels Red', paintType: 'contrast', hexColor: '#a51c20', brandCode: '29-12', transparency: 'transparent', finish: 'satin', specialType: 'contrast' },
  { brand: 'Citadel', name: 'Ultramarines Blue', paintType: 'contrast', hexColor: '#2a4d8f', brandCode: '29-18', transparency: 'transparent', finish: 'satin', specialType: 'contrast' },

  // Citadel Technical
  { brand: 'Citadel', name: 'Lahmian Medium', paintType: 'technical', hexColor: '#eaeaea', brandCode: '27-02', transparency: 'transparent', finish: 'satin' },
  { brand: 'Citadel', name: "'Ardcoat", paintType: 'technical', hexColor: '#f8f8f8', brandCode: '27-03', transparency: 'transparent', finish: 'gloss' },

  // Vallejo Model Color
  { brand: 'Vallejo', name: 'Dead White', paintType: 'base', hexColor: '#ffffff', brandCode: '70.951', transparency: 'opaque', finish: 'matte' },
  { brand: 'Vallejo', name: 'Black', paintType: 'base', hexColor: '#1a1a1a', brandCode: '70.950', transparency: 'opaque', finish: 'matte' },
  { brand: 'Vallejo', name: 'Flat Red', paintType: 'base', hexColor: '#a01a20', brandCode: '70.957', transparency: 'opaque', finish: 'matte' },
  { brand: 'Vallejo', name: 'Sky Blue', paintType: 'base', hexColor: '#5b8bc7', brandCode: '70.961', transparency: 'opaque', finish: 'matte' },

  // Army Painter
  { brand: 'Army Painter', name: 'Dragon Red', paintType: 'base', hexColor: '#a01a1f', brandCode: 'WP1105', transparency: 'opaque', finish: 'matte' },
  { brand: 'Army Painter', name: 'Pure Black', paintType: 'base', hexColor: '#1a1a1a', brandCode: 'WP1101', transparency: 'opaque', finish: 'matte' },
  { brand: 'Army Painter', name: 'Matt White', paintType: 'base', hexColor: '#ffffff', brandCode: 'WP1102', transparency: 'opaque', finish: 'matte' },
]

export function lookupKnownPaint({ code, barcode }: { code?: string, barcode?: string }): KnownPaint | null {
  if (code) {
    const normalized = code.trim().toLowerCase()
    const match = knownPaints.find(p => p.brandCode?.toLowerCase() === normalized)
    if (match) return match
  }
  if (barcode) {
    const match = knownPaints.find(p => p.barcode === barcode.trim())
    if (match) return match
  }
  return null
}
