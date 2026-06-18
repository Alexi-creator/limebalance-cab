import { expect, test } from "./fixtures"
import { blockThirdParty } from "./helpers/mockApi"

test.describe("Authentication", () => {
  test("redirects a guest to the sign-in page", async ({ guestPage }) => {
    await guestPage.goto("/")

    await expect(guestPage).toHaveURL(/\/auth$/)
    await expect(guestPage.getByRole("heading", { name: "Sign In" })).toBeVisible()
  })

  test("shows the email login form when chosen", async ({ guestPage }) => {
    await guestPage.goto("/auth")

    await guestPage.getByRole("button", { name: "Sign in with email" }).click()

    await expect(guestPage.getByRole("textbox", { name: "Email" })).toBeVisible()
    await expect(guestPage.getByRole("textbox", { name: "Password" })).toBeVisible()
  })

  test("validates email and password fields", async ({ guestPage }) => {
    await guestPage.goto("/auth")
    await guestPage.getByRole("button", { name: "Sign in with email" }).click()

    await guestPage.getByRole("textbox", { name: "Email" }).fill("not-an-email")
    await guestPage.getByRole("textbox", { name: "Password" }).fill("123")
    await guestPage.getByRole("button", { name: "Sign In", exact: true }).click()

    await expect(guestPage.getByText("Invalid email")).toBeVisible()
    await expect(guestPage.getByText("Minimum 8 characters")).toBeVisible()
  })

  test("links to the registration page", async ({ guestPage }) => {
    await guestPage.goto("/auth")

    await guestPage.getByRole("link", { name: "Create one" }).click()

    await expect(guestPage).toHaveURL(/\/register$/)
  })

  test("logs in with email and lands on the dashboard", async ({ page }) => {
    // Guest first (so /auth renders), then flip /auth/me to authenticated for
    // the post-login getMe() call.
    await blockThirdParty(page)

    let authenticated = false
    const isApiRequest = (url: string) => new URL(url).pathname.startsWith("/api/")
    await page.route(isApiRequest, async (route) => {
      const path = new URL(route.request().url()).pathname
      if (path.endsWith("/auth/login")) {
        authenticated = true
        return route.fulfill({ status: 200, json: {} })
      }
      if (path.endsWith("/auth/me")) {
        return authenticated
          ? route.fulfill({
              json: { email: "user@example.com", name: "Test User", currency: "USD" },
            })
          : route.fulfill({ status: 401, json: { message: "Unauthorized" } })
      }
      return route.fulfill({ status: 200, json: route.request().method() === "GET" ? [] : {} })
    })

    await page.goto("/auth")
    await page.getByRole("button", { name: "Sign in with email" }).click()
    await page.getByRole("textbox", { name: "Email" }).fill("user@example.com")
    await page.getByRole("textbox", { name: "Password" }).fill("supersecret")
    await page.getByRole("button", { name: "Sign In", exact: true }).click()

    await expect(page).toHaveURL(/\/$/)
  })
})
