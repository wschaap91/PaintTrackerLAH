<script setup lang="ts">
import type { Id } from '../../../convex/_generated/dataModel'
import type { AreaPayload, StepPayload, SchemeArea, SchemeStep } from '~/composables/useSchemes'

interface StepGroup {
  areaId: string | null
  areaName: string
  steps: Array<SchemeStep & { globalIndex: number }>
}

const route = useRoute()
const router = useRouter()
const id = route.params.id as Id<'schemes'>

const { data: scheme } = useScheme(id)
const { update, remove, setPublic } = useSchemeMutations()
const isEditing = ref(false)
const error = ref('')
const showDeleteConfirm = ref(false)
const copied = ref(false)
const isTogglingPublic = ref(false)
const copyFailed = ref(false)
const origin = import.meta.client ? window.location.origin : ''

async function togglePublic() {
  if (!scheme.value || isTogglingPublic.value) return
  isTogglingPublic.value = true
  error.value = ''
  try {
    error.value = ''
    await setPublic({ id, isPublic: !scheme.value.isPublic })
  }
  catch {
    error.value = 'Failed to update sharing settings.'
  }
  finally {
    isTogglingPublic.value = false
  }
}

async function copyLink() {
  const slug = scheme.value?.slug
  if (!slug) return
  const url = `${window.location.origin}/s/${slug}`
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
  catch {
    copyFailed.value = true
    setTimeout(() => { copyFailed.value = false }, 2000)
  }
}

const stepGroups = computed<StepGroup[]>(() => {
  if (!scheme.value) return []

  const steps: SchemeStep[] = scheme.value.steps ?? []
  const areas: SchemeArea[] = scheme.value.areas ?? []

  if (areas.length === 0) {
    return [{ areaId: null, areaName: '', steps: steps.map((s, i) => ({ ...s, globalIndex: i + 1 })) }]
  }

  const grouped = new Map<string | null, Array<SchemeStep & { globalIndex: number }>>()
  grouped.set(null, [])
  for (const area of areas) {
    grouped.set(area._id, [])
  }

  let counter = 1
  for (const step of steps) {
    const bucket = step.areaId != null && grouped.has(step.areaId) ? step.areaId : null
    grouped.get(bucket)!.push({ ...step, globalIndex: counter++ })
  }

  const result: StepGroup[] = [...areas]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(area => ({
      areaId: area._id,
      areaName: area.name,
      steps: grouped.get(area._id) ?? [],
    }))

  const generalSteps = grouped.get(null) ?? []
  if (generalSteps.length > 0) {
    result.push({ areaId: null, areaName: 'General', steps: generalSteps })
  }

  return result.filter(g => g.steps.length > 0)
})

const editInitial = computed(() => {
  if (!scheme.value) return undefined

  const sortedAreas = [...scheme.value.areas].sort((a, b) => a.sortOrder - b.sortOrder)
  const ungroupedSteps = scheme.value.steps
    .filter(s => s.areaId == null)
    .map(s => ({ paintId: s.paintId, technique: s.technique, notes: s.notes }))

  const areas = sortedAreas.map(area => ({
    name: area.name,
    steps: scheme.value!.steps
      .filter(s => s.areaId === area._id)
      .map(s => ({ paintId: s.paintId, technique: s.technique, notes: s.notes })),
  }))

  return {
    name: scheme.value.name,
    description: scheme.value.description,
    steps: ungroupedSteps,
    areas,
  }
})

async function handleUpdate(data: { name: string; description: string | null; areas: AreaPayload[]; steps: StepPayload[] }) {
  try {
    error.value = ''
    await update({ id, name: data.name, description: data.description, areas: data.areas, steps: data.steps })
    isEditing.value = false
  }
  catch {
    error.value = 'Failed to update scheme.'
  }
}

async function handleDelete() {
  try {
    await remove({ id })
    router.push('/schemes')
  }
  catch {
    error.value = 'Failed to delete scheme.'
  }
}
</script>

<template>
  <div class="max-w-3xl">
    <div class="mb-8">
      <NuxtLink to="/schemes" class="text-sm text-gray-500 hover:text-gray-700">&larr; Back to schemes</NuxtLink>
    </div>

    <div v-if="!scheme" class="text-center py-12 text-sm text-gray-500">Loading...</div>

    <template v-else>
      <div v-if="!isEditing">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">{{ scheme.name }}</h1>
            <p v-if="scheme.description" class="mt-1 text-sm text-gray-500">{{ scheme.description }}</p>
          </div>
          <div class="flex gap-2 flex-shrink-0">
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

        <div v-if="!scheme.steps.length" class="card text-center text-sm text-gray-500 py-8">
          No steps in this scheme yet. Click Edit to add some.
        </div>

        <template v-else>
          <div
            v-for="group in stepGroups"
            :key="group.areaId ?? 'general'"
            class="mb-6"
          >
            <h2
              v-if="group.areaName"
              class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2"
            >
              {{ group.areaName }}
            </h2>
            <ol class="space-y-3">
              <SchemeStepCard
                v-for="step in group.steps"
                :key="step._id"
                :index="step.globalIndex"
                :paint="step.paint ?? null"
                :technique="step.technique"
                :notes="step.notes"
              />
            </ol>
          </div>
        </template>

        <div v-if="error" class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {{ error }}
        </div>

        <!-- Sharing section -->
        <div class="mt-6 bg-white rounded-lg border border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-900">Public sharing</h3>
              <p class="text-xs text-gray-500 mt-0.5">Make this scheme visible to anyone with the link</p>
            </div>
            <button
              :disabled="isTogglingPublic"
              :class="[
                scheme.isPublic ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700',
                isTogglingPublic ? 'opacity-50 cursor-not-allowed' : '',
              ]"
              class="relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
              @click="togglePublic"
            >
              <span
                :class="scheme.isPublic ? 'translate-x-7' : 'translate-x-1'"
                class="inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow"
              />
            </button>
          </div>
          <div v-if="scheme.isPublic && scheme.slug" class="mt-3 flex items-center gap-2">
            <input
              :value="`${origin}/s/${scheme.slug}`"
              readonly
              class="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
            />
            <button
              class="text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 flex-shrink-0"
              @click="copyLink"
            >
              {{ copied ? 'Copied!' : copyFailed ? 'Failed!' : 'Copy' }}
            </button>
          </div>
        </div>
      </div>

      <div v-else>
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-semibold text-gray-900">Edit Scheme</h1>
          <button class="text-sm text-gray-500 hover:text-gray-700" @click="isEditing = false">
            Cancel
          </button>
        </div>

        <div v-if="error" class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {{ error }}
        </div>

        <div class="card">
          <SchemeForm :initial="editInitial" submit-label="Update Scheme" @submit="handleUpdate" />
        </div>
      </div>

      <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/20 flex items-center justify-center z-50" @click.self="showDeleteConfirm = false">
        <div class="bg-white rounded-xl shadow-lg p-6 max-w-sm mx-4">
          <h3 class="text-lg font-medium text-gray-900">Delete scheme?</h3>
          <p class="mt-2 text-sm text-gray-500">This will permanently remove <strong>{{ scheme.name }}</strong>. Your paints are not affected.</p>
          <div class="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button class="rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50" @click="showDeleteConfirm = false">
              Cancel
            </button>
            <button class="rounded-lg bg-red-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-red-700" @click="handleDelete">
              Delete
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
