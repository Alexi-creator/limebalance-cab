import { z } from "zod"

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Category emoji; the backend may omit it — then the frontend uses a fallback from the palette. */
  emoji: z.string().nullish(),
})

export type Category = z.infer<typeof categorySchema>

/** Total of a category's transactions in a single currency. */
export const categoryCurrencyTotalSchema = z.object({
  currency: z.string(),
  total: z.coerce.number(),
  count: z.coerce.number(),
})
export type CategoryCurrencyTotal = z.infer<typeof categoryCurrencyTotalSchema>

/**
 * Category with transaction aggregates. Transactions may be in different currencies:
 * `totals` — breakdown by currency, `approxTotal` — everything converted to `baseCurrency`
 * (null if exchange rates are unavailable or the currency is unknown).
 */
export const categoryStatsSchema = categorySchema.extend({
  count: z.coerce.number(),
  totals: z.array(categoryCurrencyTotalSchema).default([]),
  baseCurrency: z.string().nullish(),
  approxTotal: z.coerce.number().nullish(),
  /**
   * Comparison with the previous period — returned only if the request includes
   * `compareFrom`/`compareTo`. `previousApproxTotal` — the category total for the previous
   * period in the base currency, `deltaApproxTotal` — the difference (current − previous).
   */
  previousApproxTotal: z.coerce.number().nullish(),
  deltaApproxTotal: z.coerce.number().nullish(),
})

export type CategoryStats = z.infer<typeof categoryStatsSchema>

/** Request body for creating/updating a category. */
export interface CategoryPayload {
  name: string
  emoji?: string
}
