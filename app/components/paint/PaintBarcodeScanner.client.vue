<script setup lang="ts">
import { Html5Qrcode } from 'html5-qrcode'

const emit = defineEmits<{
  detected: [code: string]
  error: [message: string]
}>()

const scannerEl = ref<HTMLDivElement | null>(null)
let scanner: Html5Qrcode | null = null
const isStarting = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  if (!scannerEl.value) return

  try {
    scanner = new Html5Qrcode(scannerEl.value.id)
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 150 } },
      (decodedText) => {
        emit('detected', decodedText)
      },
      () => {
        // Scan errors fire every frame without a detection — ignore.
      },
    )
    isStarting.value = false
  }
  catch (err) {
    isStarting.value = false
    const message = err instanceof Error ? err.message : 'Could not start camera'
    errorMessage.value = message
    emit('error', message)
  }
})

onBeforeUnmount(async () => {
  if (scanner && scanner.isScanning) {
    try {
      await scanner.stop()
      scanner.clear()
    }
    catch {
      // Camera already released
    }
  }
})
</script>

<template>
  <div>
    <div
      id="paint-barcode-scanner"
      ref="scannerEl"
      class="rounded-lg overflow-hidden bg-gray-100 aspect-video"
    />
    <p v-if="isStarting" class="text-xs text-gray-500 mt-2 text-center">Starting camera...</p>
    <p v-if="errorMessage" class="text-xs text-red-600 mt-2 text-center">{{ errorMessage }}</p>
  </div>
</template>
