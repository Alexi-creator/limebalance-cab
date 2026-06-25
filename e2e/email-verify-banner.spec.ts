import { expect, test } from "./fixtures"
import { MOCK_USER, MOCK_USER_UNVERIFIED, mockApi } from "./helpers/mockApi"

// English copy (the default fallback locale).
const BANNER = /Confirm your address so you don't lose access to your account/
const RESEND = "Resend link"

test.describe("Email verification banner", () => {
  test("shows for an account whose email is not yet verified, and resends the link", async ({
    page,
  }) => {
    await mockApi(page, { authenticated: true, user: MOCK_USER_UNVERIFIED })

    let resendCalls = 0
    await page.route(
      (url) => new URL(url).pathname.endsWith("/auth/resend-email-confirmation"),
      (route) => {
        resendCalls += 1
        return route.fulfill({ status: 200, json: { success: true } })
      },
    )

    await page.goto("/transactions")

    await expect(page.getByText(BANNER)).toBeVisible()

    const resend = page.getByRole("button", { name: RESEND })
    await resend.click()
    await expect(page.getByText("Confirmation link sent again")).toBeVisible()
    expect(resendCalls).toBe(1)
    // rate-limit cooldown disables the button right after the click
    await expect(resend).toBeDisabled()
  })

  test("does not show for a verified account", async ({ page }) => {
    await mockApi(page, { authenticated: true, user: MOCK_USER })
    await page.goto("/transactions")

    await expect(page.getByRole("heading", { name: "Transactions" })).toBeVisible()
    await expect(page.getByText(BANNER)).toHaveCount(0)
  })
})
