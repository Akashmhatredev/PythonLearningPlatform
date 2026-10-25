import { expect, test } from '@playwright/test'

// Every visualizer × preset renders without crashing or logging errors, and
// survives a first interaction.
const COMBOS = {
  'code-tracer': [null],
  'hash-table': ['dict', 'set', 'collision'],
  'exception-flow': ['uncaught', 'caught', 'finally', 'reraise'],
  'class-lookup': ['single', 'override', 'diamond', 'super'],
  memory: ['refcount', 'cycle', 'weakref'],
  'asyncio-loop': ['await-order', 'gather', 'create-task', 'blocking'],
  concurrency: ['io-bound', 'cpu-bound', 'race-condition'],
  performance: ['membership', 'string-building', 'memoization', 'generator-memory'],
  'concept-diagram': [null],
  comparison: [null],
}

for (const [type, presets] of Object.entries(COMBOS)) {
  test(`visualizer ${type} renders every preset`, async ({ page }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    for (const p of presets) {
      await page.goto(`/visualizers?v=${type}${p ? `&p=${p}` : ''}`)
      const stage = page.locator('.viz__stage')
      await expect(stage).toBeVisible()
      await expect(stage).not.toContainText('crashed')
      const button = stage.locator('button:not([disabled])').first()
      if (await button.count()) await button.click()
      await page.waitForTimeout(300)
      await expect(stage).not.toContainText('crashed')
    }
    expect(errors).toEqual([])
  })
}

test('the code tracer records real execution steps', async ({ page }) => {
  await page.goto('/visualizers?v=code-tracer')
  const stage = page.locator('.viz__stage')
  await expect(stage.locator('.tr__stage')).toBeVisible({ timeout: 60_000 })
  await expect(stage.locator('.tr__status')).toContainText('recorded by CPython 3.14')
  for (let i = 0; i < 12; i++) await stage.getByRole('button', { name: 'Step forward' }).click()
  await expect(stage.locator('.tr__frame').first()).toContainText('Global frame')
  await expect(stage.locator('.tr__obj--func').first()).toBeVisible()
})

test('the performance lab measures in the browser', async ({ page }) => {
  await page.goto('/visualizers?v=performance&p=memoization')
  const stage = page.locator('.viz__stage')
  await stage.getByRole('button', { name: /run the measurement/i }).click()
  await expect(stage.locator('.pl__chart')).toBeVisible({ timeout: 60_000 })
  await expect(stage.locator('.pl__unit')).toContainText('measured just now by CPython')
})

test('a guided experiment is checked by real tests and reports honestly', async ({ page }) => {
  await page.goto('/learn/basics/variables-and-names')
  const exp = page.locator('.exp').first()
  await exp.scrollIntoViewIfNeeded()
  await exp.getByRole('button', { name: /check my change/i }).click()
  // Nothing was changed, so the check must fail and say why.
  await expect(exp.locator('.exp__fail')).toContainText('the player starts with 100 points', { timeout: 60_000 })
  await expect(exp.locator('.exp__grading')).toHaveCount(0)
})
