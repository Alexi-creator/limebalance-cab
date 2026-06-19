import { getExpensesSummary, type SummaryParams } from "@api/expenses"
import { getIncomesSummary } from "@api/incomes"
import type { SummaryGranularity } from "@appTypes/expense"
import { EXPENSE_STALE_TIME, expenseKeys } from "@constants/queries/expenses"
import { INCOME_STALE_TIME, incomeKeys } from "@constants/queries/incomes"
import { useQuery } from "@tanstack/react-query"
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns"

/** Summary interval and granularity for the selected chart period. */
function periodToParams(period: string): SummaryParams {
  const now = new Date()
  if (period === "1m") {
    // the whole current month by day: the backend returns future days empty (we draw 0)
    return { from: startOfMonth(now), to: endOfMonth(now), granularity: "day" }
  }
  // 6m / 1y — monthly for the last N months including the current one
  const count = period === "1y" ? 12 : 6
  return { from: startOfMonth(subMonths(now, count - 1)), to: now, granularity: "month" }
}

/**
 * Cash flow chart data for the selected period from the `/summary` summaries
 * (already in the base currency). 1m — by day, 6m/1y — by month. Query keys are shared
 * with other home blocks (same granularity) — react-query deduplicates.
 */
export function useCashflowData(period: string) {
  const params = periodToParams(period)
  const fromKey = format(params.from, "yyyy-MM-dd")
  const toKey = format(params.to, "yyyy-MM-dd")
  const granularity: SummaryGranularity = params.granularity

  const { data: expensesSummary } = useQuery({
    queryKey: expenseKeys.summary(fromKey, toKey, granularity),
    queryFn: () => getExpensesSummary(params),
    staleTime: EXPENSE_STALE_TIME,
  })

  const { data: incomesSummary } = useQuery({
    queryKey: incomeKeys.summary(fromKey, toKey, granularity),
    queryFn: () => getIncomesSummary(params),
    staleTime: INCOME_STALE_TIME,
  })

  return { expensesSummary, incomesSummary }
}
