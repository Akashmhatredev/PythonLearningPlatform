<script setup>
import { runtime } from '../../services/python/client.js'
</script>

<template>
  <footer class="footer">
    <div class="footer__inner">
      <div class="footer__brand">
        <p class="footer__big">NO MAGIC.<br />JUST PYTHON.</p>
        <p class="hand footer__note">made of paper, ink &amp; indentation ✎</p>
      </div>
      <nav class="footer__nav" aria-label="Footer">
        <RouterLink to="/learn">Course</RouterLink>
        <RouterLink to="/playground">Playground</RouterLink>
        <RouterLink to="/interview">Interview mode</RouterLink>
        <RouterLink to="/interview/bank">Question bank</RouterLink>
        <RouterLink to="/revision">Revision queue</RouterLink>
        <RouterLink to="/visualizers">Visualizers</RouterLink>
        <RouterLink to="/settings">Settings &amp; data</RouterLink>
      </nav>
      <div class="footer__meta mono">
        <p>Examples run on CPython {{ runtime.python ?? '3.14' }} in your browser (Pyodide {{ runtime.pyodide }})</p>
        <p>
          Primary references:
          <a href="https://docs.python.org/3/" target="_blank" rel="noopener">Python docs</a> ·
          <a href="https://peps.python.org/" target="_blank" rel="noopener">PEPs</a> ·
          <a href="https://packaging.python.org/" target="_blank" rel="noopener">Packaging guide</a>
        </p>
        <p>Your progress is stored only in this browser.</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: var(--border);
  background: #1a1a1a;
  color: #f1eee5;
}
.footer__inner {
  max-width: var(--page-max);
  margin: 0 auto;
  padding: var(--s-7) clamp(16px, 4vw, 48px);
  display: grid;
  grid-template-columns: 1.3fr 1fr 1.2fr;
  gap: var(--s-6);
}
.footer__big {
  font-family: var(--font-display);
  font-weight: 900;
  font-stretch: 125%;
  font-size: var(--step-2);
  line-height: 0.95;
  margin: 0 0 var(--s-3);
}
.footer__note {
  color: var(--acid);
  font-size: 1.2rem;
  transform: rotate(-2deg);
  display: inline-block;
}
.footer__nav {
  display: grid;
  gap: 6px;
  align-content: start;
  font-weight: 700;
}
.footer__nav a {
  text-decoration: none;
  width: fit-content;
}
.footer__nav a:hover {
  color: #1a1a1a;
}
.footer__meta {
  font-size: 0.75rem;
  color: #bdb8aa;
}
.footer__meta a:hover {
  color: #1a1a1a;
}
@media (max-width: 800px) {
  .footer__inner {
    grid-template-columns: 1fr;
  }
}
</style>
