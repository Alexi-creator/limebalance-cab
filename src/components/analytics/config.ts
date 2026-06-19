import { z } from "zod"

/** Analytics periods. The value is stored in the URL (`?period=`), order = order in the toggle. */
export const ANALYTICS_PERIODS = ["week", "month", "quarter", "year"] as const

export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number]

/** How many comparison rows we show (top by absolute change). */
export const COMPARISON_LIMIT = 8

/**
 * URL params schema for the analytics page. `.catch()`/`.default()` guarantee that
 * `useUrlParams` does not crash on a malformed `?period=` in the link.
 */
export const analyticsParamsSchema = z.object({
  period: z.enum(["week", "month", "quarter", "year"]).catch("month").default("month"),
})

export type AnalyticsParams = z.infer<typeof analyticsParamsSchema>
