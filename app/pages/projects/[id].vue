<script setup lang="ts">
import type { Id } from '../../../convex/_generated/dataModel'

const route = useRoute()
const router = useRouter()
const id = route.params.id as Id<'projects'>

const { data: project } = useProject(id)
const { update, remove } = useProjectMutations()
const isEditing = ref(false)
const error = ref('')
const showDeleteConfirm = ref(false)

const editInitial = computed(() => {
  if (!project.value) return undefined
  return {
    name: project.value.name,
    description: project.value.description,
    schemeIds: project.value.schemes.map(s => s!._id),
    paintIds: project.value.paints.map(p => p!._id),
  }
})

async function handleUpdate(data: { name: string, description: string | null, schemeIds: string[], paintIds: string[] }) {
  try {
    error.value = ''
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await update({ id, ...data } as any)
    isEditing.value = false
  }
  catch {
    error.value = 'Failed to update project.'
  }
}

async function handleDelete() {
  try {
    await remove({ id })
    router.push('/projects')
  }
  catch {
    error.value = 'Failed to delete project.'
  }
}
</script>

<template>
  <div class="max-w-3xl">
    <div class="mb-8">
      <NuxtLink to="/projects" class="text-sm text-gray-500 hover:text-gray-700">&larr; Back to projects</NuxtLink>
    </div>

    <div v-if="!project" class="text-center py-12 text-sm text-gray-500">Loading...</div>

    <template v-else>
      <div v-if="!isEditing">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">{{ project.name }}</h1>
            <p v-if="project.description" class="mt-1 text-sm text-gray-500">{{ project.description }}</p>
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

        <div v-if="project.schemes.length" class="mb-8">
          <h2 class="text-sm font-medium text-gray-700 mb-3">Schemes ({{ project.schemes.length }})</h2>
          <div class="space-y-3">
            <NuxtLink
              v-for="scheme in project.schemes"
              :key="scheme!._id"
              :to="`/schemes/${scheme!._id}`"
              class="card flex items-center gap-3 hover:shadow-md transition-shadow"
            >
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">{{ scheme!.name }}</p>
                <p v-if="scheme!.description" class="text-xs text-gray-500 mt-0.5">{{ scheme!.description }}</p>
              </div>
              <div class="flex items-center -space-x-2">
                <div
                  v-for="(color, i) in scheme!.swatches.slice(0, 5)"
                  :key="i"
                  class="w-6 h-6 rounded-full ring-2 ring-white shadow-inner"
                  :style="{ backgroundColor: color }"
                />
              </div>
            </NuxtLink>
          </div>
        </div>

        <div v-if="project.paints.length" class="mb-8">
          <h2 class="text-sm font-medium text-gray-700 mb-3">Additional Paints ({{ project.paints.length }})</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PaintCard v-for="paint in project.paints" :key="paint!._id" :paint="paint!" />
          </div>
        </div>

        <div v-if="project.missingPaints?.length" class="mb-8">
          <h2 class="text-sm font-medium text-gray-700 mb-3">Missing Paints ({{ project.missingPaints.length }})</h2>
          <p class="text-xs text-gray-400 mb-3">Used in linked schemes but not marked as owned.</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NuxtLink
              v-for="paint in project.missingPaints"
              :key="paint._id"
              :to="`/paints/${paint._id}`"
              class="card flex items-center gap-3 hover:shadow-md transition-shadow"
            >
              <ColorSwatch :color="paint.hexColor" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ paint.name }}</p>
                <p class="text-xs text-gray-500">{{ paint.brand }}<span v-if="paint.brandCode"> · {{ paint.brandCode }}</span></p>
              </div>
            </NuxtLink>
          </div>
        </div>

        <div v-if="!project.schemes.length && !project.paints.length && !project.missingPaints?.length" class="card text-center text-sm text-gray-500 py-8">
          No schemes or paints linked yet. Click Edit to add some.
        </div>
      </div>

      <div v-else>
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-semibold text-gray-900">Edit Project</h1>
          <button class="text-sm text-gray-500 hover:text-gray-700" @click="isEditing = false">
            Cancel
          </button>
        </div>

        <div v-if="error" class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {{ error }}
        </div>

        <div class="card">
          <ProjectForm :initial="editInitial" submit-label="Update Project" @submit="handleUpdate" />
        </div>
      </div>

      <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/20 flex items-center justify-center z-50" @click.self="showDeleteConfirm = false">
        <div class="bg-white rounded-xl shadow-lg p-6 max-w-sm mx-4">
          <h3 class="text-lg font-medium text-gray-900">Delete project?</h3>
          <p class="mt-2 text-sm text-gray-500">This will remove the project. Your schemes and paints are not affected.</p>
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
