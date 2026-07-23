import { expect, test } from "./fixtures"

test.describe("Dashboard (authenticated)", () => {
  test("loads the overview with KPIs and the user card", async ({ authedPage }) => {
    await authedPage.goto("/")

    await expect(authedPage).toHaveURL(/\/$/)
    await expect(authedPage.getByRole("heading", { name: "Hi, Alex Morgan 👋" })).toBeVisible()
    await expect(authedPage.getByText("Current balance")).toBeVisible()
    // User card in the sidebar shows the logged-in user (from MOCK_USER). Scoped to the
    // nav landmark — the greeting heading above also renders the same name now.
    await expect(authedPage.getByRole("navigation").getByText("Alex Morgan")).toBeVisible()
  })

  test("navigates through the sidebar to each section", async ({ authedPage }) => {
    await authedPage.goto("/")

    // Mantine NavLink renders as clickable text (no href), so scope to the
    // navigation landmark and match the item label.
    const nav = authedPage.getByRole("navigation")

    const sections: Array<{ link: string; url: RegExp; heading: string }> = [
      { link: "Transactions", url: /\/transactions$/, heading: "Transactions" },
      { link: "Categories", url: /\/categories$/, heading: "Categories" },
      { link: "Analytics", url: /\/analytics$/, heading: "Analytics" },
      { link: "Goals", url: /\/goals$/, heading: "Goals" },
      { link: "Settings", url: /\/settings$/, heading: "Settings" },
    ]

    for (const section of sections) {
      await nav.getByText(section.link, { exact: true }).click()
      await expect(authedPage).toHaveURL(section.url)
      await expect(authedPage.getByRole("heading", { name: section.heading })).toBeVisible()
    }
  })

  test("opens a protected route directly", async ({ authedPage }) => {
    await authedPage.goto("/transactions")

    await expect(authedPage).toHaveURL(/\/transactions$/)
    await expect(authedPage.getByRole("heading", { name: "Transactions" })).toBeVisible()
  })

  test("signs out and returns to the auth page", async ({ authedPage }) => {
    await authedPage.goto("/")
    await expect(authedPage.getByText("Alex Morgan")).toBeVisible()

    await authedPage.locator("button:has(.tabler-icon-logout)").click()

    await expect(authedPage).toHaveURL(/\/auth$/)
    await expect(authedPage.getByRole("heading", { name: "Sign In" })).toBeVisible()
  })
})
