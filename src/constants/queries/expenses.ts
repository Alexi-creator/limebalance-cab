export const expenseKeys = {
  all: ["expenses"] as const,
  summary: (from: string, to: string, granularity: string) =>
    ["expenses", "summary", from, to, granularity] as const,
  // detailed stat for a period: total + per-category totals + transaction details
  stat: (from: string, to: string) => ["expenses", "stat", from, to] as const,
  month: (month: string) => ["expenses", "month", month] as const,
  range: (from: string, to: string) => ["expenses", "range", from, to] as const,
  categories: ["expenses", "categories"] as const,
  // prefix for invalidating all category stats
  categoriesStats: ["expenses", "categories", "stats"] as const,
  // stats key for a period (+ optional previous period for comparison)
  categoriesStatsRange: (from: string, to: string, compareFrom?: string, compareTo?: string) =>
    ["expenses", "categories", "stats", from, to, compareFrom ?? null, compareTo ?? null] as const,
}

export const EXPENSE_STALE_TIME = 60 * 60 * 1000
