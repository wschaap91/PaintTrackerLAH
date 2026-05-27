<script setup lang="ts">
const props = defineProps<{
  initial?: {
    name?: string
    description?: string | null
    schemeIds?: string[]
    paintIds?: string[]
  }
  submitLabel?: string
}>()

const emit = defineEmits<{
  submit: [data: { name: string, description: string | null, schemeIds: string[], paintIds: string[] }]
}>()

const form = reactive({
  name: props.initial?.name ?? '',
  description: props.initial?.description ?? '',
})

const selectedSchemes = ref<string[]>(props.initial?.schemeIds ?? [])
const selectedPaints = ref<string[]>(props.initial?.paintIds ?? [])

const { data: schemes } = useSchemes()
const { paints } = usePaints()

const schemeSearch = ref('')
const paintSearch = ref('')

const filteredSchemes = computed(() => {
  const list = schemes.value ?? []
  if (!schemeSearch.value) return list
  const q = schemeSearch.value.toLowerCase()
  return list.filter(s => s.name.toLowerCase().includes(q))
})

const filteredPaints = computed(() => {
  const list = paints.value ?? []
  if (!paintSearch.value) return list
  const q = paintSearch.value.toLowerCase()
  return list.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
})

function toggleScheme(id: string) {
  const idx = selectedSchemes.value.indexOf(id)
  if (idx >= 0) selectedSchemes.value.splice(idx, 1)
  else selectedSchemes.value.push(id)
}

function togglePaint(id: string) {
  const idx = selectedPaints.value.indexOf(id)
  if (idx >= 0) selectedPaints.value.splice(idx, 1)
  else selectedPaints.value.push(id)
}

function handleSubmit() {
  emit('submit', {
    name: form.name,
    description: form.description || null,
    schemeIds: selectedSchemes.value,
    paintIds: selectedPaints.value,
  })
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="handleSubmit">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
      <input
        v-model="form.name"
        type="text"
        required
        placeholder="e.g. Blood Angels Army"
        class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
      >
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
      <textarea
        v-model="form.description"
        rows="2"
        placeholder="What is this project?"
        class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
      />
    </div>

    <!-- Schemes -->
    <div>
      <h3 class="text-sm font-medium text-gray-700 mb-2">Schemes ({{ selectedSchemes.length }} selected)</h3>
      <input
        v-model="schemeSearch"
        type="text"
        placeholder="Search schemes..."
        class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-accent-500"
      >
      <div class="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
        <p v-if="!filteredSchemes.length" class="text-sm text-gray-500 p-3 text-center">No schemes yet</p>
        <label
          v-for="scheme in filteredSchemes"
          :key="scheme._id"
          class="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer"
        >
          <input
            type="checkbox"
            :checked="selectedSchemes.includes(scheme._id)"
            class="rounded border-gray-300 text-accent-600 focus:ring-accent-500"
            @change="toggleScheme(scheme._id)"
          >
          <span class="text-sm text-gray-900 flex-1">{{ scheme.name }}</span>
          <span class="text-xs text-gray-400">{{ scheme.stepCount }} steps</span>
        </label>
      </div>
    </div>

    <!-- Additional Paints -->
    <div>
      <h3 class="text-sm font-medium text-gray-700 mb-2">Additional Paints ({{ selectedPaints.length }} selected)</h3>
      <input
        v-model="paintSearch"
        type="text"
        placeholder="Search paints..."
        class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-accent-500"
      >
      <div class="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
        <p v-if="!filteredPaints.length" class="text-sm text-gray-500 p-3 text-center">No paints yet</p>
        <label
          v-for="paint in filteredPaints"
          :key="paint._id"
          class="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer"
        >
          <input
            type="checkbox"
            :checked="selectedPaints.includes(paint._id)"
            class="rounded border-gray-300 text-accent-600 focus:ring-accent-500"
            @change="togglePaint(paint._id)"
          >
          <ColorSwatch :color="paint.hexColor" size="sm" />
          <span class="text-sm text-gray-900 flex-1">{{ paint.name }}</span>
          <span class="text-xs text-gray-400">{{ paint.brand }}</span>
        </label>
      </div>
    </div>

    <div class="flex justify-end">
      <button
        type="submit"
        class="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-700 transition-colors"
      >
        {{ submitLabel ?? 'Save Project' }}
      </button>
    </div>
  </form>
</template>
