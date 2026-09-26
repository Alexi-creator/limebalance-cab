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
})

export type AnalyticsParams = z.infer<typeof analyticsParamsSchema>
