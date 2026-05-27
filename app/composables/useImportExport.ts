import { api } from '../../convex/_generated/api'
import { z } from 'zod'

// Schema for validating imported paint rows
const PaintRowSchema = z.object({
  brand: z.string().min(1),
  name: z.string().min(1),
  paintType: z.string().default('standard'),
  hexColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#888888'),
  status: z.enum(['owned', 'wishlist', 'running_low', 'empty']).default('owned'),
  notes: z.string().nullable().default(null),
  transparency: z.string().nullable().default(null),
  finish: z.string().nullable().default(null),
  specialType: z.string().nullable().default(null),
  barcode: z.string().nullable().default(null),
  brandCode: z.string().nullable().default(null),
})

type PaintRow = z.infer<typeof PaintRowSchema>

export function useImportExport() {
  const client = useConvexClient()

  // Export current paints as JSON
  function exportJson(paints: any[]) {
    const data = paints.map(({ brand, name, paintType, hexColor, status, notes, transparency, finish, specialType, barcode, brandCode }) =>
      ({ brand, name, paintType, hexColor, status, notes, transparency, finish, specialType, barcode, brandCode })
    )
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'paints.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Export current paints as CSV
  function exportCsv(paints: any[]) {
    const headers = ['brand', 'name', 'paintType', 'hexColor', 'status', 'notes', 'transparency', 'finish', 'specialType', 'barcode', 'brandCode']
    const rows = paints.map(p =>
      headers.map(h => {
        const val = (p as any)[h] ?? ''
        return `"${String(val).replace(/"/g, '""')}"`
      }).join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'paints.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Parse a CSV line respecting quoted fields
  function parseCsvLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]!
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    result.push(current)
    return result
  }

  // Parse a file (JSON or CSV) into validated paint rows
  async function parseFile(file: File): Promise<{ rows: PaintRow[], errors: string[], detectedColumns?: string[] }> {
    const text = await file.text()
    const errors: string[] = []
    let raw: any[] = []
    let detectedColumns: string[] | undefined

    if (file.name.endsWith('.json')) {
      try {
        const parsed = JSON.parse(text)
        raw = Array.isArray(parsed) ? parsed : [parsed]
      } catch {
        return { rows: [], errors: ['Invalid JSON file'] }
      }
    } else if (file.name.endsWith('.csv')) {
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) return { rows: [], errors: ['CSV file is empty or has no data rows'] }
      const headers = parseCsvLine(lines[0]!).map(h => h.trim().toLowerCase())
      detectedColumns = headers
      raw = lines.slice(1).map(line => {
        const values = parseCsvLine(line)
        return Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? '').trim()]))
      })
    } else {
      return { rows: [], errors: ['Unsupported file type. Use .json or .csv'] }
    }

    // Validate each row
    const rows: PaintRow[] = []
    for (let i = 0; i < raw.length; i++) {
      const result = PaintRowSchema.safeParse(raw[i])
      if (result.success) {
        rows.push(result.data)
      } else {
        errors.push(`Row ${i + 1}: ${result.error.issues.map((e: any) => e.message).join(', ')}`)
      }
    }

    return { rows, errors, detectedColumns }
  }

  // Run bulk import
  async function importPaints(rows: PaintRow[], onDuplicate: 'skip' | 'update') {
    return await client.mutation(api.paints.bulkCreate, { paints: rows, onDuplicate })
  }

  return { exportJson, exportCsv, parseFile, importPaints }
}
