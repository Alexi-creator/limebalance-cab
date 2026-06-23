import { expect, test } from "./fixtures"
import { MOCK_USER_PENDING_EMAIL, mockApi } from "./helpers/mockApi"

// English copy (the default fallback locale) for the strings asserted below.
const SUCCESS = "Your email has been confirmed. You can now sign in with it."
const ERROR = "This confirmation link is invalid or has expired. Try linking your email again."
const NO_TOKEN = "The confirmation link is missing its token."

// Capture confirm-email calls and respond with the given status/body.
async function routeConfirm(
  page: Parameters<typeof mockApi>[0],
  status: number,
  body: Record<string, unknown>,
) {
  await page.route(
    (url) => new URL(url).pathname.endsWith("/auth/confirm-email"),
    (route) => route.fulfill({ status, json: body }),
  )
}

test.describe("Confirm email page", () => {
  test("confirms the token and offers sign-in for a guest", async ({ page }) => {
    await mockApi(page, { authenticated: false })
    await routeConfirm(page, 200, { success: true })

    await page.goto("/confirm-email?token=abc123")

    await expect(page.getByText(SUCCESS)).toBeVisible()
    await expect(page.getByRole("link", { name: "Go to sign in" })).toBeVisible()
  })

  test("offers the settings link for a logged-in user", async ({ page }) => {
    await mockApi(page, { authenticated: true, user: MOCK_USER_PENDING_EMAIL })
    await routeConfirm(page, 200, { success: true })

    await page.goto("/confirm-email?token=abc123")

    await expect(page.getByText(SUCCESS)).toBeVisible()
    await expect(page.getByRole("link", { name: "Go to settings" })).toBeVisible()
  })

  test("shows an error for an invalid or expired token", async ({ page }) => {
    await mockApi(page, { authenticated: false })
    await routeConfirm(page, 400, { message: "expired" })

    await page.goto("/confirm-email?token=dead")

    await expect(page.getByText(ERROR)).toBeVisible()
  })

  test("shows an error when the token is missing from the URL", async ({ page }) => {
    await mockApi(page, { authenticated: false })

    await page.goto("/confirm-email")

    await expect(page.getByText(NO_TOKEN)).toBeVisible()
  })
})
