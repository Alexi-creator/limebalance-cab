import { expect, test } from "./fixtures"
import { MOCK_USER, mockApi } from "./helpers/mockApi"

/**
 * Currency exchanges and the multicurrency balance.
 *
 * The stub dataset generates every transaction in USD and adds two hand-written exchanges
 * (USD ↔ EUR), so the balance ends up split across two currencies — which is exactly the state
 * these two features exist for.
 */
test.describe("Currency exchanges", () => {
  test("its own tab swaps the transactions table for the exchanges one", async ({
    authedPage: page,
  }) => {
    await page.goto("/transactions")

    // The transactions table owns the page until the tab is switched.
    await expect(page.getByText("Wise")).toHaveCount(0)

    await page.getByRole("tab", { name: "Exchange" }).click()

    await expect(page.getByText("Wise")).toBeVisible()
    // The view lives in the URL, so a switched tab survives a reload and can be linked to.
    await expect(page).toHaveURL(/view=exchanges/)
    // Only what was given and what was received. This app tracks where money is, not how well
    // it was traded, so no rate and no spread are shown.
    await expect(page.getByText("Rate", { exact: false })).toHaveCount(0)
    await expect(page.getByText("%", { exact: false })).toHaveCount(0)
  })

  test("the tab opens straight from a link, with its own add button", async ({
    authedPage: page,
  }) => {
    await page.goto("/transactions?view=exchanges")

    await expect(page.getByText("Wise")).toBeVisible()
    // The transaction filters belong to the other view and must not be here.
    await expect(page.getByRole("button", { name: "Add transaction" })).toHaveCount(0)

    await page.getByRole("button", { name: "Add exchange" }).click()

    await expect(
      page.getByText("An exchange is neither an income nor an expense", { exact: false }),
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "Save exchange" })).toBeVisible()
  })

  test("the header's add menu offers an exchange and opens its form", async ({
    authedPage: page,
  }) => {
    await page.goto("/")

    // The "Add" button is a split control: the caret opens the record-type menu.
    await page.locator('[data-tour="add-button"]').getByRole("button").last().click()
    // The "Deposit or withdrawal" item mentions an exchange in its description, so it is caught by
    // a substring match on the accessible name — the item is picked by its label alone instead.
    await page
      .getByRole("menuitem")
      .filter({ has: page.getByText("Exchange", { exact: true }) })
      .click()

    await expect(
      page.getByText("An exchange is neither an income nor an expense", { exact: false }),
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "Save exchange" })).toBeVisible()
  })

  test("the page tour follows the visible table", async ({ authedPage: page }) => {
    // The table's own pagination has a "Next page" button, so the tour's is matched exactly.
    const next = page.getByRole("button", { name: "Next", exact: true })

    await page.goto("/transactions")
    await page.getByRole("button", { name: "Show tour" }).click()

    // The transactions view is described by its own steps…
    await expect(page.getByText("Add a transaction")).toBeVisible()
    await next.click()
    await expect(page.getByText("Filter and search")).toBeVisible()
    // …and ends on the exchanges tab, the only place the feature is discovered from.
    await next.click()
    await expect(page.getByText("Currency exchanges").last()).toBeVisible()
    await page.keyboard.press("Escape")

    // Steps are built when the tour opens, from the view on screen at that moment — so the
    // exchanges table has to have actually replaced the transactions one first. Clicking the
    // tab is not enough: until React commits the switch, "Show tour" still builds the
    // transactions tour, and this test then walks the wrong three steps.
    await page.getByRole("tab", { name: "Exchange" }).click()
    await expect(page.getByText("Wise")).toBeVisible()

    await page.getByRole("button", { name: "Show tour" }).click()
    await expect(page.getByText("Currency exchanges").last()).toBeVisible()

    // The exchanges view never mentions filters or search, which are not there.
    await expect(page.getByText("Filter and search")).toHaveCount(0)
    await next.click()
    await expect(page.getByText("Exchanges only")).toBeVisible()
  })

  test("the form lists only what can be handed over, and fills the amount on click", async ({
    page,
  }) => {
    await mockApi(page, {
      user: { ...MOCK_USER, currency: "THB" },
      balance: {
        baseCurrency: "THB",
        balance: 45535,
        balanceUsd: 1384,
        byCurrency: [
          { currency: "THB", amount: -422924 },
          { currency: "RUB", amount: 1018144 },
        ],
        isApproximate: true,
      },
    })
    await page.goto("/transactions?view=exchanges")
    await page.getByRole("button", { name: "Add exchange" }).click()

    // Only the positive bucket is offered. The negative one is not money to give away but the
    // hole it is missing from, and showing it as a holding reads as a debt.
    await expect(page.getByRole("button", { name: /1,018,144/ })).toBeVisible()
    await expect(page.getByRole("button", { name: /422,924/ })).toHaveCount(0)

    // One click fills the whole "gave" side, so a seven-digit figure is never retyped by hand.
    await page.getByRole("button", { name: /1,018,144/ }).click()
    await expect(page.getByLabel("Gave")).toHaveValue("1 018 144")
  })

  test("the form asks only for the two amounts, never for a rate", async ({ page }) => {
    // A user whose base currency is not USD, so the two currency defaults already differ.
    await mockApi(page, { user: { ...MOCK_USER, currency: "THB" } })
    await page.goto("/transactions?view=exchanges")
    await page.getByRole("button", { name: "Add exchange" }).click()

    await page.getByLabel("Gave").fill("1000")
    await page.getByLabel("Got").fill("32400")

    // Filling both amounts must not surface a derived rate anywhere in the form.
    await expect(page.getByText("1 USD =", { exact: false })).toHaveCount(0)
    await expect(page.getByRole("button", { name: "Save exchange" })).toBeEnabled()
  })
})

test.describe("Multicurrency balance", () => {
  test("shows what is held in each currency once every bucket is plausible", async ({
    authedPage: page,
  }) => {
    await page.goto("/")

    const card = page.locator('[data-tour="balance"]')
    // Money sits in USD and EUR, so the rolled-up total is an estimate and says so.
    await expect(card.getByText("≈", { exact: false }).first()).toBeVisible()
    // …and underneath, the exact amount still held in each — no conversion in those figures.
    await expect(card.getByText("€", { exact: false })).toBeVisible()
    // Nothing looks wrong, so nothing is explained.
    await expect(page.locator('[data-tour="balance-hint"]')).toHaveCount(0)
  })

  test("explains the split and the money out working, without growing the card", async ({
    page,
  }) => {
    // Two currencies held and money sitting on an exchange — the state where every figure on the
    // card is correct and none of them is self-evident.
    await mockApi(page, {
      user: { ...MOCK_USER, currency: "THB" },
      balance: {
        baseCurrency: "THB",
        balance: 15518,
        balanceUsd: 466,
        byCurrency: [
          { currency: "THB", amount: 15305 },
          { currency: "USD", amount: 6 },
        ],
        isApproximate: true,
        inExchanges: 21066,
      },
    })
    await page.goto("/")

    const card = page.locator('[data-tour="balance"]')
    const hints = card.getByRole("button", { name: /currency|exchange|wallet/i })
    await expect(hints).toHaveCount(2)

    // The split says outright that the figures beside it are the exact ones and the total is not.
    await hints.first().hover()
    // Filtered rather than asserted on the only tooltip: the previous one lingers through its
    // close delay, so a bare getByRole would match two elements as soon as the second is opened.
    await expect(
      page.getByRole("tooltip").filter({ hasText: "these amounts are exact" }),
    ).toBeVisible()

    // And the money out working says it is not part of the value above — the question the line
    // provokes in everyone who reads it.
    await hints.last().hover()
    await expect(
      page.getByRole("tooltip").filter({ hasText: "already left the balance above" }),
    ).toBeVisible()
  })

  test("leaves a single-currency balance unexplained", async ({ page }) => {
    // Nothing was converted, so the caption merely repeats the value — a hint there is noise.
    await mockApi(page, {
      user: { ...MOCK_USER, currency: "THB" },
      balance: {
        baseCurrency: "THB",
        balance: 15305,
        balanceUsd: 460,
        byCurrency: [{ currency: "THB", amount: 15305 }],
        isApproximate: false,
      },
    })
    await page.goto("/")

    await expect(
      page.locator('[data-tour="balance"]').getByRole("button", { name: /currency/i }),
    ).toHaveCount(0)
  })

  test("hides the split while it would be fiction, and explains why instead", async ({ page }) => {
    // Earned in RUB, spent in THB, never recorded the conversion — THB cannot really be negative,
    // and the RUB figure is no longer "what is left", so neither may be shown as a holding.
    await mockApi(page, {
      balance: {
        baseCurrency: "THB",
        balance: 45535,
        balanceUsd: 1384,
        byCurrency: [
          { currency: "THB", amount: -422924 },
          { currency: "RUB", amount: 1018144 },
        ],
        isApproximate: true,
      },
    })
    await page.goto("/")

    const card = page.locator('[data-tour="balance"]')
    await expect(card.getByText("1,018,144", { exact: false })).toHaveCount(0)
    await expect(page.locator('[data-tour="balance-hint"]')).toBeVisible()
  })

  test("names the currency gone negative and offers to record the exchange", async ({ page }) => {
    await mockApi(page, {
      balance: {
        baseCurrency: "THB",
        balance: 45535,
        balanceUsd: 1384,
        byCurrency: [
          { currency: "THB", amount: -422924 },
          { currency: "RUB", amount: 1018144 },
        ],
        isApproximate: true,
      },
    })
    await page.goto("/")

    // A marker in the card header, so the card stays the same height as the three beside it.
    const hint = page.locator('[data-tour="balance-hint"]')
    await expect(hint).toBeVisible()

    await hint.hover()
    const tooltip = page.getByRole("tooltip")
    // Names the currency that actually went into the red, not just any of them.
    await expect(tooltip).toContainText("THB")
    await expect(tooltip).toContainText("an exchange looks unrecorded")

    await hint.click()
    await expect(page.getByRole("button", { name: "Save exchange" })).toBeVisible()
  })
})
