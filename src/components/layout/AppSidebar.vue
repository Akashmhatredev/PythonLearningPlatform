<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Check, ChevronRight, Circle, CircleDashed, PanelLeftClose, X } from 'lucide-vue-next'
import { contentIndex } from '../../content/index.js'
import { usePreferencesStore } from '../../stores/preferences.js'
import { useProgressStore } from '../../stores/progress.js'
import { useUiStore } from '../../stores/ui.js'
import { useMediaQuery } from '../../composables/useMediaQuery.js'

const route = useRoute()
const progress = useProgressStore()
const prefs = usePreferencesStore()
const ui = useUiStore()
const isDesktop = useMediaQuery('(min-width: 1101px)')
const listEl = ref(null)

const currentLesson = computed(() => route.params.lessonId)
const currentLevel = computed(() => contentIndex.lessons[currentLesson.value]?.level)
const expanded = reactive({})

watch(
  currentLevel,
  async (lvl) => {
    if (lvl) expanded[lvl] = true
    await nextTick()
    listEl.value?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' })
  },
  { immediate: true },
)
watch(
  () => route.fullPath,
  () => (ui.sidebarDrawerOpen = false),
)

const levels = computed(() =>
  contentIndex.levels.map((level) => {
    const lessons = level.lessons.map((id) => contentIndex.lessons[id])
    const ready = lessons.filter((l) => l.status === 'ready')
    return {
      ...level,
      items: lessons,
      done: ready.filter((l) => progress.isComplete(l.id)).length,
      ready: ready.length,
    }
  }),
)

function statusOf(lesson) {
  if (lesson.status !== 'ready') return 'planned'
  if (progress.isComplete(lesson.id)) return 'done'
  if (progress.lessonState(lesson.id)?.lastVisitedAt) return 'started'
  return 'new'
}

const visible = computed(() => (isDesktop.value ? prefs.prefs.sidebarOpen : ui.sidebarDrawerOpen))
</script>

<template>
  <div v-if="!isDesktop && ui.sidebarDrawerOpen" class="scrim" aria-hidden="true" @click="ui.sidebarDrawerOpen = false" />
  <aside
    v-show="visible"
    id="course-sidebar"
    class="sidebar"
    :class="{ 'sidebar--drawer': !isDesktop }"
    aria-label="Course map"
  >
    <div class="sidebar__head">
      <span class="label">Course map</span>
      <button
        v-if="isDesktop"
        type="button"
        class="btn btn--icon btn--sm btn--ghost"
        aria-label="Hide course map"
        @click="prefs.toggleSidebar()"
      >
        <PanelLeftClose :size="16" aria-hidden="true" />
      </button>
      <button v-else type="button" class="btn btn--icon btn--sm btn--ghost" aria-label="Close course map" @click="ui.sidebarDrawerOpen = false">
        <X :size="16" aria-hidden="true" />
      </button>
    </div>
    <ol ref="listEl" class="levels">
      <li v-for="level in levels" :key="level.id" class="level">
        <button
          type="button"
          class="level__btn"
          :aria-expanded="!!expanded[level.id]"
          :aria-controls="`side-${level.id}`"
          @click="expanded[level.id] = !expanded[level.id]"
        >
          <ChevronRight class="level__chev" :size="14" aria-hidden="true" />
          <span class="level__num mono">{{ String(level.number).padStart(2, '0') }}</span>
          <span class="level__title">{{ level.short }}</span>
          <span class="level__count mono"><span aria-hidden="true">{{ level.done }}/{{ level.ready }}</span><span class="visually-hidden">{{ level.done }} of {{ level.ready }} done</span></span>
        </button>
        <ol v-show="expanded[level.id]" :id="`side-${level.id}`" class="lessons">
          <li v-for="lesson in level.items" :key="lesson.id">
            <RouterLink
              v-if="lesson.status === 'ready'"
              :to="lesson.path"
              class="lesson"
              :class="`lesson--${statusOf(lesson)}`"
              :aria-current="lesson.id === currentLesson ? 'page' : undefined"
            >
              <Check v-if="statusOf(lesson) === 'done'" class="lesson__icon" :size="14" aria-label="completed" />
              <Circle v-else-if="statusOf(lesson) === 'started'" class="lesson__icon lesson__icon--half" :size="14" aria-label="in progress" />
              <Circle v-else class="lesson__icon" :size="14" aria-label="not started" />
              <span>{{ lesson.title }}</span>
            </RouterLink>
            <span v-else class="lesson lesson--planned">
              <CircleDashed class="lesson__icon" :size="14" aria-label="planned" />
              <span>{{ lesson.title }} <em class="label">planned</em></span>
            </span>
          </li>
        </ol>
      </li>
    </ol>
  </aside>
</template>

<style scoped>
.sidebar {
  position: sticky;
  top: var(--header-h);
  height: calc(100vh - var(--header-h));
  width: var(--sidebar-w);
  flex: none;
  overflow-y: auto;
  border-right: var(--border);
  background: var(--bg);
  scrollbar-width: thin;
}
.sidebar--drawer {
  position: fixed;
  left: 0;
  top: var(--header-h);
  z-index: 45;
  width: min(340px, 88vw);
  box-shadow: 8px 0 0 var(--shadow-color);
}
.scrim {
  position: fixed;
  inset: var(--header-h) 0 0 0;
  z-index: 44;
  background: color-mix(in srgb, #1a1a1a 45%, transparent);
}
.sidebar__head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--s-2) var(--s-2) var(--s-2) var(--s-4);
  background: var(--bg);
  border-bottom: var(--border-thin);
}
.levels,
.lessons {
  list-style: none;
  margin: 0;
  padding: 0;
}
.level + .level {
  margin-top: 0;
}
.level {
  border-bottom: 1.5px dashed color-mix(in srgb, var(--line) 30%, transparent);
}
.level__btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px var(--s-3) 10px var(--s-3);
  border: 0;
  background: none;
  text-align: left;
}
.level__btn:hover {
  background: var(--surface-2);
}
.level__chev {
  transition: transform var(--quick) var(--snap);
  flex: none;
}
.level__btn[aria-expanded='true'] .level__chev {
  transform: rotate(90deg);
}
.level__num {
  font-weight: 800;
  font-size: 0.75rem;
  background: var(--text);
  color: var(--bg);
  padding: 1px 5px;
}
.level__title {
  font-weight: 800;
  font-size: 0.92rem;
  flex: 1;
}
.level__count {
  font-size: 0.7rem;
  color: var(--muted);
}
.lessons {
  padding: 0 0 var(--s-3) 0;
}
.lessons li + li {
  margin-top: 0;
}
.lesson {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 6px var(--s-3) 6px 34px;
  font-size: 0.86rem;
  line-height: 1.35;
  text-decoration: none;
  color: var(--text-soft);
}
a.lesson:hover {
  background: var(--acid);
  color: var(--acid-ink);
}
.lesson[aria-current='page'] {
  background: var(--text);
  color: var(--bg);
  font-weight: 700;
}
.lesson__icon {
  flex: none;
  margin-top: 2px;
}
.lesson--done .lesson__icon {
  color: var(--green);
}
.lesson[aria-current='page'] .lesson__icon {
  color: var(--acid);
}
.lesson__icon--half {
  fill: currentColor;
  fill-opacity: 0.35;
}
.lesson--planned {
  color: var(--muted);
  opacity: 0.75;
}
.lesson--planned em {
  font-style: normal;
  margin-left: 4px;
  font-size: 0.6rem;
}
</style>
