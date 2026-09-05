import { test, expect, type Page } from '@playwright/test'

// The premise for this file: assume the person filling this form has never used
// a web form before. They mash buttons, paste junk, wander backwards, toggle
// things on and off, and type in their own language. None of that should be
// able to stop them creating an event.

const WIZARD = '/org-events/create'
const DRAFT_KEY = 'kindly:create-event-draft'

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: 'kindly_role', value: 'org', url: 'http://localhost:3000' },
  ])
})

const continueBtn = (page: Page) => page.getByRole('button', { name: 'Continue' })
const backBtn = (page: Page) => page.getByRole('button', { name: 'Back' })
const futureDate = (days = 14) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10)

async function fillStep1(page: Page, title = 'Beach cleanup drive') {
  await page.getByPlaceholder('Give your event a catchy name').fill(title)
  await page.getByRole('button', { name: /Outdoors & Nature/ }).click()
  await page.getByPlaceholder('Share the story behind this event...').fill('Cleaning the shoreline.')
}

async function fillStep2(page: Page, { start = '09:00', end = '13:00', date = futureDate() } = {}) {
  await page.locator('[data-field="eventDate"] input').fill(date)
  await page.locator('[data-field="startTime"] input').fill(start)
  await page.locator('[data-field="endTime"] input').fill(end)
  await page.locator('[data-field="location"] input').fill('RD Circle, Nashik')
}

async function fillStep3(page: Page) {
  await page.locator('[data-field="pointOfContact"] input').fill('Rahul (9876543210)')
  const deadline = new Date(Date.now() + 13 * 864e5).toISOString().slice(0, 16)
  await page.locator('[data-field="registrationDeadline"] input').fill(deadline)
}

test.describe('button mashing', () => {
  test('hammering Continue never skips a step', async ({ page }) => {
    await page.goto(WIZARD)
    const btn = continueBtn(page)
    await btn.click({ clickCount: 3, delay: 10 })
    // Still on step 1 — an invalid step must not advance no matter the clicks.
    await expect(page.getByPlaceholder('Give your event a catchy name')).toBeVisible()

    await fillStep1(page)
    await btn.click({ clickCount: 3, delay: 10 })
    // Advances exactly one step, not three.
    await expect(page.locator('[data-field="eventDate"]')).toBeVisible()
    await expect(page.locator('[data-field="pointOfContact"]')).toHaveCount(0)
  })

  test('wandering back and forth keeps everything typed', async ({ page }) => {
    await page.goto(WIZARD)
    await fillStep1(page)
    await continueBtn(page).click()
    await fillStep2(page)
    await continueBtn(page).click()

    await backBtn(page).click()
    await backBtn(page).click()
    await expect(page.getByPlaceholder('Give your event a catchy name')).toHaveValue('Beach cleanup drive')

    await continueBtn(page).click()
    await expect(page.locator('[data-field="location"] input')).toHaveValue('RD Circle, Nashik')
  })
})

test.describe('junk input', () => {
  test('a field holding only spaces is treated as empty', async ({ page }) => {
    await page.goto(WIZARD)
    await page.getByPlaceholder('Give your event a catchy name').fill('     ')
    await page.getByRole('button', { name: /Outdoors & Nature/ }).click()
    await page.getByPlaceholder('Share the story behind this event...').fill('   ')

    await continueBtn(page).click()
    await expect(page.getByText('Give your event a name.')).toBeVisible()
    await expect(page.getByText('Tell volunteers why this event matters.')).toBeVisible()
  })

  test('pasting an essay into the title is truncated, not rejected', async ({ page }) => {
    await page.goto(WIZARD)
    const title = page.getByPlaceholder('Give your event a catchy name')
    await title.fill('word '.repeat(400))
    expect((await title.inputValue()).length).toBeLessThanOrEqual(100)

    await page.getByRole('button', { name: /Outdoors & Nature/ }).click()
    await page.getByPlaceholder('Share the story behind this event...').fill('Fine.')
    await continueBtn(page).click()
    await expect(page.locator('[data-field="eventDate"]')).toBeVisible()
  })

  test('Marathi text and emoji are accepted', async ({ page }) => {
    await page.goto(WIZARD)
    await fillStep1(page, 'समुद्रकिनारा स्वच्छता 🌊')
    await continueBtn(page).click()
    await expect(page.locator('[data-field="eventDate"]')).toBeVisible()
  })

  test('a pasted negative volunteer count is caught', async ({ page }) => {
    await page.goto(WIZARD)
    await fillStep1(page)
    await continueBtn(page).click()
    await fillStep2(page)
    await continueBtn(page).click()
    await fillStep3(page)

    await page.locator('[data-field="totalSlots"] button').first().click()
    await page.locator('[data-field="totalSlots"] input').fill('-5')

    await page.getByRole('button', { name: /Submit for Approval|Publish Event/ }).click()
    await expect(page.getByText(/Enter how many volunteers/)).toBeVisible()
  })
})

test.describe('changing their mind', () => {
  test('turning Paid Event off unblocks a half-typed price', async ({ page }) => {
    await page.goto(WIZARD)
    await fillStep1(page)
    await continueBtn(page).click()
    await fillStep2(page)
    await continueBtn(page).click()
    await fillStep3(page)

    const paidToggle = page.locator('[data-field="ticketPriceRupees"] button').first()
    await paidToggle.click()
    await page.locator('[data-field="ticketPriceRupees"] input').fill('0')

    const submit = page.getByRole('button', { name: /Submit for Approval|Publish Event/ })
    await submit.click()
    await expect(page.getByText(/Enter a price of ₹1 or more/)).toBeVisible()

    // Changing their mind must clear the blocker, not strand them.
    await paidToggle.click()
    await expect(page.getByText(/Enter a price of ₹1 or more/)).toBeHidden()
  })

  test('picking a second category replaces the first', async ({ page }) => {
    await page.goto(WIZARD)
    await page.getByRole('button', { name: /Outdoors & Nature/ }).click()
    await page.getByRole('button', { name: /Animals & Rescue/ }).click()

    await expect(page.getByRole('button', { name: /Animals & Rescue/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: /Outdoors & Nature/ })).toHaveAttribute('aria-pressed', 'false')
  })
})

test.describe('stale drafts', () => {
  test('resuming a draft whose date has passed sends them to fix it', async ({ page }) => {
    await page.goto(WIZARD)
    // A draft saved days ago, sitting on step 3, with a now-past event date.
    await page.evaluate(([key, past]) => {
      window.localStorage.setItem(key, JSON.stringify({
        v: 1,
        savedAt: Date.now() - 3 * 864e5,
        data: {
          formData: {
            title: 'Old draft event', description: 'Written a while ago',
            category: 'nature_outdoors', eventDate: past, startTime: '09:00',
            endTime: '13:00', location: 'RD Circle', dressCode: '', thingsToBring: '',
            pointOfContact: 'Rahul', connectPlan: '', totalSlots: 0,
            registrationDeadline: '', minimumAge: undefined, ticketPriceRupees: undefined,
          },
          isUrgent: false, limitVolunteers: false, isPaidEvent: false,
          coverFocal: { x: 50, y: 50 }, step: 3,
        },
      }))
    }, [DRAFT_KEY, new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10)])

    await page.reload()
    await page.getByRole('button', { name: 'Resume' }).click()

    // Lands on step 3 where they left off.
    await expect(page.locator('[data-field="pointOfContact"]')).toBeVisible()

    await page.getByRole('button', { name: /Submit for Approval|Publish Event/ }).click()
    // ...and is carried back to the real problem, on the right step.
    await expect(page.locator('[data-field="eventDate"]')).toBeVisible()
    await expect(page.getByText('This date has already passed.')).toBeVisible()
  })
})

test.describe('keyboard only', () => {
  test('the form is completable without a mouse', async ({ page }) => {
    await page.goto(WIZARD)
    await page.getByPlaceholder('Give your event a catchy name').focus()
    await page.keyboard.type('Keyboard cleanup')

    await page.getByRole('button', { name: /Outdoors & Nature/ }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: /Outdoors & Nature/ })).toHaveAttribute('aria-pressed', 'true')

    await page.getByPlaceholder('Share the story behind this event...').focus()
    await page.keyboard.type('Typed with a keyboard.')

    await continueBtn(page).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-field="eventDate"]')).toBeVisible()
  })
})

test.describe('the whole way through', () => {
  test('a complete form reaches the submit attempt with no validation left', async ({ page }) => {
    await page.goto(WIZARD)
    await fillStep1(page)
    await continueBtn(page).click()
    await fillStep2(page)
    await continueBtn(page).click()
    await fillStep3(page)

    await page.getByRole('button', { name: /Submit for Approval|Publish Event/ }).click()

    // No backend here, so the create call fails — the point is that validation
    // is satisfied and the user is never bounced back to an earlier step.
    await expect(page.locator('[data-field="pointOfContact"]')).toBeVisible()
    await expect(page.locator('p[role="alert"]')).toHaveCount(0)
  })
})
