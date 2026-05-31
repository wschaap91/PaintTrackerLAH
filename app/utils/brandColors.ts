const brandColorMap: Record<string, string> = {
  'Citadel': '#1565C0',
  'Vallejo': '#C62828',
  'Army Painter': '#00695C',
  'AK Interactive': '#D84315',
  'Kimera': '#E65100',
  'Scale75': '#283593',
  'Pro Acryl': '#4527A0',
  'Turbo Dork': '#AD1457',
}

const DEFAULT_BRAND_COLOR = '#616161'

export function getBrandColor(brand: string): string {
  return brandColorMap[brand] ?? DEFAULT_BRAND_COLOR
}
