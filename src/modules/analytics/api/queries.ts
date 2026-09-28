/**
 * Aggregates sit in the `["expenses"]` / `["incomes"]` namespaces — see the comment in
 * `modules/categories/api/queries.ts`: `categories` and `transactions` share the same root,
 * so invalidating the `["expenses"]` prefix from transactions clears these keys as well.
 */
export const expenseSummaryKeys = {
  summary: (from: string, to: string, granularity: string) =>
    ["expenses", "summary", from, to, granularity] as const,
  /** Summary narrowed to some categories — the chart under the analytics category filter. */
  summaryByCategories: (from: string, to: string, granularity: string, categoryIds: string[]) =>
    ["expenses", "summary", from, to, granularity, [...categoryIds].sort()] as const,
  /** Detailed stat for a period: the total, the per-category split and the transactions. */
  stat: (from: string, to: string) => ["expenses", "stat", from, to] as const,
}

export const incomeSummaryKeys = {
  summary: (from: string, to: string, granularity: string) =>
    ["incomes", "summary", from, to, granularity] as const,
  summaryByCategories: (from: string, to: string, granularity: string, categoryIds: string[]) =>
    ["incomes", "summary", from, to, granularity, [...categoryIds].sort()] as const,
  stat: (from: string, to: string) => ["incomes", "stat", from, to] as const,
}

export const EXPENSE_STALE_TIME = 60 * 60 * 1000
export const INCOME_STALE_TIME = 60 * 60 * 1000
