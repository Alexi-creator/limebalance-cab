import type { Page } from "@playwright/test"
import { expect, test } from "./fixtures"

/**
 * Investing section against the stubbed /api/investing/* endpoints (see
 * src/api/stubs.ts — one bybit account, three positions: linear/spot/manual,
 * holdings with a missing price and a missing buy price).
 * All copy asserted here is the English fallback.
 */

const path = (url: URL, suffix: string) => url.pathname.endsWith(suffix)

/** Journal is the default tab when the stubbed account list is non-empty. */
async function gotoInvestments(page: Page) {
  await page.goto("/investments")
  await expect(page.getByRole("heading", { name: "Investments and crypto" })).toBeVisible()
}

test.describe("Investments — trade journal", () => {
  test("renders linear, spot and manual positions with category badges", async ({
    authedPage: page,
  }) => {
    await gotoInvestments(page)

    const rows = page.locator("table tbody tr")

    // Direction comes from the closing side: linear Sell → Long, manual Buy → Short,
    // spot is always Long. Category badge sits next to the direction badge.
    const linear = rows.filter({ hasText: "BTCUSDT" })
    await expect(linear.getByText("Futures")).toBeVisible()
    await expect(linear.getByText("Long")).toBeVisible()
    await expect(linear.getByText("10x")).toBeVisible()

    const spot = rows.filter({ hasText: "SOLUSDT" })
    await expect(spot.getByText("Spot")).toBeVisible()
    await expect(spot.getByText("Long")).toBeVisible()

    const manual = rows.filter({ hasText: "ETHUSDT" })
    await expect(manual.getByText("Manual")).toBeVisible()
    await expect(manual.getByText("Short")).toBeVisible()

    // KPI over the loaded page: 120.5 + 30 − 50.25; 2 of 3 trades are green.
    await expect(page.getByText("+$100.25")).toBeVisible()
    await expect(page.getByText("67%")).toBeVisible()
  })

  test("the Opened column shows the open date, or a dash when it's unavailable", async ({
    authedPage: page,
  }) => {
    await gotoInvestments(page)

    const rows = page.locator("table tbody tr")
    // Opened/Closed/Days are the last three data columns, right before the actions column.
    const openedCell = (row: ReturnType<typeof rows.filter>) => row.locator("td").nth(-4)
    // Formatted in the runner's local timezone, same as the closedAt cell next to it.
    await expect(openedCell(rows.filter({ hasText: "SOLUSDT" }))).not.toHaveText("—")
    await expect(openedCell(rows.filter({ hasText: "ETHUSDT" }))).not.toHaveText("—")
    // The stubbed linear position has no openedAt (opening fills predate synced history).
    await expect(openedCell(rows.filter({ hasText: "BTCUSDT" }))).toHaveText("—")
  })

  test("the Fees column nets trading + funding fees, or a dash when it's unknown", async ({
    authedPage: page,
  }) => {
    await gotoInvestments(page)

    const rows = page.locator("table tbody tr")
    // Fee is the 6th data column: Pair, Direction, Qty, Entry → Exit, Volume, Fee.
    const feeCell = (row: ReturnType<typeof rows.filter>) => row.locator("td").nth(5)
    await expect(feeCell(rows.filter({ hasText: "SOLUSDT" }))).toHaveText("−$2.83")
    // No known open time (linear) / no synced fills (manual) → fee can't be totalled.
    await expect(feeCell(rows.filter({ hasText: "BTCUSDT" }))).toHaveText("—")
    await expect(feeCell(rows.filter({ hasText: "ETHUSDT" }))).toHaveText("—")
  })

  test("edit and delete are only offered on manual positions", async ({ authedPage: page }) => {
    await gotoInvestments(page)

    const rows = page.locator("table tbody tr")
    await expect(
      rows.filter({ hasText: "ETHUSDT" }).getByRole("button", { name: "Edit" }),
    ).toBeVisible()
    await expect(
      rows.filter({ hasText: "BTCUSDT" }).getByRole("button", { name: "Edit" }),
    ).toHaveCount(0)
  })

  test("the category filter narrows the table client-side", async ({ authedPage: page }) => {
    await gotoInvestments(page)
    await expect(page.locator("table tbody tr")).toHaveCount(3)

    await page
      .locator("label")
      .filter({ hasText: /^Spot$/ })
      .click()

    await expect(page.locator("table tbody tr")).toHaveCount(1)
    await expect(page.getByText("SOLUSDT")).toBeVisible()
    await expect(page.getByText("BTCUSDT")).toHaveCount(0)
  })

  test("draws the equity curve; a filter leaving one trade hides it", async ({
    authedPage: page,
  }) => {
    await gotoInvestments(page)
    await expect(page.getByRole("img", { name: "Equity curve" })).toBeVisible()

    // Fewer than two trades left → no curve to draw.
    await page
      .locator("label")
      .filter({ hasText: /^Spot$/ })
      .click()
    await expect(page.getByRole("img", { name: "Equity curve" })).toHaveCount(0)
  })

  test("manual trade form prefills PnL from the prices and direction", async ({
    authedPage: page,
  }) => {
    await gotoInvestments(page)
    await page.getByRole("button", { name: "Add trade" }).click()

    const dialog = page.getByRole("dialog")
    await dialog.getByLabel("Pair").fill("ABCUSDT")
    await dialog.getByLabel("Quantity").fill("2")
    await dialog.getByLabel("Entry price").fill("100")
    await dialog.getByLabel("Exit price").fill("130")

    // Long: (130 − 100) × 2 = +60; switching to Short flips the sign.
    await expect(dialog.getByLabel(/PnL/)).toHaveValue(/\$60/)
    await dialog
      .locator("label")
      .filter({ hasText: /^Short$/ })
      .click()
    await expect(dialog.getByLabel(/PnL/)).toHaveValue(/-\$60/)

    await dialog.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Trade added")).toBeVisible()
  })
})

test.describe("Investments — portfolio", () => {
  test("shows totalValue and degrades gracefully without price / buy price", async ({
    authedPage: page,
  }) => {
    await gotoInvestments(page)
    await page.getByRole("tab", { name: "Portfolio" }).click()

    await expect(page.getByText("$30,100.00")).toBeVisible()

    const rows = page.locator("table tbody tr")
    // Priced asset with a buy price → value + green PnL.
    const btc = rows.filter({ hasText: "BTC" }).first()
    await expect(btc.getByText("+$5,000.00")).toBeVisible()
    await expect(btc.getByText("(+20.00%)")).toBeVisible()
    // No ticker on Bybit → "no price", stays in the list.
    await expect(rows.filter({ hasText: "RARECOIN" }).getByText("no price")).toBeVisible()
    // No buy price → value is shown but PnL is a dash.
    await expect(rows.filter({ hasText: "USDT" }).getByText("—")).toBeVisible()
  })
})

test.describe("Investments — exchange accounts", () => {
  test("lists the connected account with its sync status", async ({ authedPage: page }) => {
    await gotoInvestments(page)
    await page.getByRole("tab", { name: "Exchange accounts" }).click()

    // Wait for a piece of text unique to the accounts panel first (retry-until-found, never
    // ambiguous) before checking account-specific text — right after the click the DOM can
    // still briefly hold the previous (journal) tab's content, and unlike "not found", a
    // strict-mode multi-match doesn't get retried, so a query that's momentarily ambiguous
    // (e.g. from the journal's still-present position rows) fails immediately instead of
    // waiting out the switch.
    await expect(page.getByRole("button", { name: "Add account" })).toBeVisible()

    // Scoped to the tabpanel: the journal's "Account" filter Select keeps a hidden copy of its
    // options (including "Main account") mounted in a body-level portal — a page-wide text
    // search collides with it. The dropdown portal sits outside any tabpanel, so this excludes it.
    const panel = page.getByRole("tabpanel")
    await expect(panel.getByText("Main account")).toBeVisible()
    await expect(panel.getByText("••••3f9a")).toBeVisible()
    await expect(panel.getByText(/Synced at/)).toBeVisible()
    await expect(panel.getByRole("button", { name: "Sync now" })).toBeVisible()
  })

  test("without accounts the page opens on the read-only onboarding", async ({
    authedPage: page,
  }) => {
    await page.route(
      (url) => path(url, "/investing/accounts"),
      (route) =>
        route.request().method() === "GET" ? route.fulfill({ json: [] }) : route.fallback(),
    )
    await gotoInvestments(page)

    await expect(page.getByText("Connect your Bybit account")).toBeVisible()
    await expect(page.getByText(/Read-Only permission/)).toBeVisible()
    await expect(page.getByText(/whitelist/).first()).toBeVisible()
    await expect(page.getByRole("button", { name: "Connect" })).toBeVisible()
  })

  test("a key with trade permissions gets the re-create hint, a bad key the generic one", async ({
    authedPage: page,
  }) => {
    let postResponse = {
      status: 400,
      json: { message: "This API key has trade permissions and was rejected" },
    }
    await page.route(
      (url) => path(url, "/investing/accounts"),
      (route) => {
        if (route.request().method() === "GET") return route.fulfill({ json: [] })
        return route.fulfill(postResponse)
      },
    )
    await gotoInvestments(page)

    await page.getByLabel("API key").fill("key-123")
    await page.getByLabel("API secret").fill("secret-456")
    await page.getByLabel("Name").fill("Main account")
    await page.getByRole("button", { name: "Connect" }).click()
    await expect(
      page.getByText("Re-create the key on Bybit with the Read-Only type", { exact: false }),
    ).toBeVisible()

    postResponse = { status: 400, json: { message: "Bybit rejected the API key" } }
    await page.getByRole("button", { name: "Connect" }).click()
    await expect(
      page.getByText("Bybit rejected the key — check the key and the secret"),
    ).toBeVisible()
  })
})

test.describe("Investments — plan gate", () => {
  test("403 from the backend turns the page into the paywall", async ({ authedPage: page }) => {
    await page.route(
      (url) => url.pathname.includes("/investing/"),
      (route) =>
        route.fulfill({
          status: 403,
          json: { message: "Investing section requires a Pro or Ultra plan" },
        }),
    )
    await page.goto("/investments")

    await expect(page.getByText("Investing requires a Pro or Ultra plan")).toBeVisible()
    // The tabs (and any data) must not render behind the paywall.
    await expect(page.getByRole("tab", { name: "Trade journal" })).toHaveCount(0)
  })
})
