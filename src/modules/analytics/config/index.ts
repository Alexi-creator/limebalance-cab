import { z } from "zod"
import { PERIOD_PRESETS } from "@/modules/transactions/lib/periods"

/**
 * Analytics periods — the same presets as the transactions/investments period filter, minus
 * "all time" (the page always compares a bounded range with the one before it).
 */
export const ANALYTICS_PERIODS = [...PERIOD_PRESETS, "custom"] as const

export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number]

/**
 * URL params schema for the analytics page. `.catch()` guarantees that `useUrlParams` does not
 * crash on a malformed `?period=` in the link. A preset writes its concrete `from`/`to`
 * (`YYYY-MM-DD`) alongside, so a shared link keeps showing the same dates.
 */
export const analyticsParamsSchema = z.object({
  period: z.enum(ANALYTICS_PERIODS).optional().catch(undefined),
  from: z.string().optional().catch(undefined),
  to: z.string().optional().catch(undefined),
  /** Months of the month comparison, `YYYY-MM` comma-separated; absent — the last three. */
  months: z.string().optional().catch(undefined),
})

/** Most months the comparison shows side by side — beyond that the table stops fitting. */
export const MAX_COMPARED_MONTHS = 6

export type AnalyticsParams = z.infer<typeof analyticsParamsSchema>

/** "≈ {{amount}} / month"-style caption of an average, by the unit it is per. */
export const AVERAGE_KEYS = {
  day: "analytics.avg_per_day",
  week: "analytics.avg_per_week",
  month: "analytics.avg_per_month",
} as const
