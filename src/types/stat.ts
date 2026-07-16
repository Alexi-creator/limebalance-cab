import { wallClockDate } from "@utils/wallClock"
import { z } from "zod"

/** A single transaction in the detailed stat — amount in its original currency (as in the bot). */
export const statItemSchema = z.object({
  date: wallClockDate(),
  amount: z.coerce.number(),
  currency: z.string(),
  description: z.string(),
})

/** Category block: total in the base currency + the underlying transactions. */
export const statCategorySchema = z.object({
  category: z.string(),
  /** Category emoji; the backend may omit it — then the frontend uses a fallback from the palette. */
  emoji: z.string().nullish(),
  /** Category total in the base currency; null if exchange rates are unavailable. */
  total: z.coerce.number().nullable(),
  items: z.array(statItemSchema),
})

/**
 * GET /expenses/stat | /incomes/stat — everything in one response: the overall total and
 * per-category totals (in `baseCurrency`) plus the transaction details for the period.
 */
export const detailedStatSchema = z.object({
  baseCurrency: z.string(),
  total: z.coerce.number().nullable(),
  categories: z.array(statCategorySchema),
})

export type StatItem = z.infer<typeof statItemSchema>
export type StatCategory = z.infer<typeof statCategorySchema>
export type DetailedStat = z.infer<typeof detailedStatSchema>
