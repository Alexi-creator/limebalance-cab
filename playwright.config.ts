import { defineConfig, devices } from "@playwright/test"

const PORT = 5173
const baseURL = `http://localhost:${PORT}`

/**
 * Playwright config for LimeBalance E2E tests.
 *
 * Tests run fully offline: every `/api/**` call is mocked at the network layer
 * (see e2e/helpers/mockApi.ts), so no backend is required. The Vite dev server
 * is started automatically via `webServer` below.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "html" : "list",

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Deterministic env so auth widgets render and /api stays same-origin.
    env: {
      VITE_API_URL: "/api",
      VITE_TELEGRAM_BOT_USERNAME: "LimeBalanceTestBot",
      VITE_GOOGLE_CLIENT_ID: "test-google-client-id.apps.googleusercontent.com",
    },
  },
})
