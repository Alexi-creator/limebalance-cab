export const expenseKeys = {
  all: ["expenses"] as const,
  summary: (from: string, to: string, granularity: string) =>
    ["expenses", "summary", from, to, granularity] as const,
  month: (month: string) => ["expenses", "month", month] as const,
  range: (from: string, to: string) => ["expenses", "range", from, to] as const,
  categories: ["expenses", "categories"] as const,
  // префикс для инвалидации всех статистик категорий
  categoriesStats: ["expenses", "categories", "stats"] as const,
  // ключ статистики за период (+ опц. прошлый период для сравнения)
  categoriesStatsRange: (from: string, to: string, compareFrom?: string, compareTo?: string) =>
    ["expenses", "categories", "stats", from, to, compareFrom ?? null, compareTo ?? null] as const,
}

export const EXPENSE_STALE_TIME = 60 * 60 * 1000
