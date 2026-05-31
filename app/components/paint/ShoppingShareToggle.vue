<script setup lang="ts">
const { settings, setPublic } = useShoppingListSettings()

const copied = ref(false)
const isTogglingPublic = ref(false)
const copyFailed = ref(false)
const toggleError = ref('')
const origin = import.meta.client ? window.location.origin : ''

async function togglePublic() {
  if (isTogglingPublic.value) return
  isTogglingPublic.value = true
  toggleError.value = ''
  try {
    await setPublic({ isPublic: !settings.value?.shoppingListPublic })
  }
  catch {
    toggleError.value = 'Failed to update sharing settings.'
  }
  finally {
    isTogglingPublic.value = false
  }
}

async function copyLink() {
  const slug = settings.value?.shoppingListSlug
  if (!slug) return
  const url = `${window.location.origin}/s/shopping/${slug}`
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
</script>

<template>
  <div class="mt-6 bg-white rounded-lg border border-gray-200 p-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-medium text-gray-900">Public sharing</h3>
        <p class="text-xs text-gray-500 mt-0.5">Make your shopping list visible to anyone with the link</p>
      </div>
      <button
        :disabled="isTogglingPublic"
        :class="[
          settings?.shoppingListPublic ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700',
          isTogglingPublic ? 'opacity-50 cursor-not-allowed' : '',
        ]"
        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
        @click="togglePublic"
      >
        <span
          :class="settings?.shoppingListPublic ? 'translate-x-6' : 'translate-x-1'"
          class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow"
        />
      </button>
    </div>
    <div v-if="settings?.shoppingListPublic && settings?.shoppingListSlug" class="mt-3 flex items-center gap-2">
      <input
        :value="`${origin}/s/shopping/${settings.shoppingListSlug}`"
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
    <div v-if="toggleError" class="mt-3 text-xs text-red-600">
      {{ toggleError }}
    </div>
  </div>
</template>
