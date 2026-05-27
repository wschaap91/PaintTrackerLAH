<script setup lang="ts">
const props = defineProps<{ paints: any[] }>()
const { exportJson, exportCsv, parseFile, parseFileRaw, applyColumnMapping, importPaints } = useImportExport()

const fileInput = ref<HTMLInputElement | null>(null)
const parsedRows = ref<any[]>([])
const parseErrors = ref<string[]>([])
const onDuplicate = ref<'skip' | 'update'>('skip')
const importResult = ref<{ added: number, skipped: number, updated: number } | null>(null)
const isImporting = ref(false)
const isParsing = ref(false)
const selectedFile = ref<File | null>(null)

const KNOWN_FIELDS = [
  { key: 'brand', label: 'Brand', required: true },
  { key: 'name', label: 'Name', required: true },
  { key: 'paintType', label: 'Paint Type', required: false },
  { key: 'hexColor', label: 'Hex Color', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'notes', label: 'Notes', required: false },
  { key: 'transparency', label: 'Transparency', required: false },
  { key: 'finish', label: 'Finish', required: false },
  { key: 'specialType', label: 'Special Type', required: false },
  { key: 'barcode', label: 'Barcode', required: false },
  { key: 'brandCode', label: 'Brand Code', required: false },
]

const STANDARD_HEADERS = new Set(KNOWN_FIELDS.map(f => f.key))

const csvHeaders = ref<string[]>([])
const rawRows = ref<Record<string, string>[]>([])
const columnMapping = ref<Record<string, string>>({})
const showColumnMapper = ref(false)

async function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  selectedFile.value = file
  isParsing.value = true
  importResult.value = null
  parsedRows.value = []
  parseErrors.value = []
  showColumnMapper.value = false

  if (file.name.endsWith('.csv')) {
    const raw = await parseFileRaw(file)
    if (raw) {
      csvHeaders.value = raw.headers
      rawRows.value = raw.rows
      // Check if all headers are standard
      const allStandard = raw.headers.every(h => STANDARD_HEADERS.has(h))
      if (!allStandard) {
        // Pre-populate mapping with exact matches
        const mapping: Record<string, string> = {}
        for (const field of KNOWN_FIELDS) {
          const match = raw.headers.find(h => h === field.key)
          mapping[field.key] = match ?? ''
        }
        columnMapping.value = mapping
        showColumnMapper.value = true
        isParsing.value = false
        return
      }
    }
  }

  // Standard file or JSON → parse directly
  const result = await parseFile(file)
  parsedRows.value = result.rows
  parseErrors.value = result.errors
  isParsing.value = false
}

async function applyMapping() {
  // Apply column mapping to raw rows, then validate with Zod
  const remapped = applyColumnMapping(rawRows.value, columnMapping.value)
  const result = await parseFile(new File(
    [JSON.stringify(remapped)],
    'mapped.json',
    { type: 'application/json' }
  ))
  parsedRows.value = result.rows
  parseErrors.value = result.errors
  showColumnMapper.value = false
}

async function handleImport() {
  if (!parsedRows.value.length) return
  isImporting.value = true
  try {
    const result = await importPaints(parsedRows.value, onDuplicate.value)
    importResult.value = result
    parsedRows.value = []
    parseErrors.value = []
    selectedFile.value = null
    if (fileInput.value) fileInput.value.value = ''
  } catch (e) {
    parseErrors.value = [e instanceof Error ? e.message : 'Import failed']
  } finally {
    isImporting.value = false
  }
}
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
    <h3 class="text-sm font-medium text-gray-900">Import / Export</h3>

    <!-- Export -->
    <div>
      <p class="text-xs text-gray-500 mb-2">Export your collection</p>
      <div class="flex gap-2">
        <button
          @click="exportJson(paints)"
          class="text-xs border border-gray-200 rounded px-3 py-1.5 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Export JSON
        </button>
        <button
          @click="exportCsv(paints)"
          class="text-xs border border-gray-200 rounded px-3 py-1.5 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Export CSV
        </button>
      </div>
    </div>

    <hr class="border-gray-100" />

    <!-- Import -->
    <div>
      <p class="text-xs text-gray-500 mb-2">Import from file (.json or .csv)</p>

      <input
        ref="fileInput"
        type="file"
        accept=".json,.csv"
        class="hidden"
        @change="handleFileChange"
      />
      <button
        @click="fileInput?.click()"
        class="text-xs border border-dashed border-gray-300 rounded px-4 py-2 text-gray-600 hover:bg-gray-50 w-full transition-colors"
      >
        {{ selectedFile ? selectedFile.name : 'Choose file…' }}
      </button>

      <div v-if="isParsing" class="mt-2 text-xs text-gray-400">Parsing…</div>

      <!-- Column mapping UI for non-standard CSV headers -->
      <div v-if="showColumnMapper" class="mt-3 space-y-2">
        <p class="text-xs font-medium text-gray-700">Map CSV columns to paint fields:</p>
        <p class="text-xs text-gray-500">Your CSV has non-standard column names. Map them below.</p>
        <div class="space-y-1.5 max-h-48 overflow-y-auto">
          <div
            v-for="field in KNOWN_FIELDS"
            :key="field.key"
            class="flex items-center gap-2"
          >
            <span class="text-xs text-gray-700 w-24 flex-shrink-0">
              {{ field.label }}<span v-if="field.required" class="text-red-500">*</span>
            </span>
            <select
              v-model="columnMapping[field.key]"
              class="flex-1 text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none"
            >
              <option value="">— not mapped —</option>
              <option v-for="h in csvHeaders" :key="h" :value="h">{{ h }}</option>
            </select>
          </div>
        </div>
        <button
          @click="applyMapping"
          :disabled="!columnMapping['brand'] || !columnMapping['name']"
          class="w-full text-xs bg-gray-900 text-white rounded px-4 py-2 hover:bg-gray-700 disabled:opacity-50 transition-colors mt-2"
        >
          Apply mapping
        </button>
      </div>

      <div v-if="parsedRows.length > 0" class="mt-3 space-y-2">
        <p class="text-xs text-gray-700">
          <span class="font-medium">{{ parsedRows.length }}</span> valid rows found
          <span v-if="parseErrors.length > 0" class="text-red-500 ml-1">({{ parseErrors.length }} skipped due to errors)</span>
        </p>

        <!-- Duplicate handling -->
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-600">On duplicate:</span>
          <label class="flex items-center gap-1 text-xs text-gray-700 cursor-pointer">
            <input type="radio" v-model="onDuplicate" value="skip" /> Skip
          </label>
          <label class="flex items-center gap-1 text-xs text-gray-700 cursor-pointer">
            <input type="radio" v-model="onDuplicate" value="update" /> Update
          </label>
        </div>

        <button
          @click="handleImport"
          :disabled="isImporting"
          class="w-full text-xs bg-gray-900 text-white rounded px-4 py-2 hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {{ isImporting ? 'Importing…' : `Import ${parsedRows.length} paints` }}
        </button>
      </div>

      <!-- Parse errors -->
      <div v-if="parseErrors.length > 0" class="mt-2 space-y-1">
        <p v-for="err in parseErrors.slice(0, 5)" :key="err" class="text-xs text-red-500">{{ err }}</p>
        <p v-if="parseErrors.length > 5" class="text-xs text-gray-400">…and {{ parseErrors.length - 5 }} more errors</p>
      </div>

      <!-- Import result summary -->
      <div v-if="importResult" class="mt-3 p-3 bg-green-50 rounded border border-green-100 text-xs text-green-800">
        Import complete:
        <strong>{{ importResult.added }}</strong> added,
        <strong>{{ importResult.updated }}</strong> updated,
        <strong>{{ importResult.skipped }}</strong> skipped
      </div>
    </div>
  </div>
</template>
