<script setup lang="ts">
import type { Step } from './SchemeStepEditor.vue'

const props = defineProps<{
  initial?: {
    name?: string
    description?: string | null
    steps?: Step[]
  }
  submitLabel?: string
}>()

const emit = defineEmits<{
  submit: [data: { name: string, description: string | null, steps: Step[] }]
}>()

const form = reactive({
  name: props.initial?.name ?? '',
  description: props.initial?.description ?? '',
})

const steps = ref<Step[]>(
  (props.initial?.steps ?? []).map(s => ({ ...s, _uid: s._uid ?? crypto.randomUUID() })),
)

const { paints } = usePaints()

const paintOptions = computed(() =>
  (paints.value ?? []).map(p => ({
    _id: p._id,
    name: p.name,
    brand: p.brand,
    hexColor: p.hexColor,
  })),
)

function handleSubmit() {
  emit('submit', {
    name: form.name,
    description: form.description || null,
    steps: steps.value,
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
        placeholder="e.g. Space Marine Blue Armour"
        class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
      >
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
      <textarea
        v-model="form.description"
        rows="2"
        placeholder="What is this scheme for?"
        class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
      />
    </div>

    <div>
      <h3 class="text-sm font-medium text-gray-700 mb-3">Steps</h3>
      <SchemeStepEditor v-model="steps" :paints="paintOptions" />
    </div>

    <div class="flex justify-end">
      <button
        type="submit"
        class="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-700 transition-colors"
      >
        {{ submitLabel ?? 'Save Scheme' }}
      </button>
    </div>
  </form>
</template>
