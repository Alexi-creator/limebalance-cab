import type { Page } from "@playwright/test"
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

/**
 * Money arriving from outside the app: coins someone sent you, or a holding that predates every
 * record here. Without it a wallet that was never funded from this ledger could only be described
 * by adding its coins, which read as profit made out of nothing.
 */
test.describe("Transfers — the outside world", () => {
  const VENUES = {
    items: [
      {
        id: "v1",
        name: "Cold wallet",
        accountId: null,
        mode: "MANUAL",
        archived: false,
        transferredUsd: 0,
        valueUsd: 0,
        resultUsd: 0,
        openingUsd: null,
        openingAt: null,
        adjustmentsUsd: 0,
        valueAt: null,
        coins: [],
      },
    ],
    baseCurrency: "USD",
    totalUsd: 0,
    totalBase: 0,
    investedUsd: 0,
    openingUsd: 0,
    resultUsd: 0,
    isPartial: false,
  }

  async function openTransferForm(page: Page) {
    await mockApi(page)
    // Registered after mockApi so it wins: Playwright runs the most recent handler first.
    await page.route(/\/investing\/venues(\?|$)/, (route) => route.fulfill({ json: VENUES }))
    await page.goto("/investments")
    await page.getByRole("tab", { name: "Deposits" }).click()
    await page.getByRole("button", { name: "Deposit" }).first().click()
  }

  test("offers a third party on the way in as well as on the way out", async ({ page }) => {
    await openTransferForm(page)

    const peer = page.getByRole("dialog").getByLabel("Where from")
    await peer.click()
    // Phrased for the direction it is used in: money arrives *from* a third party.
    await expect(page.getByRole("option", { name: "From someone else" })).toBeVisible()
    await page.getByRole("option", { name: "From someone else" }).click()

    // The hint says the thing that makes this safe to use: the venue grows, the balance does not.
    await expect(page.getByRole("dialog")).toContainText("your balance does not shrink")

    // Coins, not a wallet amount — nothing arrived in a currency you hold.
    await expect(page.getByRole("dialog").getByLabel("Coin")).toBeVisible()
  })

  test("keeps the third party selected when the direction is flipped", async ({ page }) => {
    await openTransferForm(page)

    const dialog = page.getByRole("dialog")
    await dialog.getByLabel("Where from").click()
    await page.getByRole("option", { name: "From someone else" }).click()

    await dialog.getByText("Withdraw", { exact: true }).click()

    // The peer used to be reset on every flip, because it was only valid one way round.
    await expect(dialog.getByLabel("Where to")).toHaveValue("Someone else")
  })
})

/**
 * What the venue cards claim about where the money came from, and what the result is measured
 * against. A connected exchange that predates the app opens with whatever was on it that day —
 * saying "put in" of that, or leaving the result undated, is how three dollars over two days reads
 * as a lifetime verdict.
 */
test.describe("Venues — baseline and result", () => {
  const VENUES = {
    items: [
      {
        id: "v1",
        name: "bybit",
        accountId: "acc1",
        mode: "LIVE",
        archived: false,
        transferredUsd: 0,
        valueUsd: 630,
        resultUsd: -3,
        openingUsd: 633,
        openingAt: "2026-09-14T09:00:00.000Z",
        adjustmentsUsd: 0,
        valueAt: "2026-09-16T09:00:00.000Z",
        coins: [],
      },
      {
        id: "v2",
        name: "Cold wallet",
        accountId: null,
        mode: "MANUAL",
        archived: false,
        transferredUsd: 50,
        valueUsd: 50,
        resultUsd: 0,
        openingUsd: null,
        openingAt: null,
        adjustmentsUsd: 0,
        valueAt: null,
        coins: [],
      },
    ],
    baseCurrency: "USD",
    totalUsd: 680,
    totalBase: 680,
    investedUsd: 683,
    openingUsd: 633,
    resultUsd: -3,
    isPartial: false,
  }

  async function gotoVenues(page: Page) {
    await mockApi(page)
    await page.route(/\/investing\/venues(\?|$)/, (route) => route.fulfill({ json: VENUES }))
    await page.goto("/investments")
    await page.getByRole("tab", { name: "Deposits" }).click()
  }

  test("calls a pre-existing exchange balance what it is, not a deposit", async ({ page }) => {
    await gotoVenues(page)

    const bybit = page
      .locator("div")
      .filter({ hasText: /^bybit/ })
      .first()
    // The whole $633 was already on the exchange — nobody put it in through this app.
    await expect(page.getByText("was here at the start: $633").first()).toBeVisible()
    await expect(page.getByText("Put in: $633")).toHaveCount(0)
    // …and the wallet, funded entirely by a transfer, still says "put in".
    await expect(page.getByText("put in: $50").first()).toBeVisible()
    await expect(bybit).toBeVisible()
  })

  test("dates the result, and only where there is a baseline to date it from", async ({ page }) => {
    await gotoVenues(page)

    // −$3 means nothing until it says over what. The wallet has no baseline moment, so no line.
    await expect(page.getByText("since 14 Sep 2026")).toHaveCount(1)
  })

  test("explains that the headline result is not a trading verdict", async ({ page }) => {
    await gotoVenues(page)

    await page.getByRole("button", { name: /not how your trading went/ }).hover()
    await expect(
      page.getByRole("tooltip").filter({ hasText: "not how your trading went" }),
    ).toBeVisible()
  })
})
