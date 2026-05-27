<script setup lang="ts">
const props = defineProps<{ paints: any[] }>()
const { exportJson, exportCsv, parseFile, importPaints } = useImportExport()

const fileInput = ref<HTMLInputElement | null>(null)
const parsedRows = ref<any[]>([])
const parseErrors = ref<string[]>([])
const onDuplicate = ref<'skip' | 'update'>('skip')
const importResult = ref<{ added: number, skipped: number, updated: number } | null>(null)
const isImporting = ref(false)
const isParsing = ref(false)
const selectedFile = ref<File | null>(null)
const detectedColumns = ref<string[] | undefined>(undefined)

const STANDARD_COLUMNS = ['brand', 'name', 'paintType', 'hexColor', 'status', 'notes', 'transparency', 'finish', 'specialType', 'barcode', 'brandCode']

const hasNonStandardColumns = computed(() => {
  if (!detectedColumns.value) return false
  return detectedColumns.value.some(col => !STANDARD_COLUMNS.includes(col))
})

async function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  selectedFile.value = file
  isParsing.value = true
  importResult.value = null
  const result = await parseFile(file)
  parsedRows.value = result.rows
  parseErrors.value = result.errors
  detectedColumns.value = result.detectedColumns
  isParsing.value = false
}

async function handleImport() {
  if (!parsedRows.value.length) return
  isImporting.value = true
  try {
    const result = await importPaints(parsedRows.value, onDuplicate.value)
    importResult.value = result
    parsedRows.value = []
    parseErrors.value = []
    detectedColumns.value = undefined
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

      <!-- Column info for CSV files -->
      <div v-if="detectedColumns" class="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
        <p class="font-medium mb-1">Detected columns: <span class="font-normal">{{ detectedColumns.join(', ') }}</span></p>
        <p v-if="hasNonStandardColumns" class="text-amber-600">
          Some columns are non-standard and will be ignored. Supported columns: {{ STANDARD_COLUMNS.join(', ') }}
        </p>
      </div>

      <div v-if="isParsing" class="mt-2 text-xs text-gray-400">Parsing…</div>

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
