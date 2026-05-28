<script setup lang="ts">
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

interface CatalogMatch {
  _id?: Id<'catalogPaints'>
  brand: string
  name: string
  paintType: string
  hexColor: string | null
  brandCode?: string | null
  barcode?: string | null
  transparency?: string | null
  finish?: string | null
  specialType?: string | null
}

const emit = defineEmits<{
  close: []
}>()

type Tab = 'code' | 'scan' | 'manual'
const activeTab = ref<Tab>('code')

const codeInput = ref('')
const lookupError = ref('')
const matchedPaint = ref<CatalogMatch | null>(null)
const lastScannedCode = ref('')

const manualForm = reactive({
  brand: 'Citadel',
  name: '',
  paintType: 'base',
  hexColor: '#888888',
})

const client = useConvexClient()
const { addPaint } = usePaints()

async function lookup(query: { code?: string, barcode?: string }) {
  lookupError.value = ''
  matchedPaint.value = null

  // First check user's existing collection
  try {
    const existing = await client.query(api.paints.lookup, {
      code: query.code,
      barcode: query.barcode,
    })
    if (existing) {
      const { brand, name, paintType, hexColor, brandCode, barcode, transparency, finish, specialType } = existing
      matchedPaint.value = { brand, name, paintType, hexColor, brandCode, barcode, transparency, finish, specialType }
      return
    }
  }
  catch {
    // Fall through to live catalog
  }

  // Fallback to live catalog
  const q = query.code ?? query.barcode ?? ''
  const results = await client.query(api.catalogSync.searchCatalog, { q })
  const result = results[0]
  if (result) {
    matchedPaint.value = result
  }
  else {
    lookupError.value = 'No paint matches that code. You can add it manually below.'
  }
}

async function handleCodeLookup() {
  if (!codeInput.value.trim()) return
  await lookup({ code: codeInput.value.trim() })
}

function handleScanned(code: string) {
  if (code === lastScannedCode.value) return
  lastScannedCode.value = code
  lookup({ code, barcode: code })
}

async function confirmMatch() {
  if (!matchedPaint.value) return
  try {
    await addPaint({
      brand: matchedPaint.value.brand,
      name: matchedPaint.value.name,
      paintType: matchedPaint.value.paintType,
      hexColor: matchedPaint.value.hexColor ?? '#888888',
      status: 'owned',
      notes: null,
      transparency: matchedPaint.value.transparency ?? null,
      finish: matchedPaint.value.finish ?? null,
      specialType: matchedPaint.value.specialType ?? null,
      barcode: matchedPaint.value.barcode ?? null,
      brandCode: matchedPaint.value.brandCode ?? null,
      catalogPaintId: matchedPaint.value._id,
    })
    emit('close')
  }
  catch {
    lookupError.value = 'Failed to save paint.'
  }
}

async function handleManualSubmit() {
  try {
    await addPaint({
      brand: manualForm.brand,
      name: manualForm.name,
      paintType: manualForm.paintType,
      hexColor: manualForm.hexColor,
      status: 'owned',
      notes: null,
      transparency: null,
      finish: null,
      specialType: null,
      barcode: null,
      brandCode: null,
    })
    emit('close')
  }
  catch {
    lookupError.value = 'Failed to save paint.'
  }
}

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const types = ['base', 'layer', 'shade', 'contrast', 'dry', 'technical', 'primer', 'spray']
const brands = ['Citadel', 'Vallejo', 'Army Painter', 'Scale75', 'AK Interactive', 'ProAcryl']
</script>

<template>
  <div class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" @click.self="emit('close')">
    <div class="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 class="text-lg font-semibold text-gray-900">Quick Add Paint</h2>
        <button
          class="text-gray-400 hover:text-gray-600"
          @click="emit('close')"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-gray-100">
        <button
          v-for="tab in ['code', 'scan', 'manual'] as const"
          :key="tab"
          class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
          :class="activeTab === tab
            ? 'text-accent-600 border-b-2 border-accent-600'
            : 'text-gray-500 hover:text-gray-700'"
          @click="activeTab = tab; matchedPaint = null; lookupError = ''"
        >
          {{ tab === 'code' ? 'Code' : tab === 'scan' ? 'Scan' : 'Manual' }}
        </button>
      </div>

      <div class="p-6">
        <!-- Code lookup tab -->
        <div v-if="activeTab === 'code'">
          <p class="text-sm text-gray-500 mb-4">
            Enter a brand code (e.g. <span class="font-mono">21-01</span> for Citadel Abaddon Black).
          </p>
          <form class="flex gap-2 mb-4" @submit.prevent="handleCodeLookup">
            <input
              v-model="codeInput"
              type="text"
              placeholder="Brand code"
              class="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
            <button
              type="submit"
              class="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 transition-colors"
            >
              Look up
            </button>
          </form>
        </div>

        <!-- Scan tab -->
        <div v-else-if="activeTab === 'scan'">
          <p class="text-sm text-gray-500 mb-4">
            Point your camera at a paint barcode. Allow camera access when prompted.
          </p>
          <ClientOnly>
            <PaintBarcodeScanner
              @detected="handleScanned"
              @error="(msg) => lookupError = msg"
            />
          </ClientOnly>
          <p v-if="lastScannedCode" class="text-xs text-gray-500 mt-2 text-center font-mono">
            Last scan: {{ lastScannedCode }}
          </p>
        </div>

        <!-- Manual tab -->
        <div v-else>
          <form class="space-y-4" @submit.prevent="handleManualSubmit">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Brand</label>
              <select
                v-model="manualForm.brand"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <option v-for="b in brands" :key="b" :value="b">{{ b }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Paint Name</label>
              <input
                v-model="manualForm.name"
                type="text"
                required
                placeholder="e.g. Abaddon Black"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-gray-500 mb-1">Type</label>
                <select
                  v-model="manualForm.paintType"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  <option v-for="t in types" :key="t" :value="t">{{ formatLabel(t) }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Colour</label>
                <div class="flex gap-2 items-center">
                  <input
                    v-model="manualForm.hexColor"
                    type="color"
                    class="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                  >
                  <input
                    v-model="manualForm.hexColor"
                    type="text"
                    class="flex-1 rounded-lg border border-gray-200 px-2 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent-500"
                  >
                </div>
              </div>
            </div>
            <button
              type="submit"
              class="w-full rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 transition-colors"
            >
              Add Paint
            </button>
          </form>
        </div>

        <!-- Match result (shown for code + scan tabs) -->
        <div
          v-if="matchedPaint && activeTab !== 'manual'"
          class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4"
        >
          <div class="flex items-start gap-3 mb-3">
            <ColorSwatch :color="matchedPaint.hexColor ?? '#888888'" />
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">{{ matchedPaint.name }}</p>
              <p class="text-xs text-gray-500">{{ matchedPaint.brand }} · {{ formatLabel(matchedPaint.paintType) }}</p>
            </div>
          </div>
          <button
            class="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            @click="confirmMatch"
          >
            Add to Collection
          </button>
        </div>

        <!-- Error / not found -->
        <div
          v-if="lookupError && activeTab !== 'manual'"
          class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          {{ lookupError }}
        </div>
      </div>
    </div>
  </div>
</template>
