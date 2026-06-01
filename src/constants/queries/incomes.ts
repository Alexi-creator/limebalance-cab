export const incomeKeys = {
  all: ["incomes"] as const,
  summary: (months: number) => ["incomes", "summary", months] as const,
  month: (month: string) => ["incomes", "month", month] as const,
  categories: ["incomes", "categories"] as const,
}

export const INCOME_STALE_TIME = 60 * 60 * 1000
