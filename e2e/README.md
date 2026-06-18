# E2E tests (Playwright)

End-to-end tests for the LimeBalance frontend. They run the real app in a
browser but **without a backend** — every `/api/**` call is mocked at the
network layer, so the suite is fast, deterministic, and runs anywhere.

## Running

```bash
npm run test:e2e          # headless run (starts the dev server automatically)
npm run test:e2e:ui       # interactive UI mode
npm run test:e2e:headed   # watch the browser
npm run test:e2e:report   # open the last HTML report
```

The Vite dev server is started automatically (see `webServer` in
[playwright.config.ts](../playwright.config.ts)); locally an already-running
server on port 5173 is reused.

## How it works

Authentication in the app is driven entirely by `GET /api/auth/me`: a user
object means "logged in", a `401` means "guest". So controlling that one
endpoint controls the whole auth state.

- [helpers/mockApi.ts](helpers/mockApi.ts) intercepts every request whose path
  starts with `/api/`. `GET`s are served from the app's own deterministic stub
  generator ([src/api/stubs.ts](../src/api/stubs.ts)) so the mocked data matches
  the real API shape; mutations resolve with an empty `200`. The
  `authenticated` flag flips `/auth/me` between the mock user and `401`.
- [fixtures.ts](fixtures.ts) exposes two ready-to-use pages: `guestPage`
  (logged out) and `authedPage` (logged in). Both install the mock before the
  first navigation.

> Note: the mock matches only paths beginning with `/api/` — a broad
> `**/api/**` glob would also capture Vite's own modules served from
> `/src/api/*` and break the app.

## Adding a test

```ts
import { expect, test } from "./fixtures"

test("does something when logged in", async ({ authedPage }) => {
  await authedPage.goto("/transactions")
  await expect(authedPage.getByRole("heading", { name: "Transactions" })).toBeVisible()
})
```

Prefer role-based locators (`getByRole`, `getByText`) over CSS selectors.
Note that Mantine's `NavLink` (sidebar) renders as clickable text inside the
`navigation` landmark, not as a `link`, and form fields expose as `textbox`
roles.
