import type { Page } from "@playwright/test"
import { expect, test } from "./fixtures"

/**
 * Investing section against the stubbed /api/investing/* endpoints (see
 * src/api/stubs.ts — one bybit account, four positions: an OPEN linear (ADAUSDT, with a
 * note) plus three CLOSED ones (linear/spot/manual), holdings with a missing price and a
 * missing buy price). All copy asserted here is the English fallback.
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

    // Top KPI row, over the whole filtered selection: 120.5 + 30 − 50.25; 2 of 3 trades are
    // green. Scoped by size — the page-summary footer repeats the same numbers at a smaller size.
    await expect(page.locator('[data-size="lg"]').filter({ hasText: "+$100.25" })).toBeVisible()
    await expect(page.locator('[data-size="lg"]').filter({ hasText: "67%" })).toBeVisible()

    // "All time" is captioned with the earliest closed trade's date (ETHUSDT, closedAt
    // 2026-07-13T18:00Z) — sourced from the equity-curve endpoint, sorted ascending, the
    // same request the chart uses. Day depends on the runner's local timezone, like the
    // closedAt cell elsewhere in this file — only the month/year are asserted here.
    await expect(page.getByText(/All time \(since \d+ Jul 2026\)/).first()).toBeVisible()
  })

  test("clearing filters resets the reset (icon-only) button back to the default view", async ({
    authedPage: page,
  }) => {
    await gotoInvestments(page)

    await page.getByLabel("Pair").fill("BTCUSDT")
    await page
      .locator("label")
      .filter({ hasText: /^Spot$/ })
      .click()
    await expect(page.locator("table tbody tr")).toHaveCount(0)

    await page.getByRole("button", { name: "Reset" }).click()

    await expect(page.getByLabel("Pair")).toHaveValue("")
    await expect(page.getByPlaceholder("Status")).toHaveValue("Closed")
    // Back to the default Closed view: linear/spot/manual, ADAUSDT (OPEN) still excluded.
    await expect(page.locator("table tbody tr")).toHaveCount(3)
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

  test("edit and delete are only enabled on manual positions", async ({ authedPage: page }) => {
    await gotoInvestments(page)

    const rows = page.locator("table tbody tr")
    await expect(
      rows.filter({ hasText: "ETHUSDT" }).getByRole("button", { name: "Edit" }),
    ).toBeEnabled()
    await expect(
      rows.filter({ hasText: "BTCUSDT" }).getByRole("button", { name: "Edit" }),
    ).toBeDisabled()
  })

  test("an OPEN position shows a status badge and dashes where PnL/ROI/Closed would be", async ({
    authedPage: page,
  }) => {
    await gotoInvestments(page)
    // The journal defaults to Closed — ADAUSDT is the OPEN one, so it needs Open/All picked first.
    await page.getByPlaceholder("Status").click()
    await page.getByRole("option", { name: "Open" }).click()

    const row = page.locator("table tbody tr").filter({ hasText: "ADAUSDT" })
    await expect(row.getByText("Open", { exact: true })).toBeVisible()
    await expect(row.getByText("still open")).toBeVisible()
  })

  test("notes are available on every position, including bybit ones", async ({
    authedPage: page,
  }) => {
    await gotoInvestments(page)
    // ADAUSDT is OPEN and the journal defaults to Closed — switch to All to see it.
    await page.getByPlaceholder("Status").click()
    await page.getByRole("option", { name: "All", exact: true }).click()

    const row = page.locator("table tbody tr").filter({ hasText: "ADAUSDT" })
    // Edit/delete stay off-limits for a bybit-sourced position — notes don't.
    await expect(row.getByRole("button", { name: "Edit" })).toBeDisabled()
    const notesButton = row.getByRole("button", { name: /Notes/ })
    await expect(notesButton).toBeEnabled()
    await notesButton.click()

    const dialog = page.getByRole("dialog")
    await expect(dialog.getByText("Breakout above the range high", { exact: false })).toBeVisible()

    // The stub doesn't persist mutations — the field clearing on success is the observable signal.
    const noteField = dialog.getByLabel("Note")
    await noteField.fill("Added context")
    await dialog.getByRole("button", { name: "Add note" }).click()
    await expect(noteField).toHaveValue("")
  })

  test("logging a trade as still open hides exit price, closed at and PnL", async ({
    authedPage: page,
  }) => {
    await gotoInvestments(page)
    await page.getByRole("button", { name: "Add trade" }).click()

    const dialog = page.getByRole("dialog")
    await expect(dialog.getByLabel("Exit price")).toBeVisible()

    await dialog.getByLabel("Trade is still open").check()
    await expect(dialog.getByLabel("Exit price")).toHaveCount(0)
    await expect(dialog.getByLabel(/Closed at/)).toHaveCount(0)
    await expect(dialog.getByLabel(/PnL/)).toHaveCount(0)

    await dialog.getByLabel("Pair").fill("XRPUSDT")
    await dialog.getByLabel("Quantity").fill("100")
    await dialog.getByLabel("Entry price").fill("0.5")
    await dialog.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Trade added")).toBeVisible()
  })

  test("the category filter narrows the table server-side", async ({ authedPage: page }) => {
    await gotoInvestments(page)
    // The journal defaults to Closed: linear/spot/manual (ADAUSDT, the open one, is excluded).
    await expect(page.locator("table tbody tr")).toHaveCount(3)

    await page
      .locator("label")
      .filter({ hasText: /^Spot$/ })
      .click()

    await expect(page.locator("table tbody tr")).toHaveCount(1)
    await expect(page.getByText("SOLUSDT")).toBeVisible()
    await expect(page.getByText("BTCUSDT")).toHaveCount(0)
  })

  test("the status filter narrows the table server-side", async ({ authedPage: page }) => {
    await gotoInvestments(page)
    // Defaults to Closed (3 positions) — ADAUSDT (OPEN) only shows up once Open/All is picked.
    await expect(page.locator("table tbody tr")).toHaveCount(3)

    await page.getByPlaceholder("Status").click()
    await page.getByRole("option", { name: "Open" }).click()
    await expect(page.locator("table tbody tr")).toHaveCount(1)
    await expect(page.getByText("ADAUSDT")).toBeVisible()

    await page.getByPlaceholder("Status").click()
    await page.getByRole("option", { name: "Closed" }).click()
    await expect(page.locator("table tbody tr")).toHaveCount(3)
    await expect(page.getByText("ADAUSDT")).toHaveCount(0)
  })

  test("the journal defaults to the Closed status filter on first load", async ({
    authedPage: page,
  }) => {
    await gotoInvestments(page)
    await expect(page.getByPlaceholder("Status")).toHaveValue("Closed")
  })

  test("filters persist in the URL across a reload", async ({ authedPage: page }) => {
    await gotoInvestments(page)

    await page.getByPlaceholder("Status").click()
    await page.getByRole("option", { name: "Open" }).click()
    await expect(page).toHaveURL(/status=OPEN/)

    await page.reload()
    await expect(page.getByRole("heading", { name: "Investments and crypto" })).toBeVisible()
    await expect(page.locator("table tbody tr")).toHaveCount(1)
    await expect(page.getByText("ADAUSDT")).toBeVisible()
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
