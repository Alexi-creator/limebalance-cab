import type { Locale } from "date-fns"
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns"
import { enUS } from "date-fns/locale"
import { DEFAULT_PERIOD, presetRange } from "@/modules/transactions/lib/periods"
import type { AnalyticsPeriod } from "../config"
import type { ExpensesSummary, IncomesSummary, SummaryGranularity } from "../model"

export interface AnalyticsRange {
  from: Date
  to: Date
  prevFrom: Date
  prevTo: Date
}

/**
 * Period and dates the page shows. A preset uses the dates written next to it in the URL (a
 * shared link stays on its dates), falling back to the preset's current range; a custom range
 * with only the start picked so far reads as that single day. No period and no dates — the
 * default preset.
 */
export function resolveAnalyticsPeriod(
  period: AnalyticsPeriod | undefined,
  from: string | undefined,
  to: string | undefined,
): { period: AnalyticsPeriod; from: string; to: string } {
  const resolved = period ?? (from || to ? "custom" : DEFAULT_PERIOD)
  if (resolved === "custom") {
    const start = from ?? to
    if (start) return { period: resolved, from: start, to: to ?? start }
    return { period: resolved, ...presetRange(DEFAULT_PERIOD) }
  }
  if (from && to) return { period: resolved, from, to }
  return { period: resolved, ...presetRange(resolved) }
}

/**
 * Current interval + the previous one it is compared with. Calendar presets compare with the
 * previous calendar week/month/year (August for September, not "the 30 days before"); a rolling
 * or hand-picked range — with the interval of the same length right before it.
 */
export function analyticsRange(period: AnalyticsPeriod, from: Date, to: Date): AnalyticsRange {
  switch (period) {
    case "this_week":
    case "last_week":
      return { from, to, prevFrom: subWeeks(from, 1), prevTo: subWeeks(to, 1) }
    case "this_month":
    case "last_month": {
      const prev = subMonths(from, 1)
      return { from, to, prevFrom: startOfMonth(prev), prevTo: endOfMonth(prev) }
    }
    case "this_year": {
      const prev = subYears(from, 1)
      return { from, to, prevFrom: startOfYear(prev), prevTo: endOfYear(prev) }
    }
    default:
      return customRange(from, to)
  }
}

/**
 * Custom range `[from, to]` (both inclusive) + the previous interval of the same length
 * immediately before it — for KPI trends and the category comparison.
 */
export function customRange(from: Date, to: Date): AnalyticsRange {
  const days = differenceInCalendarDays(to, from) + 1
  const prevTo = subDays(from, 1)
  return { from, to, prevFrom: subDays(prevTo, days - 1), prevTo }
}

/**
 * Bucket granularity for a custom range by its length: up to ~5 weeks — by day,
 * up to ~4 months — by week, longer — by month.
 */
export function rangeGranularity(from: Date, to: Date): SummaryGranularity {
  const days = differenceInCalendarDays(to, from) + 1
  if (days <= 35) return "day"
  if (days <= 120) return "week"
  return "month"
}

/** Percentage change relative to the previous period; `undefined` if there is no baseline (no badge). */
function pctChange(cur: number, prev: number): number | undefined {
  if (prev === 0) return undefined
  return Math.round(((cur - prev) / prev) * 100)
}

export interface Metrics {
  income: number
  expense: number
  saved: number
  savingsRate: number
  incomeTrend?: number
  expenseTrend?: number
  savedTrend?: number
  rateTrend?: number
}

/** Metrics and trends from income/expense totals (in the base currency). */
function metricsFrom(
  income: number,
  expense: number,
  prevIncome: number,
  prevExpense: number,
): Metrics {
  const saved = income - expense
  const prevSaved = prevIncome - prevExpense
  const savingsRate = income > 0 ? Math.round((saved / income) * 100) : 0
  const prevRate = prevIncome > 0 ? Math.round((prevSaved / prevIncome) * 100) : 0

  return {
    income,
    expense,
    saved,
    savingsRate,
    incomeTrend: pctChange(income, prevIncome),
    expenseTrend: pctChange(expense, prevExpense),
    savedTrend: pctChange(saved, prevSaved),
    rateTrend: prevIncome > 0 ? savingsRate - prevRate : undefined,
  }
}

/**
 * Period KPI metrics in the base currency — from the `total` totals of the `/summary` summaries for
 * the current and previous intervals (the backend already converted everything to the base currency). null → 0.
 */
export function computeMetricsFromSummaries(
  expCur: ExpensesSummary | undefined,
  incCur: IncomesSummary | undefined,
  expPrev: ExpensesSummary | undefined,
  incPrev: IncomesSummary | undefined,
): Metrics {
  return metricsFrom(
    incCur?.total ?? 0,
    expCur?.total ?? 0,
    incPrev?.total ?? 0,
    expPrev?.total ?? 0,
  )
}

export interface SeriesPoint {
  label: string
  /** Full date / period of the bucket — the hover card header. */
  title: string
  income: number
  expense: number
}

/** Bucket label by granularity. For days in a long series we thin out the labels. */
function bucketLabel(
  bucket: string,
  granularity: SummaryGranularity,
  index: number,
  count: number,
  locale: Locale,
): string {
  if (granularity === "month") {
    const [year, month] = bucket.split("-").map(Number)
    return format(new Date(year, month - 1, 1), "LLL", { locale })
  }
  if (granularity === "week") return format(parseISO(bucket), "d.MM")
  // day: with >14 points we label every 5th and the last one, otherwise all
  if (count > 14 && index % 5 !== 0 && index !== count - 1) return ""
  return String(parseISO(bucket).getDate())
}

/** Hover card header: month — "September 2026", week — "1 Sep – 7 Sep", day — "24 September, We". */
function bucketTitle(bucket: string, granularity: SummaryGranularity, locale: Locale): string {
  if (granularity === "month") {
    const [year, month] = bucket.split("-").map(Number)
    return format(new Date(year, month - 1, 1), "LLLL yyyy", { locale })
  }
  const date = parseISO(bucket)
  if (granularity === "week") {
    return `${format(date, "d MMM", { locale })} – ${format(addDays(date, 6), "d MMM", { locale })}`
  }
  return format(date, "d MMMM, EEEEEE", { locale })
}

/**
 * Income/expense time series from summary buckets: merge by `bucket`, empty buckets
 * (`approxTotal: null`) — as 0. Amounts in the base currency (`approxTotal`).
 */
export function buildSeries(
  expSummary: ExpensesSummary | undefined,
  incSummary: IncomesSummary | undefined,
  locale: Locale = enUS,
): SeriesPoint[] {
  const granularity = expSummary?.granularity ?? incSummary?.granularity ?? "month"
  const expMap = new Map((expSummary?.buckets ?? []).map((b) => [b.bucket, b.approxTotal ?? 0]))
  const incMap = new Map((incSummary?.buckets ?? []).map((b) => [b.bucket, b.approxTotal ?? 0]))
  const keys = [...new Set([...expMap.keys(), ...incMap.keys()])].sort()

  return keys.map((k, i) => ({
    label: bucketLabel(k, granularity, i, keys.length, locale),
    title: bucketTitle(k, granularity, locale),
    income: incMap.get(k) ?? 0,
    expense: expMap.get(k) ?? 0,
  }))
}

/** Share label: "<1%" for slivers so they don't read as zero, "—" when unknown. */
export function formatPct(pct: number | null): string {
  if (pct == null) return "—"
  return pct > 0 && pct < 1 ? "<1%" : `${Math.round(pct)}%`
}
