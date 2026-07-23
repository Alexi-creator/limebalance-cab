import { expect, test } from "./fixtures"
import { MOCK_USER_FREE, mockApi } from "./helpers/mockApi"

// Page heading (English fallback copy) and sidebar label.
const PAGE_HEADING = "Investments and crypto"
const NAV_LABEL = "Investments"
const LOCKED_TOOLTIP = "Switch to any paid plan to unlock investments"

test.describe("Investments — access by plan", () => {
  test.describe("paid plan (default MOCK_USER, has access)", () => {
    test("sidebar link is enabled and navigates to the page", async ({ authedPage }) => {
      await authedPage.goto("/")

      const nav = authedPage.getByRole("navigation")
      const link = nav.locator("a", { hasText: NAV_LABEL })

      // Visible and not disabled for a paid plan.
      await expect(link).toBeVisible()
      await expect(link).not.toHaveAttribute("data-disabled")

      await link.click()

      await expect(authedPage).toHaveURL(/\/investments$/)
      await expect(authedPage.getByRole("heading", { name: PAGE_HEADING })).toBeVisible()
    })

    test("opens the page directly via URL", async ({ authedPage }) => {
      await authedPage.goto("/investments")

      await expect(authedPage).toHaveURL(/\/investments$/)
      await expect(authedPage.getByRole("heading", { name: PAGE_HEADING })).toBeVisible()
    })
  })

  test.describe("free plan (no access)", () => {
    test.beforeEach(async ({ page }) => {
      await mockApi(page, { authenticated: true, user: MOCK_USER_FREE })
    })

    test("sidebar link is visible but disabled and does not navigate", async ({ page }) => {
      await page.goto("/")

      const nav = page.getByRole("navigation")
      const link = nav.locator("a", { hasText: NAV_LABEL })

      // The link stays visible to everyone, but is locked (greyed out, not clickable).
      await expect(link).toBeVisible()
      await expect(link).toHaveAttribute("data-disabled")

      // Hovering the locked item explains how to unlock it. The disabled NavLink has
      // pointer-events: none, so the tooltip listens on the wrapper Box (the parent).
      await link.locator("xpath=..").hover()
      await expect(page.getByRole("tooltip", { name: LOCKED_TOOLTIP })).toBeVisible()

      // A disabled NavLink has pointer-events: none, so a forced click cannot navigate.
      await link.click({ force: true })
      await expect(page).toHaveURL(/\/$/)
    })

    test("direct URL access is blocked and redirects to the overview", async ({ page }) => {
      await page.goto("/investments")

      // Guard redirects free users back to the overview.
      await expect(page).toHaveURL(/\/$/)
      await expect(page.getByRole("heading", { name: "Hi, Alex Morgan 👋" })).toBeVisible()
      // The investments page heading must never render for a free user.
      await expect(page.getByRole("heading", { name: PAGE_HEADING })).toHaveCount(0)
    })
  })
})
