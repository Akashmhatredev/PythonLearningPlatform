import { expect, test } from '@playwright/test'

// The core learning loop on the reference lesson: learn → run real Python →
// quiz → exercise (graded by real tests in the Python sandbox) → complete → persists.
test('complete a lesson end to end and keep progress after reload', async ({ page }) => {
  await page.goto('/learn/basics/variables-and-names')
  await expect(page.getByRole('heading', { level: 1, name: /variables: names that point to objects/i })).toBeVisible()

  // Completion is locked at first
  const finish = page.locator('#finish')
  await expect(finish.getByRole('button', { name: /mark lesson complete/i })).toBeDisabled()

  // 1. Experiment: run the live example with CPython in the browser
  const pg = page.locator('#playground')
  await pg.scrollIntoViewIfNeeded()
  await pg.locator('.pg__actions').getByRole('button', { name: /^run/i }).click()
  await expect(pg.locator('.term').first()).toContainText('Ada starts with 0 points', { timeout: 60_000 })
  await expect(pg.locator('.pg__status').first()).toContainText('finished')

  // 2. Understand: answer the auto-graded quiz questions
  const qs = page.locator('#quiz .qq')
  const check = async (i) => {
    await qs.nth(i).getByRole('button', { name: 'Check answer' }).click()
    await expect(qs.nth(i).locator('.fb--ok')).toBeVisible()
  }
  await qs.nth(0).locator('label.opt', { hasText: 'second name for the same list' }).click()
  await check(0)
  await qs.nth(1).locator('textarea').fill('6 5')
  await check(1)
  await qs.nth(2).locator('label.opt', { hasText: '[1, 2, 3]' }).click()
  await check(2)
  await qs.nth(3).locator('.bugline').nth(0).click() // line 1 uses username before it exists
  await check(3)
  const blanks = qs.nth(4).locator('input.blank')
  await blanks.nth(0).fill('b')
  await blanks.nth(1).fill('a')
  await check(4)
  await qs.nth(5).locator('label.opt', { hasText: 'second_score' }).click()
  await check(5)
  await expect(page.locator('.quiz__score')).toContainText('6/6')

  // 3. Practice: load the solution and make the Python tests pass
  const ex = page.locator('#exercise-swap-cups')
  await ex.scrollIntoViewIfNeeded()
  await ex.getByRole('button', { name: /show solution/i }).click()
  await ex.getByRole('button', { name: /reveal anyway/i }).click()
  await ex.getByRole('button', { name: /load solution into the editor/i }).click()
  await ex.getByRole('button', { name: /run tests/i }).click()
  await expect(ex.locator('.tests__summary')).toContainText('3/3 passing', { timeout: 30_000 })
  await expect(ex.locator('.ex__done')).toContainText('test-graded')

  // 4. Review: complete the lesson
  await finish.scrollIntoViewIfNeeded()
  const complete = finish.getByRole('button', { name: /mark lesson complete/i })
  await expect(complete).toBeEnabled()
  await complete.click()
  await expect(page.locator('.lsn__chips')).toContainText('completed ✓')

  // 5. Persistence: reload and check the dashboard
  await page.waitForTimeout(400) // let the throttled storage write land
  await page.reload()
  await expect(page.locator('.lsn__chips')).toContainText('completed ✓')
  await page.goto('/dashboard')
  await expect(page.getByText(/1 of \d+ lessons/i).first()).toBeVisible()
  await expect(page.locator('.stat').filter({ hasText: 'exercises passed' })).toContainText('1')
})

test('python playground: live input(), tracebacks and stopping runaway code', async ({ page }) => {
  await page.goto('/playground?example=hello')
  const out = page.locator('.term').first()
  await expect(out).toContainText('Nice to meet you, Ada!', { timeout: 60_000 })

  // live input: clear the pre-typed lines so the program asks in the output panel
  await page.getByRole('tab', { name: /input/i }).click()
  await page.locator('.pg__stdin-box').fill('')
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  const field = page.locator('.term__field')
  await field.fill('Grace')
  await field.press('Enter')
  await page.locator('.term__field').fill('20')
  await page.locator('.term__field').press('Enter')
  await expect(out).toContainText('Nice to meet you, Grace!')

  // a real traceback
  await page.locator('.cm-content').first().click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('print("start")\nprint(1 / 0)\n')
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(out).toContainText('ZeroDivisionError: division by zero')
  await expect(out).toContainText('File "main.py", line 2')

  // runaway code is stopped and the runtime keeps working
  await page.locator('.cm-content').first().click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('print("spinning")\nwhile True:\n    pass\n')
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(out).toContainText('spinning')
  await page.getByRole('button', { name: 'Stop' }).click()
  await expect(out).toContainText('[stopped]')
  await page.locator('.cm-content').first().click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('print("still alive")\n')
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(out).toContainText('still alive')
})

test('practice interview session from a lesson, with review', async ({ page }) => {
  await page.goto('/interview?topics=variables-and-names')
  await expect(page.getByRole('status').filter({ hasText: 'matching question' })).toContainText('6')
  await page.getByRole('button', { name: /start practice/i }).click()
  await expect(page).toHaveURL(/\/interview\/session\//)

  for (let i = 0; i < 6; i++) {
    const card = page.locator('.ses__q')
    if (await card.locator('.ses__opts').count()) {
      await card.locator('.ses__opt').first().click()
      await card.getByRole('button', { name: 'Submit answer' }).click()
      await expect(card.locator('.ses__verdict')).toBeVisible()
    } else if (!(await card.locator('.pg').count())) {
      await card.locator('textarea').fill('A variable is a name bound to an object.')
      await card.getByRole('button', { name: /reveal model answer/i }).click()
      await card.getByRole('button', { name: 'solid' }).click()
    }
    const next = page.getByRole('button', { name: /^next/i })
    if (await next.count()) await next.click()
  }
  await page.getByRole('button', { name: /finish & review/i }).click()
  await page.getByRole('dialog').getByRole('button', { name: /^finish$/i }).click()
  await expect(page.getByRole('heading', { name: 'How it went.' })).toBeVisible()
  await expect(page.locator('.review__stats')).toContainText('self-assessed')
})

test('global search finds an API and navigates to it', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('ControlOrMeta+k')
  const input = page.getByRole('combobox')
  await expect(input).toBeFocused()
  await input.fill('id(obj)')
  await expect(page.locator('.result').first()).toBeVisible()
  await input.press('Enter')
  await expect(page).toHaveURL(/\/learn\//)
})

test('mobile navigation and course map drawer work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/learn/basics/variables-and-names')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Dashboard' })).toBeVisible()
  await page.getByRole('button', { name: 'Close menu' }).click()
  await page.getByRole('button', { name: /course map/i }).first().click()
  await expect(page.getByRole('complementary', { name: 'Course map' })).toBeVisible()
})

test('unknown routes show the 404 page', async ({ page }) => {
  await page.goto('/this/does/not/exist')
  await expect(page.getByRole('heading', { name: /doesn’t exist/i })).toBeVisible()
})
