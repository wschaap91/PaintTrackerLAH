<script setup lang="ts">
import type { AreaPayload, StepPayload } from '~/composables/useSchemes'

const router = useRouter()
const error = ref('')
const { create } = useSchemeMutations()

async function handleSubmit(data: { name: string; description: string | null; areas: AreaPayload[]; steps: StepPayload[] }) {
  try {
    error.value = ''
    const id = await create({ name: data.name, description: data.description, areas: data.areas, steps: data.steps })
    router.push(`/schemes/${id}`)
  }
  catch {
    error.value = 'Failed to save scheme.'
  }
}
</script>

<template>
  <div class="max-w-3xl">
    <div class="mb-8">
      <NuxtLink to="/schemes" class="text-sm text-gray-500 hover:text-gray-700">&larr; Back to schemes</NuxtLink>
      <h1 class="text-2xl font-semibold text-gray-900 mt-2">Create Scheme</h1>
    </div>

    <div v-if="error" class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      {{ error }}
    </div>

    <div class="card">
      <SchemeForm submit-label="Create Scheme" @submit="handleSubmit" />
    </div>
  </div>
</template>
