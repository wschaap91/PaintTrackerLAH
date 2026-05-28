<script setup lang="ts">
const props = defineProps<{
  initialData?: Record<string, unknown>
  submitLabel?: string
  catalogMode?: boolean
}>()

const emit = defineEmits<{
  submit: [data: Record<string, unknown>]
}>()

const brands = ['Citadel', 'Vallejo', 'Army Painter', 'Scale75', 'AK Interactive', 'ProAcryl']
const types = ['base', 'layer', 'shade', 'contrast', 'dry', 'technical', 'primer', 'spray']
const statuses = ['owned', 'running_low', 'empty', 'wishlist']
const transparencies = ['transparent', 'semi_transparent', 'opaque']
const finishes = ['gloss', 'satin', 'matte']

const form = reactive({
  brand: (props.initialData?.brand as string) || '',
  name: (props.initialData?.name as string) || '',
  paintType: (props.initialData?.paintType as string) || 'base',
  hexColor: (props.initialData?.hexColor as string) || '#888888',
  status: (props.initialData?.status as string) || 'owned',
  notes: (props.initialData?.notes as string) || '',
  transparency: (props.initialData?.transparency as string) || '',
  finish: (props.initialData?.finish as string) || '',
  specialType: (props.initialData?.specialType as string) || '',
  barcode: (props.initialData?.barcode as string) || '',
  brandCode: (props.initialData?.brandCode as string) || '',
})

const customBrand = ref('')
const isCustomBrand = ref(false)

const effectiveBrand = computed(() => isCustomBrand.value ? customBrand.value : form.brand)

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function handleSubmit() {
  const data: Record<string, unknown> = {
    brand: effectiveBrand.value,
    name: form.name,
    paintType: form.paintType,
    hexColor: form.hexColor,
    status: form.status,
    notes: form.notes || null,
    transparency: form.transparency || null,
    finish: form.finish || null,
    specialType: form.specialType || null,
    barcode: form.barcode || null,
    brandCode: form.brandCode || null,
  }
  emit('submit', data)
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="handleSubmit">
    <!-- Core fields -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
        <template v-if="catalogMode">
          <p class="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {{ form.brand || '—' }}
          </p>
        </template>
        <template v-else>
          <div class="flex gap-2">
            <select
              v-if="!isCustomBrand"
              v-model="form.brand"
              class="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              <option value="" disabled>Select brand</option>
              <option v-for="b in brands" :key="b" :value="b">{{ b }}</option>
            </select>
            <input
              v-else
              v-model="customBrand"
              type="text"
              placeholder="Brand name"
              class="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
            <button
              type="button"
              class="px-3 py-2 text-xs text-accent-600 hover:text-accent-700 border border-gray-200 rounded-lg"
              @click="isCustomBrand = !isCustomBrand"
            >
              {{ isCustomBrand ? 'List' : 'Custom' }}
            </button>
          </div>
        </template>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Paint Name *</label>
        <template v-if="catalogMode">
          <p class="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {{ form.name || '—' }}
          </p>
        </template>
        <input
          v-else
          v-model="form.name"
          type="text"
          required
          placeholder="e.g. Abaddon Black"
          class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Type *</label>
        <template v-if="catalogMode">
          <p class="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {{ formatLabel(form.paintType) || '—' }}
          </p>
        </template>
        <select
          v-else
          v-model="form.paintType"
          class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          <option v-for="t in types" :key="t" :value="t">{{ formatLabel(t) }}</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          v-model="form.status"
          class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          <option v-for="s in statuses" :key="s" :value="s">{{ formatLabel(s) }}</option>
        </select>
      </div>
    </div>

    <!-- Colour picker -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Colour *</label>
      <template v-if="catalogMode">
        <div class="flex items-center gap-3">
          <ColorSwatch :color="form.hexColor" />
          <span class="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-700">
            {{ form.hexColor }}
          </span>
        </div>
      </template>
      <template v-else>
        <div class="flex items-center gap-3">
          <input
            v-model="form.hexColor"
            type="color"
            class="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
          >
          <input
            v-model="form.hexColor"
            type="text"
            pattern="^#[0-9a-fA-F]{6}$"
            placeholder="#000000"
            class="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
          <ColorSwatch :color="form.hexColor" />
        </div>
      </template>
    </div>

    <!-- Properties -->
    <div>
      <h3 class="text-sm font-medium text-gray-700 mb-3">Properties</h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Transparency</label>
          <template v-if="catalogMode">
            <p class="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {{ form.transparency ? formatLabel(form.transparency) : 'Not set' }}
            </p>
          </template>
          <select
            v-else
            v-model="form.transparency"
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <option value="">Not set</option>
            <option v-for="t in transparencies" :key="t" :value="t">{{ formatLabel(t) }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Finish</label>
          <template v-if="catalogMode">
            <p class="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {{ form.finish ? formatLabel(form.finish) : 'Not set' }}
            </p>
          </template>
          <select
            v-else
            v-model="form.finish"
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <option value="">Not set</option>
            <option v-for="f in finishes" :key="f" :value="f">{{ formatLabel(f) }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Special Type</label>
          <template v-if="catalogMode">
            <p class="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {{ form.specialType || 'Not set' }}
            </p>
          </template>
          <input
            v-else
            v-model="form.specialType"
            type="text"
            placeholder="e.g. wash, effects"
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
        </div>
      </div>
    </div>

    <!-- Metadata -->
    <div>
      <h3 class="text-sm font-medium text-gray-700 mb-3">Metadata</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Barcode</label>
          <template v-if="catalogMode">
            <p class="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-700">
              {{ form.barcode || 'Not set' }}
            </p>
          </template>
          <input
            v-else
            v-model="form.barcode"
            type="text"
            placeholder="EAN / UPC"
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Brand Code</label>
          <template v-if="catalogMode">
            <p class="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-700">
              {{ form.brandCode || 'Not set' }}
            </p>
          </template>
          <input
            v-else
            v-model="form.brandCode"
            type="text"
            placeholder="e.g. 21-01"
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
        </div>
      </div>
    </div>

    <!-- Notes -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
      <textarea
        v-model="form.notes"
        rows="3"
        placeholder="Any notes about this paint..."
        class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
      />
    </div>

    <!-- Submit -->
    <div class="flex justify-end">
      <button
        type="submit"
        class="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-700 transition-colors"
      >
        {{ submitLabel || 'Save Paint' }}
      </button>
    </div>
  </form>
</template>
