<script setup lang="ts">
definePageMeta({ layout: false })

const { signUp, isLoading, error } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')

async function handleSubmit() {
  try {
    await signUp(email.value, password.value)
    await router.push('/')
  } catch {
    // error is set by useAuth
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
      <h1 class="text-2xl font-semibold text-gray-900 mb-6">Create your PaintTracker account</h1>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input v-model="email" type="email" required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input v-model="password" type="password" required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button type="submit" :disabled="isLoading"
          class="w-full bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50">
          {{ isLoading ? 'Creating account…' : 'Create account' }}
        </button>
      </form>
      <p class="mt-4 text-sm text-gray-500 text-center">
        Already have an account? <NuxtLink to="/auth/login" class="text-gray-900 font-medium hover:underline">Sign in</NuxtLink>
      </p>
    </div>
  </div>
</template>
