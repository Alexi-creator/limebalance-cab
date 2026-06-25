import type { Page, Route } from "@playwright/test"
// Reuse the app's own deterministic mock-data generator so test fixtures stay
// in sync with the real API shape. stubs.ts is pure (only depends on date-fns),
// so it imports cleanly into the Playwright (node) context.
import { getStub } from "../../src/api/stubs"

export interface MockApiOptions {
  /** When false, `/auth/me` responds 401 so the app treats the user as a guest. */
  authenticated?: boolean
  /** Override the user returned by `/auth/me` for an authenticated session. Defaults to `MOCK_USER`. */
  user?: Record<string, unknown>
  /**
   * Override `/subscriptions/usage` to drive the limit warnings/blocking.
   * Defaults to the stub value (unlimited — `limit`/`remaining` null). Use {@link buildUsage}.
   */
  usage?: Record<string, unknown>
}

type UsageEntry = { used: number; limit: number | null; remaining: number | null }

/** Build a `/subscriptions/usage` payload for the limit tests. */
export function buildUsage(categories: UsageEntry, transactions: UsageEntry) {
  return { categories, transactions }
}

/** A paid plan that unlocks the investing / crypto section. */
const PRO_PLAN = {
  id: "plan-pro",
  name: "pro",
  maxCategories: null,
  maxExpenses: null,
  maxIncomes: null,
  price: "12.00",
  investingAccess: true,
}

/** The free tier — the investing / crypto section is locked on this plan. */
const FREE_PLAN = {
  id: "plan-free",
  name: "free",
  maxCategories: 5,
  maxExpenses: 50,
  maxIncomes: 50,
  price: "0.00",
  investingAccess: false,
}

/** The user returned for an authenticated session (matches stubs.buildMe — a paid "pro" plan). */
export const MOCK_USER = {
  email: "alex.morgan@example.com",
  name: "Alex Morgan",
  currency: "USD",
  timezone: "America/New_York",
  subscription: { plan: PRO_PLAN, expiresAt: null },
  hasPassword: true,
}

/** A user on the free plan — the Investments section is locked for them. */
export const MOCK_USER_FREE = {
  ...MOCK_USER,
  subscription: { plan: FREE_PLAN, expiresAt: null },
}

/** A Telegram user without a linked email/password — exercises the email-linking flow. */
export const MOCK_USER_NO_EMAIL = {
  name: "Alex Morgan",
  currency: "USD",
  timezone: "America/New_York",
  telegramId: "123456789",
  hasPassword: false,
}

/** A user whose email is submitted but not yet confirmed — lives in `pendingEmail`. */
export const MOCK_USER_PENDING_EMAIL = {
  name: "Alex Morgan",
  currency: "USD",
  timezone: "America/New_York",
  telegramId: "123456789",
  pendingEmail: "alex@example.com",
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
  const { authenticated = true, user = MOCK_USER, usage } = options

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
      return route.fulfill({ json: user })
    }

    if (path.endsWith("/subscriptions/usage") && usage) {
      return route.fulfill({ json: usage })
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
