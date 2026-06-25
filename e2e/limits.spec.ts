import { expect, test } from "./fixtures"
import { buildUsage, MOCK_USER_FREE, mockApi } from "./helpers/mockApi"

// English fallback copy for the limit messages (the test browser runs in `en`).
const CATEGORIES_BLOCKED = "Category limit reached. Upgrade your plan to add more."
const TRANSACTIONS_BLOCKED =
  "Monthly transaction limit reached. Upgrade your plan or wait until next month."
const BLOCKED_TOOLTIP = "Limit reached — upgrade your plan"

// A limit with plenty of room — used for the dimension we are not testing in a given case.
const ROOMY = { used: 1, limit: 50, remaining: 49 }

test.describe("Plan limits — warnings and blocking", () => {
  test.describe("categories", () => {
    test("limit reached: red alert, create button disabled with tooltip", async ({ page }) => {
      await mockApi(page, {
        user: MOCK_USER_FREE,
        usage: buildUsage({ used: 5, limit: 5, remaining: 0 }, ROOMY),
      })
      await page.goto("/categories")

      await expect(page.getByText(CATEGORIES_BLOCKED)).toBeVisible()

      const button = page.getByRole("button", { name: "New category" })
      await expect(button).toBeDisabled()

      // The disabled button has pointer-events: none, so the tooltip lives on the wrapper Box.
      await button.locator("xpath=..").hover()
      await expect(page.getByRole("tooltip", { name: BLOCKED_TOOLTIP })).toBeVisible()
    })

    test("almost out (1 left): soft hint, create button still enabled", async ({ page }) => {
      await mockApi(page, {
        user: MOCK_USER_FREE,
        usage: buildUsage({ used: 4, limit: 5, remaining: 1 }, ROOMY),
      })
      await page.goto("/categories")

      await expect(page.getByText("1 category left. After that — upgrade to Pro.")).toBeVisible()
      await expect(page.getByRole("button", { name: "New category" })).toBeEnabled()
    })

    test("unlimited plan: no alert, create button enabled", async ({ authedPage }) => {
      await authedPage.goto("/categories")

      await expect(authedPage.getByText(CATEGORIES_BLOCKED)).toHaveCount(0)
      await expect(authedPage.getByRole("button", { name: "New category" })).toBeEnabled()
    })
  })

  test.describe("transactions", () => {
    test("limit reached: red alert, add button disabled with tooltip", async ({ page }) => {
      await mockApi(page, {
        user: MOCK_USER_FREE,
        usage: buildUsage(ROOMY, { used: 20, limit: 20, remaining: 0 }),
      })
      await page.goto("/transactions")

      await expect(page.getByText(TRANSACTIONS_BLOCKED)).toBeVisible()

      const button = page.getByRole("button", { name: "Add transaction" })
      await expect(button).toBeDisabled()

      await button.locator("xpath=..").hover()
      await expect(page.getByRole("tooltip", { name: BLOCKED_TOOLTIP })).toBeVisible()
    })

    test("almost out (2 left): soft monthly hint, add button still enabled", async ({ page }) => {
      await mockApi(page, {
        user: MOCK_USER_FREE,
        usage: buildUsage(ROOMY, { used: 18, limit: 20, remaining: 2 }),
      })
      await page.goto("/transactions")

      await expect(
        page.getByText("2 transactions left this month. After that — upgrade to Pro."),
      ).toBeVisible()
      await expect(page.getByRole("button", { name: "Add transaction" })).toBeEnabled()
    })

    test("server 403 on create surfaces the upgrade message", async ({ page }) => {
      // Counter still shows room (button enabled), so the form opens — but the server rejects the
      // creation with 403 (a stale counter / race). The form must show the upgrade message.
      await mockApi(page, {
        user: MOCK_USER_FREE,
        usage: buildUsage(ROOMY, { used: 19, limit: 20, remaining: 1 }),
      })

      // Registered after mockApi, so this route is matched first; non-POST calls fall through.
      await page.route(
        (url) => new URL(url).pathname.endsWith("/expenses"),
        async (route) => {
          if (route.request().method() === "POST") {
            return route.fulfill({
              status: 403,
              contentType: "application/json",
              body: JSON.stringify({
                message:
                  "Monthly transaction limit reached (20). Upgrade your plan or wait until next month.",
              }),
            })
          }
          return route.fallback()
        },
      )

      await page.goto("/transactions")
      await page.getByRole("button", { name: "Add transaction" }).click()

      // Fill the minimum: an amount (category/currency/date are prefilled), then save.
      await page.getByLabel("Amount").fill("10")
      await page.getByRole("button", { name: "Save transaction" }).click()

      // The localized upgrade notification appears (not a generic error). Here it is unambiguous:
      // the page banner is the soft hint (1 left), so this exact text only comes from the 403 handler.
      await expect(page.getByText(TRANSACTIONS_BLOCKED)).toBeVisible()
    })
  })
})
