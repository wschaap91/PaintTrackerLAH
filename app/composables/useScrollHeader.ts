export function useScrollHeader(options?: { threshold?: number }) {
  const threshold = options?.threshold ?? 60
  const isHeaderVisible = ref(true)

  if (!import.meta.client) return { isHeaderVisible }

  let lastScrollY = window.scrollY

  function onScroll() {
    const currentScrollY = window.scrollY

    if (currentScrollY <= threshold) {
      isHeaderVisible.value = true
    } else if (currentScrollY > lastScrollY) {
      isHeaderVisible.value = false
    } else {
      isHeaderVisible.value = true
    }

    lastScrollY = currentScrollY
  }

  onMounted(() => {
    lastScrollY = window.scrollY
    window.addEventListener('scroll', onScroll, { passive: true })
  })

  onScopeDispose(() => {
    window.removeEventListener('scroll', onScroll)
  })

  return { isHeaderVisible }
}
