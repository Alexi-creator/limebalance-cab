import type { CategoryStats } from "@appTypes/category"
import type { ExpensesSummary, SummaryGranularity } from "@appTypes/expense"
import type { IncomesSummary } from "@appTypes/income"
import { COLOR_PALETTE, EMOJI_PALETTE } from "@components/categories/config"
import type { Locale } from "date-fns"
import {
  differenceInCalendarDays,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subQuarters,
  subWeeks,
  subYears,
} from "date-fns"
import { enUS } from "date-fns/locale"
import type { AnalyticsPeriod } from "./config"

const WEEK_OPTS = { weekStartsOn: 1 as const }

/**
 * Time-series bucket granularity for the period (passed to `/summary`):
 * week/month — by day, quarter — by week, year — by month.
 */
export const GRANULARITY: Record<AnalyticsPeriod, SummaryGranularity> = {
  week: "day",
  month: "day",
  quarter: "week",
  year: "month",
}

export interface AnalyticsRange {
  from: Date
  to: Date
  prevFrom: Date
  prevTo: Date
}

/** Current and previous interval for the selected period relative to `now`. */
export function periodToRange(period: AnalyticsPeriod, now: Date = new Date()): AnalyticsRange {
  switch (period) {
    case "week": {
      // current week: from Monday through today inclusive (not up to the upcoming Sunday)
      return {
        from: startOfWeek(now, WEEK_OPTS),
        to: now,
        // the previous week over the same span (Mon .. the same weekday) — for a fair comparison
        prevFrom: startOfWeek(subWeeks(now, 1), WEEK_OPTS),
        prevTo: subWeeks(now, 1),
      }
    }
    case "quarter": {
      const prev = subQuarters(now, 1)
      return {
        from: startOfQuarter(now),
        to: endOfQuarter(now),
        prevFrom: startOfQuarter(prev),
        prevTo: endOfQuarter(prev),
      }
    }
    case "year": {
      const prev = subYears(now, 1)
      return {
        from: startOfYear(now),
        to: endOfYear(now),
        prevFrom: startOfYear(prev),
        prevTo: endOfYear(prev),
      }
    }
    default: {
      const prev = subMonths(now, 1)
      return {
        from: startOfMonth(now),
        to: endOfMonth(now),
        prevFrom: startOfMonth(prev),
        prevTo: endOfMonth(prev),
      }
    }
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
    income: incMap.get(k) ?? 0,
    expense: expMap.get(k) ?? 0,
  }))
}

export interface CategorySlice {
  id: string
  name: string
  icon: string
  color: string
  total: number
  count: number
  pct: number
}

/**
 * Pie slices by expense category from `/stats`: a category's total is `approxTotal`
 * (base currency). Categories without a total are dropped; we sort by descending total.
 */
export function groupByCategory(stats: CategoryStats[]): CategorySlice[] {
  const rows = stats
    .map((s) => ({
      id: s.id,
      name: s.name,
      emoji: s.emoji,
      total: s.approxTotal ?? 0,
      count: s.count,
    }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)

  const total = rows.reduce((s, r) => s + r.total, 0)
  return rows.map((v, i) => ({
    id: v.id,
    name: v.name,
    icon: v.emoji || EMOJI_PALETTE[i % EMOJI_PALETTE.length],
    color: COLOR_PALETTE[i % COLOR_PALETTE.length],
    total: v.total,
    count: v.count,
    pct: total > 0 ? Math.round((v.total / total) * 100) : 0,
  }))
}

export interface CategoryDelta {
  id: string
  name: string
  cur: number
  prev: number
  delta: number
  pct?: number
}

/**
 * Expense comparison by category with the previous period from `/stats` (when passed
 * `compareFrom`/`compareTo`): `approxTotal` — current, `previousApproxTotal` — previous,
 * `deltaApproxTotal` — the difference. By descending absolute change.
 */
export function compareCategories(stats: CategoryStats[], limit: number): CategoryDelta[] {
  return stats
    .map((s) => {
      const cur = s.approxTotal ?? 0
      const prev = s.previousApproxTotal ?? 0
      const delta = s.deltaApproxTotal ?? cur - prev
      return { id: s.id, name: s.name, cur, prev, delta }
    })
    .filter((r) => r.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, limit)
    .map((r) => ({ ...r, pct: r.prev > 0 ? Math.round((r.delta / r.prev) * 100) : undefined }))
}
