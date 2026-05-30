<script setup lang="ts">
import { api } from '../../../convex/_generated/api'

definePageMeta({ layout: false })

const route = useRoute()
const slug = route.params.slug as string

const client = useConvexClient()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// any is needed here because getPublicScheme returns a loosely-typed Convex document
const scheme = ref<any>(null)
const isLoading = ref(true)
const notFound = ref(false)
const loadError = ref(false)

onMounted(async () => {
  try {
    const result = await client.query(api.schemes.getPublicScheme, { slug })
    if (!result) {
      notFound.value = true
    }
    else {
      scheme.value = result
    }
  }
  catch (err) {
    console.error('[s/[slug].vue] Failed to load public scheme:', err)
    loadError.value = true
  }
  finally {
    isLoading.value = false
  }
})

useHead(() => ({
  title: scheme.value ? `${scheme.value.name} — PaintTracker` : 'PaintTracker',
  meta: [
    { name: 'description', content: scheme.value?.description ?? 'A paint scheme on PaintTracker' },
    { property: 'og:title', content: scheme.value ? `${scheme.value.name} — PaintTracker` : 'PaintTracker' },
    { property: 'og:image', content: '/favicon.ico' },
  ],
}))

function formatTechnique(t: string): string {
  return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

interface Area {
  _id: string
  name: string
  sortOrder: number
}

interface Step {
  _id: string
  technique: string
  notes?: string
  areaId?: string | null
  paint: { name: string; brand: string; hexColor: string } | null
}

interface StepGroup {
  areaId: string | null
  areaName: string
  steps: Array<Step & { globalIndex: number }>
}

const stepGroups = computed<StepGroup[]>(() => {
  if (!scheme.value) return []

  const steps: Step[] = scheme.value.steps ?? []
  const areas: Area[] = scheme.value.areas ?? []

  if (areas.length === 0) {
    return [{ areaId: null, areaName: '', steps: steps.map((s, i) => ({ ...s, globalIndex: i + 1 })) }]
  }

  const grouped = new Map<string | null, Array<Step & { globalIndex: number }>>()
  grouped.set(null, [])
  for (const area of areas) {
    grouped.set(area._id, [])
  }

  let counter = 1
  for (const area of areas) {
    for (const step of steps) {
      if (step.areaId === area._id) {
        grouped.get(area._id)!.push({ ...step, globalIndex: counter++ })
      }
    }
  }
  for (const step of steps) {
    if (!step.areaId || !areas.find(a => a._id === step.areaId)) {
      grouped.get(null)!.push({ ...step, globalIndex: counter++ })
    }
  }

  const result: StepGroup[] = areas.map(area => ({
    areaId: area._id,
    areaName: area.name,
    steps: grouped.get(area._id) ?? [],
  }))

  const generalSteps = grouped.get(null) ?? []
  if (generalSteps.length > 0) {
    result.push({ areaId: null, areaName: 'General', steps: generalSteps })
  }

  return result
})

const hasAreas = computed(() => (scheme.value?.areas ?? []).length > 0)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <NuxtLink to="/" class="text-lg font-semibold text-gray-900">PaintTracker</NuxtLink>
        <NuxtLink to="/auth/login" class="text-sm text-gray-500 hover:text-gray-700">Sign in</NuxtLink>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-8">
      <div v-if="isLoading" class="text-center py-16 text-gray-400">Loading…</div>

      <div v-else-if="notFound" class="text-center py-16">
        <p class="text-gray-500">Scheme not found or no longer public.</p>
        <NuxtLink to="/" class="mt-4 inline-block text-sm text-gray-700 hover:underline">Go to PaintTracker</NuxtLink>
      </div>

      <div v-else-if="loadError" class="text-center py-16">
        <p class="text-gray-500">Something went wrong loading this scheme.</p>
        <button
          @click="$router.go(0)"
          class="mt-4 inline-block text-sm text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
        >
          Try again
        </button>
      </div>

      <div v-else-if="scheme">
        <div class="mb-6">
          <h1 class="text-2xl font-semibold text-gray-900">{{ scheme.name }}</h1>
          <p v-if="scheme.description" class="mt-1 text-sm text-gray-500">{{ scheme.description }}</p>
          <p class="mt-2 text-xs text-gray-400">Shared by {{ scheme.authorName }}</p>
        </div>

        <template v-if="scheme.steps.length === 0">
          <p class="text-center py-8 text-gray-400 text-sm">This scheme has no steps.</p>
        </template>

        <template v-else-if="hasAreas">
          <div
            v-for="group in stepGroups"
            :key="group.areaId ?? 'general'"
            class="mb-8"
          >
            <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {{ group.areaName }}
            </h2>
            <div class="space-y-3">
              <div
                v-for="step in group.steps"
                :key="step._id"
                class="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4"
              >
                <span class="text-sm font-medium text-gray-400 w-6">{{ step.globalIndex }}</span>
                <div
                  v-if="step.paint"
                  class="w-8 h-8 rounded-full border border-gray-200 flex-shrink-0"
                  :style="{ backgroundColor: step.paint.hexColor }"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">
                    {{ step.paint ? `${step.paint.brand} — ${step.paint.name}` : 'No paint selected' }}
                  </p>
                  <p class="text-xs text-gray-500">{{ formatTechnique(step.technique) }}</p>
                  <p v-if="step.notes" class="text-xs text-gray-400 mt-0.5">{{ step.notes }}</p>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="space-y-3">
            <div
              v-for="step in stepGroups[0]?.steps"
              :key="step._id"
              class="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4"
            >
              <span class="text-sm font-medium text-gray-400 w-6">{{ step.globalIndex }}</span>
              <div
                v-if="step.paint"
                class="w-8 h-8 rounded-full border border-gray-200 flex-shrink-0"
                :style="{ backgroundColor: step.paint.hexColor }"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">
                  {{ step.paint ? `${step.paint.brand} — ${step.paint.name}` : 'No paint selected' }}
                </p>
                <p class="text-xs text-gray-500">{{ formatTechnique(step.technique) }}</p>
                <p v-if="step.notes" class="text-xs text-gray-400 mt-0.5">{{ step.notes }}</p>
              </div>
            </div>
          </div>
        </template>
      </div>
    </main>
  </div>
</template>
