import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Automated WCAG 2.1 A/AA checks on the main pages, in both themes.
// The visual tests cover every page that renders learner-facing content.
const PAGES = ['/', '/learn', '/learn/basics/variables-and-names', '/playground', '/dashboard', '/interview', '/interview/bank', '/visualizers', '/settings']

for (const theme of ['light', 'dark']) {
  for (const path of PAGES) {
    test(`${path} has no serious accessibility violations (${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('plp:preferences', JSON.stringify({ v: 1, data: { theme: t, motion: 'reduced' } })), theme)
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(800)
      await page.evaluate(() => window.scrollTo(0, 0)) // sticky bars over content skew contrast checks
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('iframe')
        .analyze()
      const serious = results.violations
        .filter((v) => ['serious', 'critical'].includes(v.impact))
        // CodeMirror's scroller contains a focusable contenteditable; axe doesn't see it as keyboard-reachable.
        .filter((v) => !(v.id === 'scrollable-region-focusable' && v.nodes.every((n) => n.target.join(' ').includes('cm-scroller'))))
        .map((v) => `${v.id}: ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
      expect(serious, serious.join('\n')).toEqual([])
    })
  }
}
