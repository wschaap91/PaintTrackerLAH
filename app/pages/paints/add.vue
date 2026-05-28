<script setup lang="ts">
import { api } from '../../../convex/_generated/api'
import type { FunctionReturnType } from 'convex/server'
import type { Id } from '../../../convex/_generated/dataModel'

type CatalogPaint = FunctionReturnType<typeof api.catalogSync.searchCatalog>[number]

type UIState = 'search' | 'catalog' | 'manual'

const router = useRouter()
const error = ref('')
const { addPaint } = usePaints()

// UI state machine
const state = ref<UIState>('search')

// Catalog search
const { query, results, isLoading } = useCatalogSearch()
const inputValue = ref('')

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onInput() {
  if (debounceTimer !== null) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    query.value = inputValue.value
    debounceTimer = null
  }, 300)
}

onUnmounted(() => {
  if (debounceTimer !== null) clearTimeout(debounceTimer)
})

const showResults = computed(() => inputValue.value.trim().length >= 2)

// Selected catalog paint
const selectedPaint = ref<CatalogPaint | null>(null)
const selectedCatalogPaintId = ref<Id<'catalogPaints'> | undefined>(undefined)
const catalogInitialData = ref<Record<string, unknown> | undefined>(undefined)
const formKey = ref(0)

function selectCatalogPaint(paint: CatalogPaint) {
  selectedPaint.value = paint
  selectedCatalogPaintId.value = paint._id
  catalogInitialData.value = {
    brand: paint.brand,
    name: paint.name,
    hexColor: paint.hexColor,
    paintType: paint.paintType,
    finish: paint.finish,
    transparency: paint.transparency,
    brandCode: paint.brandCode,
    status: 'owned',
    notes: '',
  }
  formKey.value++
  state.value = 'catalog'
  // Clear search
  inputValue.value = ''
  query.value = ''
}

function clearSelection() {
  selectedPaint.value = null
  selectedCatalogPaintId.value = undefined
  catalogInitialData.value = undefined
  formKey.value++
  state.value = 'search'
}

function goManual() {
  selectedPaint.value = null
  selectedCatalogPaintId.value = undefined
  catalogInitialData.value = undefined
  formKey.value++
  state.value = 'manual'
}

function backToSearch() {
  selectedPaint.value = null
  selectedCatalogPaintId.value = undefined
  catalogInitialData.value = undefined
  formKey.value++
  state.value = 'search'
  inputValue.value = ''
  query.value = ''
}

async function handleSubmit(data: Record<string, unknown>) {
  try {
    error.value = ''
    const catalogId = selectedCatalogPaintId.value
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = await addPaint({ ...data, ...(catalogId !== undefined ? { catalogPaintId: catalogId } : {}) } as any)
    router.push(`/paints/${id}`)
  }
  catch {
    error.value = 'Failed to save paint.'
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <div class="mb-8">
      <NuxtLink to="/paints" class="text-sm text-gray-500 hover:text-gray-700">&larr; Back to paints</NuxtLink>
      <h1 class="text-2xl font-semibold text-gray-900 mt-2">Add Paint</h1>
    </div>

    <div v-if="error" class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      {{ error }}
    </div>

    <!-- State 1: Search (default) -->
    <template v-if="state === 'search'">
      <div class="card">
        <p class="text-sm text-gray-600 mb-4">Search the catalog to add a paint to your collection</p>
        <div class="relative">
          <input
            v-model="inputValue"
            type="text"
            placeholder="Search catalog by paint name..."
            class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 w-full"
            @input="onInput"
          >
          <div
            v-if="showResults"
            class="absolute left-0 right-0 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg z-50"
          >
            <div v-if="isLoading" class="p-3 text-sm text-gray-500">
              Loading...
            </div>
            <div v-else-if="results && results.length === 0" class="p-3 text-sm text-gray-500">
              No results found
            </div>
            <ul v-else-if="results">
              <li
                v-for="result in results"
                :key="result._id"
                class="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer first:rounded-t-lg last:rounded-b-lg"
                @click="selectCatalogPaint(result)"
              >
                <ColorSwatch size="sm" :color="result.hexColor ?? '#888888'" />
                <div class="text-sm">
                  <span class="font-medium text-gray-900">{{ result.name }}</span>
                  <span class="text-gray-500 ml-1">{{ result.brand }}</span>
                  <span v-if="result.range" class="text-gray-400 ml-1">· {{ result.range }}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            class="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
            @click="goManual"
          >
            Can't find your paint? Add manually
          </button>
        </div>
      </div>
    </template>

    <!-- State 2: Catalog paint selected -->
    <template v-else-if="state === 'catalog'">
      <!-- Selected paint summary -->
      <div class="card mb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <ColorSwatch :color="selectedPaint?.hexColor ?? '#888888'" />
            <div>
              <p class="text-sm font-medium text-gray-900">{{ selectedPaint?.name }}</p>
              <p class="text-xs text-gray-500">{{ selectedPaint?.brand }}<span v-if="selectedPaint?.range"> · {{ selectedPaint.range }}</span></p>
            </div>
          </div>
          <button
            type="button"
            class="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5"
            @click="clearSelection"
          >
            Clear selection
          </button>
        </div>
      </div>

      <div :key="formKey" class="card">
        <PaintForm
          catalog-mode
          submit-label="Add Paint"
          :initial-data="catalogInitialData"
          @submit="handleSubmit"
        />
      </div>
    </template>

    <!-- State 3: Manual fallback -->
    <template v-else-if="state === 'manual'">
      <div class="card">
        <div class="mb-4 pb-4 border-b border-gray-100 flex items-center justify-between">
          <p class="text-sm text-gray-600">Adding paint manually</p>
          <button
            type="button"
            class="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2"
            @click="backToSearch"
          >
            &larr; Back to catalog search
          </button>
        </div>
        <PaintForm :key="formKey" submit-label="Add Paint" @submit="handleSubmit" />
      </div>
    </template>
  </div>
</template>
