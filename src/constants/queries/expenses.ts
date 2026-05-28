export const expenseKeys = {
  all: ["expenses"] as const,
  summary: (months: number) => ["expenses", "summary", months] as const,
  month: (month: string) => ["expenses", "month", month] as const,
}

export const EXPENSE_STALE_TIME = 60 * 60 * 1000
