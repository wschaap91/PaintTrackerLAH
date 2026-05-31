<script setup lang="ts">
import draggable from 'vuedraggable'

export interface PaintOption {
  _id: string
  name: string
  brand: string
  hexColor: string
}

export interface Step {
  _uid?: string
  paintId: string | null
  technique: string
  notes: string | null
}

const steps = defineModel<Step[]>({ required: true })

const props = defineProps<{
  paints: PaintOption[]
  group?: string
}>()

const techniques = [
  { value: 'base_coat', label: 'Base Coat' },
  { value: 'layer', label: 'Layer' },
  { value: 'wash', label: 'Wash' },
  { value: 'drybrush', label: 'Drybrush' },
  { value: 'highlight', label: 'Highlight' },
  { value: 'edge_highlight', label: 'Edge Highlight' },
  { value: 'glaze', label: 'Glaze' },
  { value: 'contrast', label: 'Contrast' },
]

const dragGroup = computed(() => props.group ?? 'steps')

function stepKey(step: Step): string {
  return step._uid ?? (step.paintId ?? '') + step.technique
}

function addStep() {
  steps.value.push({ _uid: crypto.randomUUID(), paintId: null, technique: 'base_coat', notes: null })
}

function removeStep(index: number) {
  steps.value.splice(index, 1)
}

function getPaintColor(paintId: string | null): string {
  if (!paintId) return '#e5e7eb'
  return props.paints.find(p => p._id === paintId)?.hexColor ?? '#e5e7eb'
}
</script>

<template>
  <div>
    <draggable
      v-model="steps"
      handle=".drag-handle"
      :item-key="stepKey"
      :group="dragGroup"
      :animation="200"
      ghost-class="opacity-50"
    >
      <template #item="{ element, index }">
        <div class="flex items-start gap-2 mb-2 p-3 bg-gray-50 rounded-lg">
          <button
            type="button"
            class="drag-handle p-1.5 -m-1.5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing mt-2"
            aria-label="Drag to reorder"
          >
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 4a1 1 0 100 2 1 1 0 000-2zM7 9a1 1 0 100 2 1 1 0 000-2zM7 14a1 1 0 100 2 1 1 0 000-2zM13 4a1 1 0 100 2 1 1 0 000-2zM13 9a1 1 0 100 2 1 1 0 000-2zM13 14a1 1 0 100 2 1 1 0 000-2z" />
            </svg>
          </button>

          <div
            class="w-8 h-8 rounded-full ring-1 ring-gray-200 shadow-inner mt-1.5 flex-shrink-0"
            :style="{ backgroundColor: getPaintColor(element.paintId) }"
          />

          <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              v-model="element.paintId"
              class="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              <option :value="null">Select paint...</option>
              <option v-for="p in paints" :key="p._id" :value="p._id">
                {{ p.name }} ({{ p.brand }})
              </option>
            </select>

            <select
              v-model="element.technique"
              class="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              <option v-for="t in techniques" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>

            <input
              v-model="element.notes"
              type="text"
              placeholder="Notes (optional)"
              class="sm:col-span-2 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
          </div>

          <button
            type="button"
            class="p-1.5 -m-1.5 text-gray-400 hover:text-red-600 transition-colors mt-2"
            aria-label="Remove step"
            @click="removeStep(index)"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </template>
    </draggable>

    <button
      type="button"
      class="w-full rounded-lg border-2 border-dashed border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 hover:border-accent-300 hover:text-accent-600 transition-colors"
      @click="addStep"
    >
      + Add Step
    </button>
  </div>
</template>
