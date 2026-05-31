<script setup lang="ts">
const emit = defineEmits<{
  importExport: []
  logout: []
}>()

const isOpen = ref(false)
const menuContainer = ref<HTMLElement | null>(null)

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

function handleAction(event: 'importExport' | 'logout') {
  close()
  emit(event)
}

function onOutsideClick(e: MouseEvent) {
  if (!isOpen.value) return
  if (menuContainer.value && !menuContainer.value.contains(e.target as Node)) {
    close()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', onOutsideClick)
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', onOutsideClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="menuContainer" class="relative">
    <button
      class="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
      aria-label="Open menu"
      @click.stop="toggle"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
      </svg>
    </button>

    <div v-if="isOpen" class="absolute right-0 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg z-50 py-1">
      <button
        class="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        @click="handleAction('importExport')"
      >
        Import / Export
      </button>
      <div class="border-t border-gray-100" />
      <button
        class="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
        @click="handleAction('logout')"
      >
        Sign out
      </button>
    </div>
  </div>
</template>
