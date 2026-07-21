import {
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  format,
  startOfWeek,
  subDays,
} from "date-fns"

export const STUBS_ENABLED = false

const BASE_CURRENCY = "USD"

// ── deterministic RNG ──────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rng = mulberry32(0xc0ffee)
const rand = (min: number, max: number) => min + rng() * (max - min)
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1))
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]
const round2 = (n: number) => Math.round(n * 100) / 100

function toWallClockIso(d: Date): string {
  const p = (n: number, len = 2) => String(n).padStart(len, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(
    d.getMinutes(),
  )}:${p(d.getSeconds())}.000Z`
}

interface CatDef {
  id: string
  name: string
  emoji: string
  weight: number
  min: number
  max: number
  descriptions: readonly string[]
}

const EXPENSE_CATEGORIES: CatDef[] = [
  {
    id: "ec-groceries",
    name: "Groceries",
    emoji: "🛒",
    weight: 9,
    min: 12,
    max: 140,
    descriptions: ["Supermarket", "Weekly groceries", "Farmers market", "Bakery", "Butcher"],
  },
  {
    id: "ec-restaurants",
    name: "Restaurants",
    emoji: "🍽️",
    weight: 7,
    min: 14,
    max: 95,
    descriptions: ["Lunch out", "Dinner with friends", "Coffee shop", "Brunch", "Takeaway"],
  },
  {
    id: "ec-transport",
    name: "Transport",
    emoji: "🚗",
    weight: 6,
    min: 5,
    max: 70,
    descriptions: ["Taxi ride", "Fuel", "Metro pass", "Parking", "Car wash"],
  },
  {
    id: "ec-rent",
    name: "Rent",
    emoji: "🏠",
    weight: 1,
    min: 1400,
    max: 1600,
    descriptions: ["Monthly rent"],
  },
  {
    id: "ec-utilities",
    name: "Utilities",
    emoji: "💡",
    weight: 2,
    min: 40,
    max: 180,
    descriptions: ["Electricity", "Water", "Internet", "Gas bill", "Mobile plan"],
  },
  {
    id: "ec-entertainment",
    name: "Entertainment",
    emoji: "🎬",
    weight: 4,
    min: 10,
    max: 120,
    descriptions: ["Cinema", "Concert tickets", "Games", "Museum", "Night out"],
  },
  {
    id: "ec-health",
    name: "Health",
    emoji: "💊",
    weight: 3,
    min: 15,
    max: 220,
    descriptions: ["Pharmacy", "Doctor visit", "Dentist", "Gym", "Supplements"],
  },
  {
    id: "ec-shopping",
    name: "Shopping",
    emoji: "🛍️",
    weight: 5,
    min: 20,
    max: 320,
    descriptions: ["Clothing", "Electronics", "Home goods", "Shoes", "Accessories"],
  },
  {
    id: "ec-travel",
    name: "Travel",
    emoji: "✈️",
    weight: 2,
    min: 120,
    max: 900,
    descriptions: ["Flight tickets", "Hotel", "Airbnb", "Train", "Car rental"],
  },
  {
    id: "ec-education",
    name: "Education",
    emoji: "📚",
    weight: 2,
    min: 20,
    max: 260,
    descriptions: ["Online course", "Books", "Workshop", "Certification"],
  },
  {
    id: "ec-subscriptions",
    name: "Subscriptions",
    emoji: "📺",
    weight: 3,
    min: 5,
    max: 35,
    descriptions: ["Netflix", "Spotify", "iCloud", "YouTube Premium", "Notion"],
  },
  {
    id: "ec-gifts",
    name: "Gifts",
    emoji: "🎁",
    weight: 2,
    min: 20,
    max: 200,
    descriptions: ["Birthday gift", "Present", "Charity", "Flowers"],
  },
]

const INCOME_CATEGORIES: CatDef[] = [
  {
    id: "ic-salary",
    name: "Salary",
    emoji: "💰",
    weight: 0,
    min: 5800,
    max: 6800,
    descriptions: ["Monthly salary"],
  },
  {
    id: "ic-freelance",
    name: "Freelance",
    emoji: "💻",
    weight: 6,
    min: 400,
    max: 2200,
    descriptions: ["Project payment", "Consulting", "Design gig", "Code review", "Retainer"],
  },
  {
    id: "ic-investments",
    name: "Investments",
    emoji: "📈",
    weight: 4,
    min: 150,
    max: 1600,
    descriptions: ["Stock sale", "Capital gains", "Crypto profit", "Rebalancing"],
  },
  {
    id: "ic-dividends",
    name: "Dividends",
    emoji: "🏦",
    weight: 3,
    min: 60,
    max: 520,
    descriptions: ["Quarterly dividend", "ETF payout", "REIT payout"],
  },
  {
    id: "ic-bonus",
    name: "Bonus",
    emoji: "🎯",
    weight: 0,
    min: 1500,
    max: 4000,
    descriptions: ["Performance bonus", "Quarterly bonus"],
  },
  {
    id: "ic-refunds",
    name: "Refunds",
    emoji: "↩️",
    weight: 2,
    min: 20,
    max: 360,
    descriptions: ["Tax refund", "Store refund", "Cashback", "Reimbursement"],
  },
]

function weightedPick(defs: CatDef[]): CatDef {
  const pool = defs.filter((c) => c.weight > 0)
  const total = pool.reduce((s, c) => s + c.weight, 0)
  let r = rng() * total
  for (const c of pool) {
    r -= c.weight
    if (r <= 0) return c
  }
  return pool[0]
}

const weightedExpenseCat = () => weightedPick(EXPENSE_CATEGORIES)
const weightedIncomeCat = () => weightedPick(INCOME_CATEGORIES)

interface Tx {
  id: string
  type: "income" | "expense"
  cat: CatDef
  amount: number
  description: string
  date: Date
  createdAt: Date
}

function randomTimeOn(day: Date): Date {
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    randInt(7, 22),
    randInt(0, 59),
    randInt(0, 59),
  )
}

function buildDataset(): Tx[] {
  const now = new Date()
  const start = subDays(now, 365)
  const txs: Tx[] = []
  let n = 0

  for (const day of eachDayOfInterval({ start, end: now })) {
    if (rng() < 0.04) continue
    const count = randInt(3, 7)
    for (let i = 0; i < count; i++) {
      const cat = weightedExpenseCat()
      const date = randomTimeOn(day)
      txs.push({
        id: `ex-${n++}`,
        type: "expense",
        cat,
        amount: round2(rand(cat.min, cat.max)),
        description: pick(cat.descriptions),
        date,
        createdAt: date,
      })
    }

    if (rng() < 0.6) {
      const incomeCount = randInt(1, 2)
      for (let i = 0; i < incomeCount; i++) {
        const cat = weightedIncomeCat()
        const date = randomTimeOn(day)
        txs.push({
          id: `in-${n++}`,
          type: "income",
          cat,
          amount: round2(rand(cat.min, cat.max)),
          description: pick(cat.descriptions),
          date,
          createdAt: date,
        })
      }
    }
  }

  const months = eachMonthOfInterval({ start, end: now })
  for (const m of months) {
    const rentDay = new Date(m.getFullYear(), m.getMonth(), 3, 10, 0, 0)
    if (rentDay >= start && rentDay <= now) {
      const cat = EXPENSE_CATEGORIES.find((c) => c.id === "ec-rent")!
      txs.push({
        id: `ex-${n++}`,
        type: "expense",
        cat,
        amount: round2(rand(cat.min, cat.max)),
        description: cat.descriptions[0],
        date: rentDay,
        createdAt: rentDay,
      })
    }

    const salaryDay = new Date(m.getFullYear(), m.getMonth(), 5, 9, 0, 0)
    if (salaryDay >= start && salaryDay <= now) {
      const cat = INCOME_CATEGORIES.find((c) => c.id === "ic-salary")!
      txs.push({
        id: `in-${n++}`,
        type: "income",
        cat,
        amount: round2(rand(cat.min, cat.max)),
        description: cat.descriptions[0],
        date: salaryDay,
        createdAt: salaryDay,
      })
    }

    if (m.getMonth() % 3 === 0) {
      const cat = INCOME_CATEGORIES.find((c) => c.id === "ic-bonus")!
      const date = new Date(m.getFullYear(), m.getMonth(), 20, 12, 0, 0)
      if (date >= start && date <= now)
        txs.push({
          id: `in-${n++}`,
          type: "income",
          cat,
          amount: round2(rand(cat.min, cat.max)),
          description: pick(cat.descriptions),
          date,
          createdAt: date,
        })
    }
  }

  return txs.sort((a, b) => b.date.getTime() - a.date.getTime())
}

const DATASET = buildDataset()

const catOut = (c: CatDef) => ({ id: c.id, name: c.name, emoji: c.emoji })

function listItem(t: Tx) {
  return {
    id: t.id,
    amount: t.amount,
    description: t.description,
    date: toWallClockIso(t.date),
    createdAt: toWallClockIso(t.createdAt),
    category: catOut(t.cat),
  }
}

function transactionItem(t: Tx) {
  return {
    id: t.id,
    categoryId: t.cat.id,
    categoryName: t.cat.name,
    amount: t.amount,
    currency: BASE_CURRENCY,
    description: t.description,
    date: toWallClockIso(t.date),
    type: t.type,
  }
}

function parseDate(s: string | null): Date | null {
  if (!s) return null
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}
function inRange(t: Tx, from: Date | null, to: Date | null): boolean {
  if (from && t.date < from) return false
  if (to) {
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59)
    if (t.date > end) return false
  }
  return true
}

function bucketKey(d: Date, g: string): string {
  if (g === "month") return format(d, "yyyy-MM")
  if (g === "week") return format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd")
  return format(d, "yyyy-MM-dd")
}

function buildSummary(type: "income" | "expense", from: Date, to: Date, granularity: string) {
  const items = DATASET.filter((t) => t.type === type && inRange(t, from, to))
  const byBucket = new Map<string, { total: number; count: number }>()
  for (const t of items) {
    const key = bucketKey(t.date, granularity)
    const cur = byBucket.get(key) ?? { total: 0, count: 0 }
    cur.total += t.amount
    cur.count += 1
    byBucket.set(key, cur)
  }

  const labels =
    granularity === "month"
      ? eachMonthOfInterval({ start: from, end: to }).map((d) => format(d, "yyyy-MM"))
      : granularity === "week"
        ? eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 1 }).map((d) =>
            format(d, "yyyy-MM-dd"),
          )
        : eachDayOfInterval({ start: from, end: to }).map((d) => format(d, "yyyy-MM-dd"))

  const buckets = labels.map((label) => {
    const agg = byBucket.get(label)
    const total = round2(agg?.total ?? 0)
    return {
      bucket: label,
      totals: agg ? [{ currency: BASE_CURRENCY, total, count: agg.count }] : [],
      approxTotal: total,
    }
  })

  const total = round2(buckets.reduce((s, b) => s + (b.approxTotal ?? 0), 0))
  return { baseCurrency: BASE_CURRENCY, granularity, total, buckets }
}

function buildCategoryStats(
  type: "income" | "expense",
  from: Date | null,
  to: Date | null,
  compareFrom: Date | null,
  compareTo: Date | null,
) {
  const defs = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
  const out = []
  for (const cat of defs) {
    const items = DATASET.filter(
      (t) => t.type === type && t.cat.id === cat.id && inRange(t, from, to),
    )
    if (items.length === 0) continue
    const total = round2(items.reduce((s, t) => s + t.amount, 0))
    const row: Record<string, unknown> = {
      ...catOut(cat),
      count: items.length,
      totals: [{ currency: BASE_CURRENCY, total, count: items.length }],
      baseCurrency: BASE_CURRENCY,
      approxTotal: total,
    }
    if (compareFrom && compareTo) {
      const prevItems = DATASET.filter(
        (t) => t.type === type && t.cat.id === cat.id && inRange(t, compareFrom, compareTo),
      )
      const prev = round2(prevItems.reduce((s, t) => s + t.amount, 0))
      row.previousApproxTotal = prev
      row.deltaApproxTotal = round2(total - prev)
    }
    out.push(row)
  }
  return out.sort((a, b) => (b.approxTotal as number) - (a.approxTotal as number))
}

function buildTransactions(params: URLSearchParams) {
  const type = params.get("type") as "income" | "expense" | null
  const categoryIds = params.getAll("categoryId")
  const currencies = params.getAll("currency")
  const search = params.get("search")?.toLowerCase()
  const from = parseDate(params.get("from"))
  const to = parseDate(params.get("to"))
  const page = Number(params.get("page") ?? 1)
  const limit = Number(params.get("limit") ?? 20)

  let items = DATASET.filter((t) => inRange(t, from, to))
  if (type) items = items.filter((t) => t.type === type)
  if (categoryIds.length) items = items.filter((t) => categoryIds.includes(t.cat.id))
  if (currencies.length) items = items.filter(() => currencies.includes(BASE_CURRENCY))
  if (search)
    items = items.filter(
      (t) =>
        t.description.toLowerCase().includes(search) || t.cat.name.toLowerCase().includes(search),
    )

  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const startIdx = (page - 1) * limit
  const pageSlice = items.slice(startIdx, startIdx + limit)
  const pageItems = pageSlice.map(transactionItem)

  // The totals are computed over the current page's transactions (in the base currency),
  // not the whole dataset: when the page or page size changes, they are recomputed to match
  // what is actually shown in the table.
  const income = round2(
    pageSlice.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
  )
  const expense = round2(
    pageSlice.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
  )

  return {
    items: pageItems,
    total,
    page,
    limit,
    totalPages,
    summary: { baseCurrency: BASE_CURRENCY, income, expense, net: round2(income - expense) },
  }
}

function buildBalance() {
  const income = DATASET.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const expense = DATASET.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  const balance = round2(income - expense)
  return { baseCurrency: BASE_CURRENCY, balance, balanceUsd: balance }
}

function buildMe() {
  return {
    email: "alex.morgan@example.com",
    name: "Alex Morgan",
    currency: BASE_CURRENCY,
    timezone: "America/New_York",
    subscription: {
      plan: {
        id: "plan-pro",
        name: "pro",
        maxCategories: null,
        maxTransactionsPerMonth: null,
        price: "12.00",
        investingAccess: true,
      },
      expiresAt: null,
    },
    hasPassword: true,
    emailVerified: true,
  }
}

// Consistent with the pro plan above (unlimited). To exercise the limit warnings/blocking in
// stub mode, give the free plan its caps in buildMe and return numbers here, e.g.
// { categories: { used: 5, limit: 5, remaining: 0 }, transactions: { used: 19, limit: 20, remaining: 1 } }.
function buildUsage() {
  return {
    categories: { used: 12, limit: null, remaining: null },
    transactions: { used: 34, limit: null, remaining: null },
  }
}

// ── investing (Pro/Ultra section) ──────────────────────────────────────────────
// Fixed, deterministic fixtures (no RNG): the e2e specs assert on these values.
// Shapes mirror /api/investing/* — Decimal fields are strings, like the backend sends.

const INVESTING_ACCOUNTS = [
  {
    id: "acc-bybit-1",
    exchange: "bybit",
    label: "Main account",
    status: "ACTIVE",
    lastError: null,
    apiKeyMasked: "••••3f9a",
    syncFrom: "2026-01-01T00:00:00.000Z",
    lastSyncAt: "2026-07-16T09:00:00.000Z",
    createdAt: "2026-07-01T10:00:00.000Z",
  },
]

const INVESTING_POSITIONS = [
  // linear (futures): openedAt unavailable for this one (opening fills predate synced history) —
  // exercises the graceful "—" fallback for both Opened and Fee; 10x leverage, so entryVolumeUsd
  // (580) is the notional (5800) divided down to capital actually committed.
  {
    id: "pos-linear-1",
    accountId: "acc-bybit-1",
    source: "bybit",
    symbol: "BTCUSDT",
    category: "linear",
    side: "Sell",
    qty: "0.1",
    avgEntryPrice: "58000",
    avgExitPrice: "59205",
    closedPnl: "120.5",
    leverage: "10",
    openedAt: null,
    closedAt: "2026-07-15T14:30:00.000Z",
    entryVolumeUsd: 580,
    totalFeeUsd: null,
  },
  // spot: always Long, no leverage (entryVolumeUsd = full notional), openedAt = oldest closed
  // FIFO buy, totalFeeUsd sums the buy + sell fills' fees over the position's life.
  {
    id: "pos-spot-1",
    accountId: "acc-bybit-1",
    source: "bybit",
    symbol: "SOLUSDT",
    category: "spot",
    side: "Sell",
    qty: "20",
    avgEntryPrice: "140",
    avgExitPrice: "141.5",
    closedPnl: "30",
    leverage: null,
    openedAt: "2026-07-01T08:00:00.000Z",
    closedAt: "2026-07-14T10:00:00.000Z",
    entryVolumeUsd: 2800,
    totalFeeUsd: 2.83,
  },
  // manual: user-entered, editable, side Buy → Short. No synced fills → totalFeeUsd is always null.
  {
    id: "pos-manual-1",
    accountId: null,
    source: "manual",
    symbol: "ETHUSDT",
    category: "manual",
    side: "Buy",
    qty: "1.5",
    avgEntryPrice: "3200",
    avgExitPrice: "3233.5",
    closedPnl: "-50.25",
    leverage: "3",
    openedAt: "2026-07-10T12:00:00.000Z",
    closedAt: "2026-07-13T18:00:00.000Z",
    entryVolumeUsd: 1600,
    totalFeeUsd: null,
  },
]

const INVESTING_HOLDINGS = {
  items: [
    {
      id: "hold-btc",
      asset: "BTC",
      amount: "0.5",
      avgBuyPrice: "50000",
      location: "Cold wallet",
      note: null,
      price: 60000,
      value: 30000,
      pnlUsd: 5000,
      pnlPct: 20,
      createdAt: "2026-06-01T10:00:00.000Z",
      updatedAt: "2026-07-10T10:00:00.000Z",
    },
    // no avgBuyPrice → value is known, PnL is not
    {
      id: "hold-usdt",
      asset: "USDT",
      amount: "100",
      avgBuyPrice: null,
      location: "Bybit",
      note: "stable stash",
      price: 1,
      value: 100,
      pnlUsd: null,
      pnlPct: null,
      createdAt: "2026-06-05T10:00:00.000Z",
      updatedAt: "2026-07-10T10:00:00.000Z",
    },
    // no USDT ticker on Bybit → no price, excluded from totalValue
    {
      id: "hold-rare",
      asset: "RARECOIN",
      amount: "1000",
      avgBuyPrice: "0.5",
      location: "MEXC",
      note: null,
      price: null,
      value: null,
      pnlUsd: null,
      pnlPct: null,
      createdAt: "2026-06-10T10:00:00.000Z",
      updatedAt: "2026-07-10T10:00:00.000Z",
    },
  ],
  totalValue: 30100,
}

function paged<T extends { symbol: string; accountId: string | null }>(
  rows: T[],
  params: URLSearchParams,
) {
  const symbol = params.get("symbol")
  const accountId = params.get("accountId")
  let items = rows
  if (symbol) items = items.filter((r) => r.symbol === symbol)
  if (accountId) items = items.filter((r) => r.accountId === accountId)
  const total = items.length
  const offset = Number(params.get("offset") ?? 0)
  const limit = Number(params.get("limit") ?? 50)
  return { items: items.slice(offset, offset + limit), total }
}

export function getStub(url: string, method: string): unknown {
  if (method !== "GET") return undefined

  const parsed = new URL(url, "http://stub.local")
  const path = parsed.pathname
  const q = parsed.searchParams
  const from = parseDate(q.get("from"))
  const to = parseDate(q.get("to"))
  const granularity = q.get("granularity") ?? "month"

  if (path.endsWith("/auth/me")) return buildMe()
  if (path.endsWith("/subscriptions/usage")) return buildUsage()

  if (path.endsWith("/investing/accounts")) return INVESTING_ACCOUNTS
  if (path.endsWith("/investing/positions")) return paged(INVESTING_POSITIONS, q)
  if (path.endsWith("/investing/holdings")) return INVESTING_HOLDINGS
  if (path.endsWith("/transactions/balance")) return buildBalance()
  if (path.endsWith("/transactions")) return buildTransactions(q)

  if (path.endsWith("/expenses/summary"))
    return buildSummary("expense", from ?? subDays(new Date(), 365), to ?? new Date(), granularity)
  if (path.endsWith("/incomes/summary"))
    return buildSummary("income", from ?? subDays(new Date(), 365), to ?? new Date(), granularity)

  if (path.endsWith("/expense-categories/stats"))
    return buildCategoryStats(
      "expense",
      from,
      to,
      parseDate(q.get("compareFrom")),
      parseDate(q.get("compareTo")),
    )
  if (path.endsWith("/income-categories/stats"))
    return buildCategoryStats(
      "income",
      from,
      to,
      parseDate(q.get("compareFrom")),
      parseDate(q.get("compareTo")),
    )

  if (path.endsWith("/expense-categories")) return EXPENSE_CATEGORIES.map(catOut)
  if (path.endsWith("/income-categories")) return INCOME_CATEGORIES.map(catOut)

  if (path.endsWith("/expenses"))
    return DATASET.filter((t) => t.type === "expense" && inRange(t, from, to)).map(listItem)
  if (path.endsWith("/incomes"))
    return DATASET.filter((t) => t.type === "income" && inRange(t, from, to)).map(listItem)

  return undefined
}
