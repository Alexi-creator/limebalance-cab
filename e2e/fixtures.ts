import { test as base, type Page } from "@playwright/test"
import { mockApi } from "./helpers/mockApi"

/**
 * Shared fixtures.
 *
 * - `guestPage` — API mocked as logged-out (`/auth/me` → 401).
 * - `authedPage` — API mocked as a logged-in user, ready for protected routes.
 *
 * Both apply the network mock before any navigation, so the app's initial auth
 * check resolves deterministically.
 */
export const test = base.extend<{
  guestPage: Page
  authedPage: Page
}>({
  guestPage: async ({ page }, use) => {
    await mockApi(page, { authenticated: false })
    await use(page)
  },
  authedPage: async ({ page }, use) => {
    await mockApi(page, { authenticated: true })
    await use(page)
  },
})

export { expect } from "@playwright/test"
