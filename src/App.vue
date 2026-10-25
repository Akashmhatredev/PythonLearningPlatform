<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/layout/AppHeader.vue'
import AppSidebar from './components/layout/AppSidebar.vue'
import AppFooter from './components/layout/AppFooter.vue'
import SearchPalette from './components/layout/SearchPalette.vue'
import ToastHost from './components/ui/ToastHost.vue'
import { usePreferencesStore } from './stores/preferences.js'

// Instantiating the store applies the saved theme & motion preferences.
usePreferencesStore()

const route = useRoute()
const isLearn = computed(() => route.meta.layout === 'learn')
const viewKey = computed(() => (route.name === 'lesson' ? route.params.lessonId : route.path))
</script>

<template>
  <a class="skip-link" href="#main">Skip to content</a>
  <AppHeader />
  <div class="shell" :class="{ 'shell--learn': isLearn }">
    <AppSidebar v-if="isLearn" />
    <main id="main" class="shell__main" tabindex="-1">
      <RouterView v-slot="{ Component }">
        <component :is="Component" :key="viewKey" />
      </RouterView>
    </main>
  </div>
  <AppFooter />
  <SearchPalette />
  <ToastHost />
</template>

<style scoped>
.shell {
  min-height: calc(100vh - var(--header-h));
}
.shell--learn {
  display: flex;
  align-items: flex-start;
}
.shell__main {
  min-width: 0;
  flex: 1;
}
.shell__main:focus {
  outline: none;
}
</style>
