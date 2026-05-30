<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 sm:pb-8">
      <slot />
    </main>
    <BottomTabBar />
  </div>
</template>
