import { createRouter, createWebHistory } from 'vue-router'
import { getLessonMeta, getLevel } from '../content/index.js'

// Every page is lazy-loaded so the landing page ships only what it needs.
export const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../pages/HomePage.vue'),
    meta: { title: 'Python from zero to professional' },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../pages/DashboardPage.vue'),
    meta: { title: 'Your dashboard' },
  },
  {
    path: '/learn',
    name: 'course',
    component: () => import('../pages/CoursePage.vue'),
    meta: { title: 'Course explorer' },
  },
  {
    path: '/learn/:levelId',
    redirect: (to) => ({ name: 'course', hash: `#${to.params.levelId}` }),
  },
  {
    path: '/learn/:levelId/:lessonId',
    name: 'lesson',
    component: () => import('../pages/LessonPage.vue'),
    meta: { layout: 'learn' },
  },
  {
    path: '/playground',
    name: 'playground',
    component: () => import('../pages/PlaygroundPage.vue'),
    meta: { title: 'Playground', wide: true },
  },
  {
    path: '/interview',
    name: 'interview',
    component: () => import('../pages/InterviewPage.vue'),
    meta: { title: 'Interview mode' },
  },
  {
    path: '/interview/session/:sessionId',
    name: 'interview-session',
    component: () => import('../pages/InterviewSessionPage.vue'),
    meta: { title: 'Interview session' },
  },
  {
    path: '/interview/bank',
    name: 'question-bank',
    component: () => import('../pages/QuestionBankPage.vue'),
    meta: { title: 'Question bank' },
  },
  {
    path: '/revision',
    name: 'revision',
    component: () => import('../pages/RevisionPage.vue'),
    meta: { title: 'Revision queue' },
  },
  {
    path: '/visualizers',
    name: 'visualizers',
    component: () => import('../pages/VisualizersPage.vue'),
    meta: { title: 'Concept visualizers' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../pages/SettingsPage.vue'),
    meta: { title: 'Settings & data' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../pages/NotFoundPage.vue'),
    meta: { title: 'Page not found' },
  },
]

export function createAppRouter(history = createWebHistory(import.meta.env.BASE_URL)) {
  const router = createRouter({
    history,
    routes,
    scrollBehavior(to, from, saved) {
      if (saved) return saved
      // Lesson content loads asynchronously; LessonPage scrolls to the hash once it exists.
      if (to.hash && document.querySelector(to.hash)) return { el: to.hash, top: 80 }
      if (to.hash) return to.path === from.path ? false : { top: 0 }
      if (to.path === from.path) return false
      return { top: 0 }
    },
  })

  // Validate lesson URLs in a global guard: per-route beforeEnter does not run
  // when only the params change (lesson → lesson navigation).
  router.beforeEach((to) => {
    if (to.name !== 'lesson') return
    const meta = getLessonMeta(to.params.lessonId)
    if (!meta || meta.level !== to.params.levelId) {
      return { name: 'not-found', params: { pathMatch: to.path.slice(1).split('/') }, query: to.query, hash: to.hash }
    }
  })

  router.afterEach((to) => {
    if (typeof document === 'undefined') return
    let title = to.meta.title
    if (to.name === 'lesson') title = getLessonMeta(to.params.lessonId)?.title
    if (to.name === 'course' && to.hash) title = getLevel(to.hash.slice(1))?.title ?? title
    document.title = title ? `${title} — Python Learning Platform` : 'Python Learning Platform'
  })

  return router
}
