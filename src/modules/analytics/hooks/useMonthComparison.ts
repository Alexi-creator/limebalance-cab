import { useQueries } from "@tanstack/react-query"
import { endOfMonth, format, parse, startOfMonth, subMonths } from "date-fns"
import { COLOR_PALETTE, EMOJI_PALETTE } from "@/modules/categories/config"
import {
  EXPENSE_STALE_TIME,
  expenseSummaryKeys,
  INCOME_STALE_TIME,
  incomeSummaryKeys,
} from "../api/queries"
import { getExpensesStat, getIncomesStat } from "../api/requests"
import { MAX_COMPARED_MONTHS } from "../config"
import type { CategoryBreakdown } from "./useCategoryBreakdown"

const MONTH_RE = /^\d{4}-\d{2}$/
const key = (d: Date) => format(d, "yyyy-MM-dd")

/** `?months=` → sorted unique `YYYY-MM` list; absent or broken — the last three months. */
export function parseMonths(raw: string | undefined, today = new Date()): string[] {
  const picked = [...new Set((raw ?? "").split(",").filter((m) => MONTH_RE.test(m)))].sort()
  if (picked.length > 0) return picked.slice(-MAX_COMPARED_MONTHS)
  return [2, 1, 0].map((n) => format(subMonths(today, n), "yyyy-MM"))
}

export const monthDate = (month: string) => parse(month, "yyyy-MM", new Date())

/** A category row of the comparison: its total (base currency) per compared month. */
export interface MonthComparisonRow {
  key: string
  name: string
  emoji: string
  color: string
  /** Per month, in the order of `months`; 0 — nothing that month, null — no exchange rates. */
  totals: (number | null)[]
}

/**
 * Category totals of the chosen months side by side, from one `/stat` per month (cached per
 * month, shared with the details list when a month is the page's period). Follows the details
 * list's expense/income switch and category filter; colors match the donut where it has them.
 */
export function useMonthComparison(months: string[], breakdown: CategoryBreakdown) {
  const isExpense = breakdown.kind === "expense"

  const results = useQueries({
    queries: months.map((m) => {
      const from = startOfMonth(monthDate(m))
      const to = endOfMonth(from)
      return {
        queryKey: isExpense
          ? expenseSummaryKeys.stat(key(from), key(to))
          : incomeSummaryKeys.stat(key(from), key(to)),
        queryFn: () => (isExpense ? getExpensesStat(from, to) : getIncomesStat(from, to)),
        staleTime: isExpense ? EXPENSE_STALE_TIME : INCOME_STALE_TIME,
      }
    }),
  })

  const colorByKey = new Map(breakdown.rows.map((r) => [r.key, r.color]))
  const byName = new Map<string, MonthComparisonRow>()
  results.forEach((res, i) => {
    for (const c of res.data?.categories ?? []) {
      let row = byName.get(c.category)
      if (!row) {
        const n = byName.size
        row = {
          key: c.category,
          name: c.category,
          emoji: c.emoji || EMOJI_PALETTE[n % EMOJI_PALETTE.length],
          color: colorByKey.get(c.category) ?? COLOR_PALETTE[n % COLOR_PALETTE.length],
          totals: months.map(() => 0),
        }
        byName.set(c.category, row)
      }
      row.totals[i] = c.total
    }
  })

  const all = [...byName.values()]
  const rows = (
    breakdown.isFiltered ? all.filter((r) => breakdown.selected.includes(r.key)) : all
  ).sort((a, b) => sumOf(b.totals) - sumOf(a.totals))
  const totals = months.map((_, i) => rows.reduce((acc, r) => acc + (r.totals[i] ?? 0), 0))

  return {
    rows,
    /** Column totals of the shown rows, per month. */
    totals,
    baseCurrency: results.find((r) => r.data)?.data?.baseCurrency,
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
  }
}

const sumOf = (xs: (number | null)[]) => xs.reduce<number>((acc, x) => acc + (x ?? 0), 0)
