export const incomeKeys = {
  all: ["incomes"] as const,
  summary: (from: string, to: string, granularity: string) =>
    ["incomes", "summary", from, to, granularity] as const,
  month: (month: string) => ["incomes", "month", month] as const,
  range: (from: string, to: string) => ["incomes", "range", from, to] as const,
  categories: ["incomes", "categories"] as const,
  // prefix for invalidating all category stats
  categoriesStats: ["incomes", "categories", "stats"] as const,
  // stats key for a period (+ optional previous period for comparison)
  categoriesStatsRange: (from: string, to: string, compareFrom?: string, compareTo?: string) =>
    ["incomes", "categories", "stats", from, to, compareFrom ?? null, compareTo ?? null] as const,
}

export const INCOME_STALE_TIME = 60 * 60 * 1000
