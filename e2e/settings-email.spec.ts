import { expect, test } from "./fixtures"
import { MOCK_USER_NO_EMAIL, MOCK_USER_PENDING_EMAIL, mockApi } from "./helpers/mockApi"

// English copy (the default fallback locale) for the strings asserted below.
const NEEDS_EMAIL =
  "You signed in via Telegram. Add an email and password in settings so you don't lose access to your account."
// The confirm banner interpolates the pending address.
const confirmEmail = (email: string) => `Confirm your email ${email} via the link we sent to it.`

test.describe("Settings — email linking", () => {
  test.describe("no email yet (setup state)", () => {
    test.beforeEach(async ({ page }) => {
      await mockApi(page, { authenticated: true, user: MOCK_USER_NO_EMAIL })
    })

    test("shows the add-email banner", async ({ page }) => {
      await page.goto("/")

      await expect(page.getByText(NEEDS_EMAIL)).toBeVisible()
      await expect(page.getByRole("link", { name: "Go to settings" })).toBeVisible()
      // No confirm banner while there is no pending email.
      await expect(page.getByText("via the link we sent to it")).toHaveCount(0)
    })

    test("banner button opens the security tab with an empty, editable email field", async ({
      page,
    }) => {
      await page.goto("/")

      await page.getByRole("link", { name: "Go to settings" }).click()

      await expect(page).toHaveURL(/\/settings\/security$/)
      const emailField = page.getByRole("textbox", { name: "Email" })
      await expect(emailField).toHaveValue("")
      await expect(emailField).toBeEditable()
    })

    test("keeps Save disabled and surfaces field errors for invalid input", async ({ page }) => {
      await page.goto("/settings/security")

      const email = page.getByRole("textbox", { name: "Email" })
      const password = page.getByLabel("Password", { exact: true })
      const confirm = page.getByLabel("Confirm password")
      const save = page.getByRole("button", { name: "Save" })

      // Nothing entered yet — cannot save.
      await expect(save).toBeDisabled()

      // Invalid email shows an error.
      await email.fill("not-an-email")
      await expect(page.getByText("Enter a valid email")).toBeVisible()
      await expect(save).toBeDisabled()

      // Valid email, but a too-short password.
      await email.fill("alex@example.com")
      await password.fill("123")
      await expect(page.getByText("Password must be at least 8 characters")).toBeVisible()
      await expect(save).toBeDisabled()

      // Long enough password, but the confirmation does not match.
      await password.fill("supersecret")
      await confirm.fill("different")
      await expect(page.getByText("Passwords do not match")).toBeVisible()
      await expect(save).toBeDisabled()

      // Matching confirmation clears the errors and enables Save.
      await confirm.fill("supersecret")
      await expect(page.getByText("Passwords do not match")).toHaveCount(0)
      await expect(save).toBeEnabled()
    })

    test("requires a password when linking an email (email alone is not enough)", async ({
      page,
    }) => {
      await page.goto("/settings/security")

      await page.getByRole("textbox", { name: "Email" }).fill("alex@example.com")

      // A valid email without a password must not be submittable.
      await expect(page.getByRole("button", { name: "Save" })).toBeDisabled()
    })

    test("links email + password, sends the request, and switches to the confirm banner", async ({
      page,
    }) => {
      // Capture the credentials request and respond as the backend would: the address is now
      // awaiting confirmation (lives in pendingEmail; `email` stays empty until confirmed).
      let sentBody: Record<string, unknown> | null = null
      await page.route(
        (url) => new URL(url).pathname.endsWith("/auth/me/credentials"),
        async (route) => {
          sentBody = route.request().postDataJSON()
          await route.fulfill({ json: { pendingEmail: "alex@example.com", hasPassword: true } })
        },
      )

      await page.goto("/settings/security")
      // The add-email banner is shown before linking.
      await expect(page.getByText(NEEDS_EMAIL)).toBeVisible()

      await page.getByRole("textbox", { name: "Email" }).fill("alex@example.com")
      await page.getByLabel("Password", { exact: true }).fill("supersecret")
      await page.getByLabel("Confirm password").fill("supersecret")

      const save = page.getByRole("button", { name: "Save" })
      await expect(save).toBeEnabled()
      await save.click()

      // The request carried the email and password.
      await expect
        .poll(() => sentBody)
        .toMatchObject({
          email: "alex@example.com",
          password: "supersecret",
        })

      // Success notification.
      await expect(page.getByText("Settings saved")).toBeVisible()

      // The banner now asks the user to confirm the pending address instead of adding one.
      await expect(page.getByText(confirmEmail("alex@example.com"))).toBeVisible()
      await expect(page.getByText(NEEDS_EMAIL)).toHaveCount(0)

      // The email field now shows the pending address, locked.
      const emailField = page.getByRole("textbox", { name: "Email" })
      await expect(emailField).toHaveValue("alex@example.com")
      await expect(emailField).toBeDisabled()
    })
  })

  test.describe("email pending confirmation", () => {
    test.beforeEach(async ({ page }) => {
      await mockApi(page, { authenticated: true, user: MOCK_USER_PENDING_EMAIL })
    })

    test("shows the confirm banner with the pending address (no add-email prompt)", async ({
      page,
    }) => {
      await page.goto("/")

      await expect(page.getByText(confirmEmail("alex@example.com"))).toBeVisible()
      await expect(page.getByText(NEEDS_EMAIL)).toHaveCount(0)
      await expect(page.getByRole("link", { name: "Go to settings" })).toHaveCount(0)
    })

    test("security tab shows the pending email locked, awaiting confirmation", async ({ page }) => {
      await page.goto("/settings/security")

      const emailField = page.getByRole("textbox", { name: "Email" })
      await expect(emailField).toHaveValue("alex@example.com")
      await expect(emailField).toBeDisabled()
      await expect(page.getByText("Awaiting confirmation", { exact: false })).toBeVisible()
    })

    test("banner: resend link re-sends the confirmation and notifies", async ({ page }) => {
      let called = false
      await page.route(
        (url) => new URL(url).pathname.endsWith("/auth/resend-email-confirmation"),
        async (route) => {
          called = true
          await route.fulfill({ status: 200, json: { success: true } })
        },
      )

      // Home has no security form — only the banner's resend button is present.
      await page.goto("/")
      await page.getByRole("button", { name: "Resend link" }).click()

      await expect(page.getByText("Confirmation link sent again")).toBeVisible()
      expect(called).toBe(true)
    })

    test("security form: resend link re-sends the confirmation", async ({ page }) => {
      let called = false
      await page.route(
        (url) => new URL(url).pathname.endsWith("/auth/resend-email-confirmation"),
        async (route) => {
          called = true
          await route.fulfill({ status: 200, json: { success: true } })
        },
      )

      await page.goto("/settings/security")
      // Both the banner and the form expose the action; the form's is last in the DOM.
      await page.getByRole("button", { name: "Resend link" }).last().click()

      await expect(page.getByText("Confirmation link sent again")).toBeVisible()
      expect(called).toBe(true)
    })

    test("security form: change email unlocks an editable, empty email field", async ({ page }) => {
      await page.goto("/settings/security")

      const emailField = page.getByRole("textbox", { name: "Email" })
      await expect(emailField).toBeDisabled()

      // The form's "Change email" is last in the DOM (the banner's is first).
      await page.getByRole("button", { name: "Change email" }).last().click()

      await expect(emailField).toBeEditable()
      await expect(emailField).toHaveValue("")
    })
  })

  test.describe("email confirmed", () => {
    // Default MOCK_USER has a confirmed email and no pendingEmail.
    test("shows no account banner", async ({ authedPage }) => {
      await authedPage.goto("/")

      await expect(authedPage.getByText(NEEDS_EMAIL)).toHaveCount(0)
      await expect(authedPage.getByText("via the link we sent to it")).toHaveCount(0)
    })

    test("security tab shows the confirmed email locked", async ({ authedPage }) => {
      await authedPage.goto("/settings/security")

      const emailField = authedPage.getByRole("textbox", { name: "Email" })
      await expect(emailField).toHaveValue("alex.morgan@example.com")
      await expect(emailField).toBeDisabled()
    })
  })
})
