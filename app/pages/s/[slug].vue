<script setup lang="ts">
import { api } from '../../../convex/_generated/api'

definePageMeta({ layout: false })

const route = useRoute()
const slug = route.params.slug as string

const client = useConvexClient()
const scheme = ref<any>(null)
const isLoading = ref(true)
const notFound = ref(false)

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
    notFound.value = true
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

      <div v-else-if="scheme">
        <div class="mb-6">
          <h1 class="text-2xl font-semibold text-gray-900">{{ scheme.name }}</h1>
          <p v-if="scheme.description" class="mt-1 text-sm text-gray-500">{{ scheme.description }}</p>
          <p class="mt-2 text-xs text-gray-400">Shared by {{ scheme.authorName }}</p>
        </div>

        <div class="space-y-3">
          <div
            v-for="(step, i) in scheme.steps"
            :key="step._id"
            class="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4"
          >
            <span class="text-sm font-medium text-gray-400 w-6">{{ i + 1 }}</span>
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

        <p v-if="scheme.steps.length === 0" class="text-center py-8 text-gray-400 text-sm">
          This scheme has no steps.
        </p>
      </div>
    </main>
  </div>
</template>
