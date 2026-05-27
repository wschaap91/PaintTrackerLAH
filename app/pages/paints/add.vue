<script setup lang="ts">
const router = useRouter()
const error = ref('')
const { addPaint } = usePaints()

async function handleSubmit(data: Record<string, unknown>) {
  try {
    error.value = ''
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = await addPaint(data as any)
    router.push(`/paints/${id}`)
  }
  catch {
    error.value = 'Failed to save paint.'
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <div class="mb-8">
      <NuxtLink to="/paints" class="text-sm text-gray-500 hover:text-gray-700">&larr; Back to paints</NuxtLink>
      <h1 class="text-2xl font-semibold text-gray-900 mt-2">Add Paint</h1>
    </div>

    <div v-if="error" class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      {{ error }}
    </div>

    <div class="card">
      <PaintForm submit-label="Add Paint" @submit="handleSubmit" />
    </div>
  </div>
</template>
