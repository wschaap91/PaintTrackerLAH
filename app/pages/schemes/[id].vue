<script setup lang="ts">
import type { Id } from '../../../convex/_generated/dataModel'
import type { AreaPayload, StepPayload } from '~/composables/useSchemes'

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

function formatTechnique(t: string): string {
  return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const editInitial = computed(() => {
  if (!scheme.value) return undefined

  const sortedAreas = [...scheme.value.areas].sort((a, b) => a.sortOrder - b.sortOrder)
  const ungroupedSteps = scheme.value.steps
    .filter(s => s.areaId === null)
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
        <div class="flex items-start justify-between mb-6">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">{{ scheme.name }}</h1>
            <p v-if="scheme.description" class="mt-1 text-sm text-gray-500">{{ scheme.description }}</p>
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

        <div v-if="!scheme.steps.length" class="card text-center text-sm text-gray-500 py-8">
          No steps in this scheme yet. Click Edit to add some.
        </div>

        <!-- Flat list when no areas defined (backward compat) -->
        <template v-else-if="!scheme.areas.length">
          <ol class="space-y-3">
            <li v-for="(step, i) in scheme.steps" :key="step._id" class="card flex items-start gap-4">
              <div class="text-xs font-mono text-gray-400 mt-1 w-6">{{ i + 1 }}.</div>
              <ColorSwatch :color="step.paint?.hexColor || '#e5e7eb'" />
              <div class="flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="text-sm font-medium text-gray-900">
                    {{ step.paint?.name || 'Paint removed' }}
                  </p>
                  <span v-if="step.paint" class="text-xs text-gray-400">{{ step.paint.brand }}</span>
                </div>
                <p class="text-xs text-accent-600 mt-0.5">{{ formatTechnique(step.technique) }}</p>
                <p v-if="step.notes" class="text-xs text-gray-500 mt-1">{{ step.notes }}</p>
              </div>
            </li>
          </ol>
        </template>

        <!-- Area-grouped view -->
        <template v-else>
          <!-- Named areas sorted by sortOrder -->
          <div
            v-for="area in [...scheme.areas].sort((a, b) => a.sortOrder - b.sortOrder)"
            :key="area._id"
            class="mb-6"
          >
            <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">{{ area.name }}</h2>
            <ol class="space-y-3">
              <li
                v-for="(step, i) in scheme.steps.filter(s => s.areaId === area._id)"
                :key="step._id"
                class="card flex items-start gap-4"
              >
                <div class="text-xs font-mono text-gray-400 mt-1 w-6">{{ i + 1 }}.</div>
                <ColorSwatch :color="step.paint?.hexColor || '#e5e7eb'" />
                <div class="flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="text-sm font-medium text-gray-900">
                      {{ step.paint?.name || 'Paint removed' }}
                    </p>
                    <span v-if="step.paint" class="text-xs text-gray-400">{{ step.paint.brand }}</span>
                  </div>
                  <p class="text-xs text-accent-600 mt-0.5">{{ formatTechnique(step.technique) }}</p>
                  <p v-if="step.notes" class="text-xs text-gray-500 mt-1">{{ step.notes }}</p>
                </div>
              </li>
            </ol>
          </div>

          <!-- Ungrouped steps shown in "General" section when mixed with areas -->
          <div v-if="scheme.steps.some(s => s.areaId === null)" class="mb-6">
            <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">General</h2>
            <ol class="space-y-3">
              <li
                v-for="(step, i) in scheme.steps.filter(s => s.areaId === null)"
                :key="step._id"
                class="card flex items-start gap-4"
              >
                <div class="text-xs font-mono text-gray-400 mt-1 w-6">{{ i + 1 }}.</div>
                <ColorSwatch :color="step.paint?.hexColor || '#e5e7eb'" />
                <div class="flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="text-sm font-medium text-gray-900">
                      {{ step.paint?.name || 'Paint removed' }}
                    </p>
                    <span v-if="step.paint" class="text-xs text-gray-400">{{ step.paint.brand }}</span>
                  </div>
                  <p class="text-xs text-accent-600 mt-0.5">{{ formatTechnique(step.technique) }}</p>
                  <p v-if="step.notes" class="text-xs text-gray-500 mt-1">{{ step.notes }}</p>
                </div>
              </li>
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
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
              @click="togglePublic"
            >
              <span
                :class="scheme.isPublic ? 'translate-x-6' : 'translate-x-1'"
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow"
              />
            </button>
          </div>
          <div v-if="scheme.isPublic && scheme.slug" class="mt-3 flex items-center gap-2">
            <input
              :value="`${origin}/s/${scheme.slug}`"
              readonly
              class="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 bg-gray-50 text-gray-600"
            />
            <button
              class="text-xs text-gray-700 border border-gray-200 rounded px-2 py-1.5 hover:bg-gray-50"
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
