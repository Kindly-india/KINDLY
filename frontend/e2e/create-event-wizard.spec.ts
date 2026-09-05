import { test, expect, type Page } from '@playwright/test'

const WIZARD = '/org-events/create'
const DRAFT_KEY = 'kindly:create-event-draft'

// Route gating is the `kindly_role` cookie in proxy.ts, so the wizard renders
// without a real session. Data-fetching features stay untested here by design.
// Each test gets a fresh context, so localStorage already starts empty —
// clearing it per-navigation would wipe the very draft the draft tests save.
test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: 'kindly_role', value: 'org', url: 'http://localhost:3000' },
  ])
})

const continueBtn = (page: Page) => page.getByRole('button', { name: 'Continue' })

async function fillStep1(page: Page) {
  await page.getByPlaceholder('Give your event a catchy name').fill('Beach cleanup drive')
  await page.getByRole('button', { name: /Outdoors & Nature/ }).click()
  await page.getByPlaceholder('Share the story behind this event...').fill('Cleaning the shoreline.')
}

async function fillStep2(page: Page, { start = '09:00', end = '13:00' } = {}) {
  // Always a future date so the `min` on the input can't reject it.
  const d = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10)
  await page.locator('[data-field="eventDate"] input').fill(d)
  await page.locator('[data-field="startTime"] input').fill(start)
  await page.locator('[data-field="endTime"] input').fill(end)
  await page.locator('[data-field="location"] input').fill('RD Circle, Nashik')
}

test.describe('step validation', () => {
  test('Continue is blocked on an empty step and names each missing field', async ({ page }) => {
    await page.goto(WIZARD)
    await continueBtn(page).click()

    // Still on step 1, with a message per field rather than one step-level alert.
    await expect(page.getByPlaceholder('Give your event a catchy name')).toBeVisible()
    await expect(page.getByText('Give your event a name.')).toBeVisible()
    await expect(page.getByText('Pick the category that fits best.')).toBeVisible()
    await expect(page.getByText('Tell volunteers why this event matters.')).toBeVisible()
  })

  test('the first bad field is focused, not just described', async ({ page }) => {
    await page.goto(WIZARD)
    await continueBtn(page).click()
    await expect(page.getByPlaceholder('Give your event a catchy name')).toBeFocused()
  })

  test('an error clears as soon as that field is corrected', async ({ page }) => {
    await page.goto(WIZARD)
    await continueBtn(page).click()
    await expect(page.getByText('Give your event a name.')).toBeVisible()

    await page.getByPlaceholder('Give your event a catchy name').fill('Beach cleanup')
    await expect(page.getByText('Give your event a name.')).toBeHidden()
    // Untouched fields keep theirs.
    await expect(page.getByText('Pick the category that fits best.')).toBeVisible()
  })

  test('a complete step advances', async ({ page }) => {
    await page.goto(WIZARD)
    await fillStep1(page)
    await continueBtn(page).click()
    await expect(page.locator('[data-field="eventDate"]')).toBeVisible()
  })

  test('required fields are marked and explained', async ({ page }) => {
    await page.goto(WIZARD)
    await expect(page.getByText('Fields marked * are required.')).toBeVisible()
    // Title, category, description + the legend itself.
    await expect(page.locator('span[aria-hidden="true"]', { hasText: '*' })).toHaveCount(4)
  })
})

test.describe('scroll position', () => {
  test('a new step starts at the top', async ({ page }) => {
    await page.goto(WIZARD)
    await fillStep1(page)
    await page.mouse.wheel(0, 1200)
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(100)

    await continueBtn(page).click()
    await expect(page.locator('[data-field="eventDate"]')).toBeVisible()
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(50)
  })
})

test.describe('overnight events', () => {
  test('an evening event that ends after midnight is allowed', async ({ page }) => {
    await page.goto(WIZARD)
    await fillStep1(page)
    await continueBtn(page).click()
    await fillStep2(page, { start: '21:00', end: '01:00' })

    await expect(page.getByText('ends the next day')).toBeVisible()
    await continueBtn(page).click()
    await expect(page.locator('[data-field="pointOfContact"]')).toBeVisible()
  })

  test('a wrap longer than 12h is rejected as a likely typo', async ({ page }) => {
    await page.goto(WIZARD)
    await fillStep1(page)
    await continueBtn(page).click()
    await fillStep2(page, { start: '14:00', end: '13:00' })

    await continueBtn(page).click()
    await expect(page.getByText(/at most 12 hours/)).toBeVisible()
    await expect(page.locator('[data-field="eventDate"]')).toBeVisible()
  })

  test('identical start and end times are rejected', async ({ page }) => {
    await page.goto(WIZARD)
    await fillStep1(page)
    await continueBtn(page).click()
    await fillStep2(page, { start: '10:00', end: '10:00' })

    await continueBtn(page).click()
    await expect(page.getByText(/can’t be the same/)).toBeVisible()
  })

  test('duration is shown for a normal same-day event', async ({ page }) => {
    await page.goto(WIZARD)
    await fillStep1(page)
    await continueBtn(page).click()
    await fillStep2(page, { start: '09:00', end: '13:30' })
    await expect(page.getByText('4h 30m')).toBeVisible()
  })
})

test.describe('field limits', () => {
  test('the title stops at the length the server accepts', async ({ page }) => {
    await page.goto(WIZARD)
    const title = page.getByPlaceholder('Give your event a catchy name')
    await title.fill('x'.repeat(150))
    expect(await title.inputValue()).toHaveLength(100)
    await expect(page.getByText('100/100')).toBeVisible()
  })
})

test.describe('draft persistence', () => {
  test('an unfinished form comes back after leaving the page', async ({ page }) => {
    await page.goto(WIZARD)
    await fillStep1(page)
    await expect
      .poll(() => page.evaluate(k => window.localStorage.getItem(k) !== null, DRAFT_KEY))
      .toBe(true)

    await page.goto(WIZARD)
    await expect(page.getByText('You have an unfinished event')).toBeVisible()
    await page.getByRole('button', { name: 'Resume' }).click()
    await expect(page.getByPlaceholder('Give your event a catchy name')).toHaveValue('Beach cleanup drive')
  })

  test('Start fresh discards it for good', async ({ page }) => {
    await page.goto(WIZARD)
    await fillStep1(page)
    await expect
      .poll(() => page.evaluate(k => window.localStorage.getItem(k) !== null, DRAFT_KEY))
      .toBe(true)

    await page.goto(WIZARD)
    await page.getByRole('button', { name: 'Start fresh' }).click()
    await expect(page.getByPlaceholder('Give your event a catchy name')).toHaveValue('')

    await page.goto(WIZARD)
    await expect(page.getByText('You have an unfinished event')).toBeHidden()
  })

  test('an untouched form saves nothing', async ({ page }) => {
    await page.goto(WIZARD)
    await continueBtn(page).click() // validation errors are not content
    expect(await page.evaluate(k => window.localStorage.getItem(k), DRAFT_KEY)).toBeNull()
  })
})

test.describe('page chrome', () => {
  test('only the wizard header occupies the top strip', async ({ page }) => {
    await page.goto(WIZARD)
    await expect(page.getByRole('heading', { name: 'Create Event' })).toBeVisible()
    // The global org nav is suppressed here, so its links must not be present.
    await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Analytics' })).toHaveCount(0)
  })
})
