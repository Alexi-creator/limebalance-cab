import type { ExpensesSummary } from "@appTypes/expense"
import type { IncomesSummary } from "@appTypes/income"
import { format, type Locale, parseISO, subMonths } from "date-fns"
import { stubValues } from "./config"

/** Ready-to-render dataset: income/expense series and X-axis labels. */
export interface ChartDataset {
  income: number[]
  expense: number[]
  labels: string[]
}

/** Short names of the last `count` months (for stubs). */
export function getMonthLabels(count: number, locale: Locale): string[] {
  const now = new Date()
  return Array.from({ length: count }, (_, i) =>
    format(subMonths(now, count - 1 - i), "MMM", { locale }),
  )
}

/** Axis bucket label: month (`YYYY-MM`) — short month name, day — day of the month. */
function bucketLabel(
  bucket: string,
  monthly: boolean,
  locale: Locale,
  compact: boolean,
  index: number,
  count: number,
): string {
  if (monthly) {
    const [year, month] = bucket.split("-").map(Number)
    return format(new Date(year, month - 1, 1), "MMM", { locale })
  }
  const day = parseISO(bucket).getDate()
  // in compact mode (narrow screen) we label every 5th bucket and the last one
  if (compact && index % 5 !== 0 && index !== count - 1) return ""
  return String(day)
}

/**
 * Builds the chart dataset from income/expense summary buckets. Merge by `bucket`;
 * empty buckets (the backend returns them with `approxTotal: null`) are drawn as 0. Amounts — in the base
 * currency of the user (`approxTotal`).
 */
export function buildBucketDataset(
  expensesSummary: ExpensesSummary,
  incomesSummary: IncomesSummary,
  locale: Locale,
  compact: boolean,
): ChartDataset {
  const monthly = (expensesSummary.granularity ?? incomesSummary.granularity) === "month"
  const expMap = new Map(expensesSummary.buckets.map((b) => [b.bucket, b.approxTotal ?? 0]))
  const incMap = new Map(incomesSummary.buckets.map((b) => [b.bucket, b.approxTotal ?? 0]))
  // merge bucket keys from both series (in case they diverge) and sort by date
  const keys = [...new Set([...expMap.keys(), ...incMap.keys()])].sort()

  return {
    income: keys.map((k) => incMap.get(k) ?? 0),
    expense: keys.map((k) => expMap.get(k) ?? 0),
    labels: keys.map((k, i) => bucketLabel(k, monthly, locale, compact, i, keys.length)),
  }
}

interface SelectDatasetParams {
  period: string
  locale: Locale
  compact: boolean
  expensesSummary?: ExpensesSummary
  incomesSummary?: IncomesSummary
}

/**
 * Picks the dataset for the current period from the summaries; while there is no data (loading) —
 * shows a stub so the chart does not collapse.
 */
export function selectDataset({
  period,
  locale,
  compact,
  expensesSummary,
  incomesSummary,
}: SelectDatasetParams): ChartDataset {
  if (expensesSummary && incomesSummary) {
    return buildBucketDataset(expensesSummary, incomesSummary, locale, compact)
  }

  const stub = stubValues[period as keyof typeof stubValues] ?? stubValues["6m"]
  return { ...stub, labels: getMonthLabels(stub.income.length, locale) }
}
