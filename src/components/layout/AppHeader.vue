<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Menu, Moon, Search, Settings, Sun, X } from 'lucide-vue-next'
import { usePreferencesStore } from '../../stores/preferences.js'
import { useProgressStore } from '../../stores/progress.js'
import { useUiStore } from '../../stores/ui.js'

const prefs = usePreferencesStore()
const progress = useProgressStore()
const ui = useUiStore()
const route = useRoute()

const links = [
  { to: '/learn', label: 'Learn' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/playground', label: 'Playground' },
  { to: '/visualizers', label: 'Visualizers' },
  { to: '/interview', label: 'Interview' },
]

const pct = computed(() => Math.round(progress.completion.ratio * 100))
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

function toggleTheme() {
  prefs.setTheme(prefs.resolvedTheme === 'dark' ? 'light' : 'dark')
}

watch(
  () => route.fullPath,
  () => (ui.navOpen = false),
)
</script>

<template>
  <header class="header">
    <div class="header__inner">
      <RouterLink to="/" class="logo">
        <span class="logo__mark" aria-hidden="true">Py</span>
        <span class="logo__text">
          <span class="logo__word">PYTHON</span>
          <span class="logo__sub">learning platform</span>
        </span>
        <span class="visually-hidden"> — home</span>
      </RouterLink>

      <nav id="primary-nav" class="nav" :class="{ 'is-open': ui.navOpen }" aria-label="Primary">
        <RouterLink v-for="l in links" :key="l.to" :to="l.to" class="nav__link">{{ l.label }}</RouterLink>
        <RouterLink to="/settings" class="nav__link nav__link--mobile">Settings</RouterLink>
      </nav>

      <div class="header__tools">
        <button type="button" class="search-btn" @click="ui.searchOpen = true">
          <Search :size="16" aria-hidden="true" />
          <span class="search-btn__text">Search</span>
          <span class="kbd" aria-hidden="true">{{ isMac ? '⌘' : 'Ctrl' }} K</span>
        </button>
        <RouterLink to="/dashboard" class="progress-pill" :aria-label="`Course progress: ${pct}% complete`">
          <span class="progress-pill__bar" aria-hidden="true"><span :style="{ width: pct + '%' }" /></span>
          <span class="mono">{{ pct }}%</span>
        </RouterLink>
        <button
          type="button"
          class="btn btn--icon btn--sm btn--ghost"
          :aria-label="prefs.resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
          @click="toggleTheme"
        >
          <Sun v-if="prefs.resolvedTheme === 'dark'" :size="18" aria-hidden="true" />
          <Moon v-else :size="18" aria-hidden="true" />
        </button>
        <RouterLink to="/settings" class="btn btn--icon btn--sm btn--ghost settings-link" aria-label="Settings">
          <Settings :size="18" aria-hidden="true" />
        </RouterLink>
        <button
          type="button"
          class="btn btn--icon btn--sm menu-btn"
          :aria-expanded="ui.navOpen"
          aria-controls="primary-nav"
          :aria-label="ui.navOpen ? 'Close menu' : 'Open menu'"
          @click="ui.navOpen = !ui.navOpen"
        >
          <X v-if="ui.navOpen" :size="18" aria-hidden="true" />
          <Menu v-else :size="18" aria-hidden="true" />
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--bg);
  border-bottom: var(--border);
}
.header__inner {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  height: var(--header-h);
  padding: 0 clamp(12px, 2vw, 24px);
}
.logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex: none;
}
.logo:hover {
  background: none;
}
.logo__mark {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  background: var(--cobalt);
  color: var(--cobalt-ink);
  border: var(--border);
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.05rem;
  letter-spacing: -0.03em;
  transform: rotate(-4deg);
  box-shadow: 4px 4px 0 var(--acid), 4px 4px 0 2px var(--line);
}
.logo:hover .logo__mark {
  animation: jitter 0.3s steps(4) infinite;
  --r: -4deg;
}
.logo__text {
  display: grid;
  line-height: 1;
  gap: 3px;
}
.logo__word {
  font-family: var(--font-display);
  font-weight: 900;
  font-stretch: 125%;
  font-size: 1.15rem;
  letter-spacing: -0.01em;
}
.logo__sub {
  font-family: var(--font-mono);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--cobalt-text);
}
.nav {
  display: flex;
  align-items: stretch;
  height: 100%;
  margin-left: var(--s-4);
}
.nav__link {
  display: inline-flex;
  align-items: center;
  padding: 0 0.85rem;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  border-left: 2px solid transparent;
}
.nav__link:hover {
  background: var(--acid);
  color: var(--acid-ink);
}
.nav__link.router-link-active {
  background: var(--text);
  color: var(--bg);
}
.nav__link--mobile {
  display: none;
}
.header__tools {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--s-2);
}
.search-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 38px;
  padding: 0 0.6rem;
  border: var(--border-thin);
  background: var(--surface);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--text-soft);
  min-width: 190px;
}
.search-btn:hover {
  box-shadow: var(--shadow-sm);
}
.search-btn .kbd {
  margin-left: auto;
}
.progress-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  min-height: 38px;
  border: var(--border-thin);
  text-decoration: none;
  font-size: 0.78rem;
  font-weight: 700;
  background: var(--surface);
}
.progress-pill__bar {
  width: 48px;
  height: 10px;
  border: 2px solid var(--line);
  position: relative;
  overflow: hidden;
}
.progress-pill__bar span {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--accent);
}
.menu-btn {
  display: none;
}

@media (max-width: 1100px) {
  .search-btn {
    min-width: 0;
  }
  /* keep the text for screen readers; only hide it visually */
  .search-btn__text {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  .search-btn .kbd {
    display: none;
  }
}

@media (max-width: 900px) {
  .menu-btn {
    display: inline-flex;
  }
  .settings-link {
    display: none;
  }
  .nav {
    display: none;
    position: absolute;
    top: var(--header-h);
    left: 0;
    right: 0;
    height: auto;
    margin: 0;
    flex-direction: column;
    background: var(--bg);
    border-bottom: var(--border);
    box-shadow: 0 8px 0 var(--shadow-color);
  }
  .nav.is-open {
    display: flex;
  }
  .nav__link {
    min-height: 52px;
    padding: 0 clamp(16px, 4vw, 24px);
    border-top: var(--border-thin);
    font-size: 0.9rem;
  }
  .nav__link--mobile {
    display: inline-flex;
  }
}
@media (max-width: 520px) {
  .progress-pill {
    display: none;
  }
  .logo__word {
    font-size: 1rem;
  }
}
</style>
