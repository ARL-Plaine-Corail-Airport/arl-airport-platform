import { expect, test } from '@playwright/test'

test.describe('Public pages navigation', () => {
  test('homepage loads with header and hero', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.site-header')).toBeVisible()
    await expect(page.locator('.logo-link')).toBeVisible()
  })

  test('passenger guide page loads', async ({ page }) => {
    await page.goto('/passenger-guide')
    await expect(page).toHaveURL(/\/passenger-guide/)
    await expect(page.locator('.site-header')).toBeVisible()
  })

  test('contact page loads', async ({ page }) => {
    await page.goto('/contact')
    await expect(page).toHaveURL(/\/contact/)
  })

  test('FAQ page loads', async ({ page }) => {
    await page.goto('/faq')
    await expect(page).toHaveURL(/\/faq/)
  })

  test('offline page loads', async ({ page }) => {
    await page.goto('/offline')
    await expect(page).toHaveURL(/\/offline/)
  })
})

test.describe('Header accessibility', () => {
  test('mobile menu toggle has aria attributes', async ({ page }) => {
    await page.goto('/')
    const toggle = page.locator('.mobile-toggle')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(toggle).toHaveAttribute('aria-label', /.+/)
  })

  test('desktop nav dropdowns have aria attributes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')
    const dropdownButton = page.locator('.nav-desktop .dropdown button').first()
    await expect(dropdownButton).toHaveAttribute('aria-expanded', 'false')
    await expect(dropdownButton).toHaveAttribute('aria-haspopup', 'true')
  })
})

test.describe('Dashboard auth gating', () => {
  test('redirects unauthenticated users to admin login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})
