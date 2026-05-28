<script setup lang="ts">
import type { Id } from '../../../convex/_generated/dataModel'

const route = useRoute()
const router = useRouter()
const id = route.params.id as Id<'paints'>

const { data: paint } = usePaint(id)
const { updatePaint, removePaint } = usePaints()
const isEditing = ref(false)
const error = ref('')
const showDeleteConfirm = ref(false)

const catalogId = computed(() => paint.value?.catalogPaintId)
const { data: catalogPaint, isLoading: catalogLoading } = useCatalogPaint(catalogId)

function formatLabel(value: string | null | undefined): string {
  if (!value) return '—'
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

async function handleUpdate(data: Record<string, unknown>) {
  try {
    error.value = ''
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updatePaint({ id, ...data } as any)
    isEditing.value = false
  }
  catch {
    error.value = 'Failed to update paint.'
  }
}

async function handleDelete() {
  try {
    await removePaint({ id })
    router.push('/paints')
  }
  catch {
    error.value = 'Failed to delete paint.'
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <div class="mb-8">
      <NuxtLink to="/paints" class="text-sm text-gray-500 hover:text-gray-700">&larr; Back to paints</NuxtLink>
    </div>

    <div v-if="!paint" class="text-center py-12 text-sm text-gray-500">Loading...</div>

    <template v-else>
      <div v-if="!isEditing">
        <div class="flex items-start justify-between mb-6">
          <div class="flex items-center gap-4">
            <ColorSwatch :color="paint.hexColor" size="lg" />
            <div>
              <h1 class="text-2xl font-semibold text-gray-900">{{ paint.name }}</h1>
              <p class="text-sm text-gray-500">{{ paint.brand }}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              class="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              @click="isEditing = true"
            >
              Edit
            </button>
            <button
              class="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              @click="showDeleteConfirm = true"
            >
              Delete
            </button>
          </div>
        </div>

        <div class="card space-y-4">
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p class="text-xs text-gray-500">Type</p>
              <p class="text-sm font-medium text-gray-900">{{ formatLabel(paint.paintType) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">Status</p>
              <StatusBadge :status="paint.status" />
            </div>
            <div>
              <p class="text-xs text-gray-500">Colour</p>
              <p class="text-sm font-mono text-gray-900">{{ paint.hexColor }}</p>
            </div>
            <div v-if="paint.transparency">
              <p class="text-xs text-gray-500">Transparency</p>
              <p class="text-sm text-gray-900">{{ formatLabel(paint.transparency) }}</p>
            </div>
            <div v-if="paint.finish">
              <p class="text-xs text-gray-500">Finish</p>
              <p class="text-sm text-gray-900">{{ formatLabel(paint.finish) }}</p>
            </div>
            <div v-if="paint.specialType">
              <p class="text-xs text-gray-500">Special Type</p>
              <p class="text-sm text-gray-900">{{ paint.specialType }}</p>
            </div>
            <div v-if="paint.barcode">
              <p class="text-xs text-gray-500">Barcode</p>
              <p class="text-sm font-mono text-gray-900">{{ paint.barcode }}</p>
            </div>
            <div v-if="paint.brandCode">
              <p class="text-xs text-gray-500">Brand Code</p>
              <p class="text-sm font-mono text-gray-900">{{ paint.brandCode }}</p>
            </div>
          </div>

          <div v-if="paint.notes" class="pt-4 border-t border-gray-100">
            <p class="text-xs text-gray-500 mb-1">Notes</p>
            <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ paint.notes }}</p>
          </div>
        </div>

        <div v-if="paint.catalogPaintId" class="card mt-4 space-y-3">
          <h2 class="text-sm font-semibold text-gray-700">Catalog data</h2>

          <div v-if="catalogLoading" class="text-sm text-gray-500">Loading catalog data...</div>

          <div v-else-if="catalogPaint === null" class="text-sm text-gray-500">Catalog entry unavailable</div>

          <div v-else-if="catalogPaint" class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div v-if="catalogPaint.hexColor">
              <p class="text-xs text-gray-500 mb-1">Colour</p>
              <div class="flex items-center gap-2">
                <p class="text-sm font-mono text-gray-900">{{ catalogPaint.hexColor }}</p>
                <span class="bg-blue-50 text-blue-700 ring-blue-600/20 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset">from catalog</span>
              </div>
            </div>
            <div v-if="catalogPaint.paintType">
              <p class="text-xs text-gray-500 mb-1">Type</p>
              <div class="flex items-center gap-2">
                <p class="text-sm text-gray-900">{{ formatLabel(catalogPaint.paintType) }}</p>
                <span class="bg-blue-50 text-blue-700 ring-blue-600/20 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset">from catalog</span>
              </div>
            </div>
            <div v-if="catalogPaint.finish">
              <p class="text-xs text-gray-500 mb-1">Finish</p>
              <div class="flex items-center gap-2">
                <p class="text-sm text-gray-900">{{ formatLabel(catalogPaint.finish) }}</p>
                <span class="bg-blue-50 text-blue-700 ring-blue-600/20 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset">from catalog</span>
              </div>
            </div>
            <div v-if="catalogPaint.transparency">
              <p class="text-xs text-gray-500 mb-1">Transparency</p>
              <div class="flex items-center gap-2">
                <p class="text-sm text-gray-900">{{ formatLabel(catalogPaint.transparency) }}</p>
                <span class="bg-blue-50 text-blue-700 ring-blue-600/20 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset">from catalog</span>
              </div>
            </div>
            <div v-if="catalogPaint.brandCode">
              <p class="text-xs text-gray-500 mb-1">Brand Code</p>
              <div class="flex items-center gap-2">
                <p class="text-sm font-mono text-gray-900">{{ catalogPaint.brandCode }}</p>
                <span class="bg-blue-50 text-blue-700 ring-blue-600/20 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset">from catalog</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-semibold text-gray-900">Edit Paint</h1>
          <button class="text-sm text-gray-500 hover:text-gray-700" @click="isEditing = false">
            Cancel
          </button>
        </div>

        <div v-if="error" class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {{ error }}
        </div>

        <div class="card">
          <PaintForm
            :initial-data="paint as unknown as Record<string, unknown>"
            submit-label="Update Paint"
            @submit="handleUpdate"
          />
        </div>
      </div>

      <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/20 flex items-center justify-center z-50" @click.self="showDeleteConfirm = false">
        <div class="bg-white rounded-xl shadow-lg p-6 max-w-sm mx-4">
          <h3 class="text-lg font-medium text-gray-900">Delete paint?</h3>
          <p class="mt-2 text-sm text-gray-500">This will permanently remove <strong>{{ paint.name }}</strong> from your collection.</p>
          <div class="mt-4 flex justify-end gap-3">
            <button class="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" @click="showDeleteConfirm = false">
              Cancel
            </button>
            <button class="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700" @click="handleDelete">
              Delete
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
