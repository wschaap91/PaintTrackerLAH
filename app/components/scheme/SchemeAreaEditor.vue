<script setup lang="ts">
import draggable from 'vuedraggable'
import type { PaintOption, Step } from './SchemeStepEditor.vue'

export interface AreaDraft {
  _uid: string
  name: string
  steps: Step[]
}

export interface AreaEditorModel {
  areas: AreaDraft[]
  ungroupedSteps: Step[]
}

const model = defineModel<AreaEditorModel>({ required: true })

defineProps<{
  paints: PaintOption[]
}>()

function addArea() {
  model.value.areas.push({
    _uid: crypto.randomUUID(),
    name: 'New Area',
    steps: [],
  })
}

function deleteArea(index: number) {
  const removed = model.value.areas[index]
  model.value.areas.splice(index, 1)
  if (removed) {
    // Move steps to ungrouped so they are not lost
    model.value.ungroupedSteps.push(...removed.steps)
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Ungrouped / General section (non-deletable) -->
    <div class="rounded-xl border border-gray-200 bg-white p-4">
      <h4 class="text-sm font-semibold text-gray-700 mb-3">General</h4>
      <SchemeStepEditor v-model="model.ungroupedSteps" :paints="paints" group="steps" />
    </div>

    <!-- Named areas (draggable to reorder) -->
    <draggable
      v-model="model.areas"
      handle=".area-drag-handle"
      item-key="_uid"
      group="areas"
      :animation="200"
      ghost-class="opacity-50"
    >
      <template #item="{ element, index }">
        <div class="rounded-xl border border-gray-200 bg-white p-4 mb-3">
          <!-- Area header: drag handle + name input + delete -->
          <div class="flex items-center gap-2 mb-3">
            <button
              type="button"
              class="area-drag-handle p-1.5 -m-1.5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0"
              aria-label="Drag area to reorder"
            >
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 4a1 1 0 100 2 1 1 0 000-2zM7 9a1 1 0 100 2 1 1 0 000-2zM7 14a1 1 0 100 2 1 1 0 000-2zM13 4a1 1 0 100 2 1 1 0 000-2zM13 9a1 1 0 100 2 1 1 0 000-2zM13 14a1 1 0 100 2 1 1 0 000-2z" />
              </svg>
            </button>

            <input
              v-model="element.name"
              type="text"
              placeholder="Area name"
              class="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-500"
            >

            <button
              type="button"
              class="p-1.5 -m-1.5 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
              :aria-label="`Delete ${element.name} area`"
              @click="deleteArea(index)"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Steps within this area -->
          <SchemeStepEditor v-model="element.steps" :paints="paints" group="steps" />
        </div>
      </template>
    </draggable>

    <!-- Add Area button -->
    <button
      type="button"
      class="w-full rounded-lg border-2 border-dashed border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 hover:border-accent-300 hover:text-accent-600 transition-colors"
      @click="addArea"
    >
      + Add Area
    </button>
  </div>
</template>
