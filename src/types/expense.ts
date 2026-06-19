import { categorySchema } from "@appTypes/category"
import { wallClockDate } from "@utils/wallClock"
import { z } from "zod"

export const expenseSchema = z.object({
  id: z.string(),
  amount: z.coerce.number(),
  description: z.string(),
  date: wallClockDate(),
  createdAt: z.coerce.date(),
  category: categorySchema,
})

/** Granularity of summary buckets. */
export type SummaryGranularity = "day" | "week" | "month"

/** Total for a period in a single currency (currencies are not summed together). */
export const summaryCurrencyTotalSchema = z.object({
  currency: z.string(),
  total: z.coerce.number(),
  count: z.coerce.number(),
})

/**
 * Summary bucket: breakdown by currency + approx. total in the base currency. `bucket` —
 * interval label: `YYYY-MM-DD` for day/week (week = Monday's date), `YYYY-MM`
 * for month. The backend returns empty buckets with empty `totals` and `approxTotal` (we draw 0).
 */
export const bucketSummarySchema = z.object({
  bucket: z.string(),
  totals: z.array(summaryCurrencyTotalSchema).default([]),
  /** Approx. total for the bucket in the base currency; null if exchange rates are unavailable. */
  approxTotal: z.coerce.number().nullable(),
})

/**
 * Expense summary for a period broken down into buckets of the chosen granularity. Transactions
 * may be in different currencies: per bucket — `totals` (breakdown by currency) and
 * `approxTotal` (converted to `baseCurrency`); `total` — approx. total for the whole period.
 */
export const expensesSummarySchema = z.object({
  baseCurrency: z.string(),
  granularity: z.enum(["day", "week", "month"]),
  total: z.coerce.number().nullable(),
  buckets: z.array(bucketSummarySchema),
})

/** POST /expenses response: the created row without a nested category (only `categoryId`). */
export const createdExpenseSchema = z.object({
  id: z.string(),
  amount: z.coerce.number(),
  description: z.string(),
  date: wallClockDate(),
  createdAt: z.coerce.date(),
  categoryId: z.string(),
})

export type Expense = z.infer<typeof expenseSchema>
export type BucketSummary = z.infer<typeof bucketSummarySchema>
export type ExpensesSummary = z.infer<typeof expensesSummarySchema>
export type CreatedExpense = z.infer<typeof createdExpenseSchema>
