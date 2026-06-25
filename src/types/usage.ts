import { z } from "zod"

/** Usage against a single limit. `limit`/`remaining` are null on unlimited (paid) plans. */
const limitUsageSchema = z.object({
  used: z.number(),
  limit: z.number().nullable(),
  remaining: z.number().nullable(),
})

export const usageSchema = z.object({
  /** Categories (expense + income), lifetime total. */
  categories: limitUsageSchema,
  /** Transactions (expenses + incomes) in the current calendar month; resets monthly. */
  transactions: limitUsageSchema,
})

export type Usage = z.infer<typeof usageSchema>
export type LimitUsage = z.infer<typeof limitUsageSchema>
