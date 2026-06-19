import { wallClockDate } from "@utils/wallClock"
import { z } from "zod"

export const transactionTypeSchema = z.enum(["income", "expense"])
export type TransactionType = z.infer<typeof transactionTypeSchema>

/** A single transaction from the combined /transactions route (category is flat). */
export const transactionSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  categoryName: z.string().nullable(),
  amount: z.coerce.number(),
  /** Transaction currency code (ISO 4217); may be missing on old records. */
  currency: z.string().nullish(),
  description: z.string(),
  date: wallClockDate(),
  type: transactionTypeSchema,
})
export type Transaction = z.infer<typeof transactionSchema>

/**
 * Monetary total for the transactions on the current page (respecting filters),
 * converted to the user's base currency. Amounts are null if exchange rates are unavailable.
 */
export const transactionsSummarySchema = z.object({
  baseCurrency: z.string(),
  income: z.coerce.number().nullable(),
  expense: z.coerce.number().nullable(),
  net: z.coerce.number().nullable(),
})
export type TransactionsSummary = z.infer<typeof transactionsSummarySchema>

/**
 * User's total balance. `balance` — in the base currency, `balanceUsd` — in USD.
 * Either amount is null if exchange rates are unavailable (we show "—").
 */
export const balanceSchema = z.object({
  baseCurrency: z.string(),
  balanceUsd: z.coerce.number().nullable(),
  balance: z.coerce.number().nullable(),
})
export type Balance = z.infer<typeof balanceSchema>

/** Paginated /transactions response. */
export const transactionsResponseSchema = z.object({
  items: z.array(transactionSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  summary: transactionsSummarySchema,
})
export type TransactionsResponse = z.infer<typeof transactionsResponseSchema>
