<script setup lang="ts">
import type { Doc, Id } from '../../../convex/_generated/dataModel'

const router = useRouter()
const error = ref('')
const { addPaint } = usePaints()

const selectedCatalogPaintId = ref<Id<'catalogPaints'> | undefined>(undefined)
const formKey = ref(0)
const catalogInitialData = ref<Record<string, unknown> | undefined>(undefined)

function onCatalogSelect(paint: Doc<'catalogPaints'>) {
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
  selectedCatalogPaintId.value = paint._id
  formKey.value++
}

async function handleSubmit(data: Record<string, unknown>) {
  try {
    error.value = ''
    const catalogId = selectedCatalogPaintId.value
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = await addPaint({ ...data, ...(catalogId !== undefined ? { catalogPaintId: catalogId } : {}) } as any)
    selectedCatalogPaintId.value = undefined
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

    <div class="mb-4">
      <PaintCatalogSearch @select="onCatalogSelect" />
    </div>

    <div :key="formKey" class="card">
      <PaintForm submit-label="Add Paint" :initial-data="catalogInitialData" @submit="handleSubmit" />
    </div>
  </div>
</template>
