import type { Page, Route } from "@playwright/test"
// Reuse the app's own deterministic mock-data generator so test fixtures stay
// in sync with the real API shape. stubs.ts is pure (only depends on date-fns),
// so it imports cleanly into the Playwright (node) context.
import { getStub } from "../../src/api/stubs"

export interface MockApiOptions {
  /** When false, `/auth/me` responds 401 so the app treats the user as a guest. */
  authenticated?: boolean
}

/** The user returned for an authenticated session (matches stubs.buildMe). */
export const MOCK_USER = {
  email: "alex.morgan@example.com",
  name: "Alex Morgan",
  currency: "USD",
  timezone: "America/New_York",
  subscription: "pro",
  hasPassword: true,
}

/**
 * Intercept every `/api/**` request so tests run without a backend.
 *
 * - `GET` requests are served from the app's stub generator (realistic data).
 * - mutations (POST/PATCH/DELETE) resolve with an empty 200 by default.
 * - `/auth/me` controls the auth state via the `authenticated` option.
 *
 * Call this BEFORE `page.goto(...)` so the first auth check is already mocked.
 */
export async function mockApi(page: Page, options: MockApiOptions = {}): Promise<void> {
  const { authenticated = true } = options

  await blockThirdParty(page)

  // Match only real API calls (path starts with `/api/`). A glob like `**/api/**`
  // would also swallow Vite's own source modules served from `/src/api/*`.
  const isApiRequest = (url: string) => new URL(url).pathname.startsWith("/api/")

  await page.route(isApiRequest, async (route: Route) => {
    const request = route.request()
    const url = request.url()
    const method = request.method()
    const path = new URL(url).pathname

    if (path.endsWith("/auth/me")) {
      if (!authenticated) {
        return route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ message: "Unauthorized" }),
        })
      }
      return route.fulfill({ json: MOCK_USER })
    }

    if (method === "GET") {
      const stub = getStub(url, "GET")
      // Unknown GET endpoints fall back to an empty list — enough for smoke tests.
      return route.fulfill({ json: stub ?? [] })
    }

    // Auth/refresh and other mutations: succeed with an empty body.
    return route.fulfill({ status: 200, json: {} })
  })
}

/**
 * Abort third-party auth widget scripts (Telegram / Google) so the public auth
 * page loads deterministically and `page.goto` never waits on external network.
 * The widgets aren't exercised by these tests.
 */
export async function blockThirdParty(page: Page): Promise<void> {
  await page.route(
    /(telegram\.org|accounts\.google\.com|gstatic\.com|apis\.google\.com|googleapis\.com)/,
    (route) => route.abort(),
  )
}
