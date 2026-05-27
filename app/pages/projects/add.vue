<script setup lang="ts">
const router = useRouter()
const error = ref('')
const { create } = useProjectMutations()

async function handleSubmit(data: { name: string, description: string | null, schemeIds: string[], paintIds: string[] }) {
  try {
    error.value = ''
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = await create(data as any)
    router.push(`/projects/${id}`)
  }
  catch {
    error.value = 'Failed to save project.'
  }
}
</script>

<template>
  <div class="max-w-3xl">
    <div class="mb-8">
      <NuxtLink to="/projects" class="text-sm text-gray-500 hover:text-gray-700">&larr; Back to projects</NuxtLink>
      <h1 class="text-2xl font-semibold text-gray-900 mt-2">Create Project</h1>
    </div>

    <div v-if="error" class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      {{ error }}
    </div>

    <div class="card">
      <ProjectForm submit-label="Create Project" @submit="handleSubmit" />
    </div>
  </div>
</template>
