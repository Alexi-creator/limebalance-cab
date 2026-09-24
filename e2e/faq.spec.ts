import { expect, test } from "./fixtures"

/** The help page: reachable from the sidebar, answers fold open, search narrows the list. */
test.describe("FAQ", () => {
  test("opens from the sidebar and expands an answer", async ({ authedPage: page }) => {
    await page.goto("/")
    await page.getByRole("navigation").getByText("Help & FAQ", { exact: true }).click()
    await expect(page).toHaveURL(/\/faq$/)

    const answer = page.getByText("Balance is your free money", { exact: false })
    await expect(answer).toBeHidden()
    await page.getByRole("button", { name: "How is the balance calculated?" }).click()
    await expect(answer).toBeVisible()
  })

  test("a section answer links to its page", async ({ authedPage: page }) => {
    await page.goto("/faq")
    await page.getByRole("button", { name: "Goals — how do savings goals work?" }).click()
    await page.getByRole("button", { name: "Open section" }).click()
    await expect(page).toHaveURL(/\/goals$/)
  })

  test("search keeps only matching questions", async ({ authedPage: page }) => {
    await page.goto("/faq")
    await page.getByPlaceholder("Search questions").fill("telegram")

    await expect(
      page.getByRole("button", { name: "How do I connect the Telegram bot?" }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "How do I change the base currency?" }),
    ).toHaveCount(0)

    await page.getByPlaceholder("Search questions").fill("zzzz")
    await expect(page.getByText("Nothing found", { exact: false })).toBeVisible()
  })
})
