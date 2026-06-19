import { getExpenseCategoriesStats, getExpensesSummary } from "@api/expenses"
import { getIncomesSummary } from "@api/incomes"
import { EXPENSE_STALE_TIME, expenseKeys } from "@constants/queries/expenses"
import { INCOME_STALE_TIME, incomeKeys } from "@constants/queries/incomes"
import { useQuery } from "@tanstack/react-query"
import type { Locale } from "date-fns"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useMemo } from "react"
import { type AnalyticsPeriod, COMPARISON_LIMIT } from "./config"
import {
  buildSeries,
  compareCategories,
  computeMetricsFromSummaries,
  GRANULARITY,
  groupByCategory,
  periodToRange,
} from "./helpers"

const key = (d: Date) => format(d, "yyyy-MM-dd")

/**
 * Analytics page data. KPIs and the time series come from the `/summary` summaries (current and
 * previous period, base currency); the pie and category comparison come from `/stats`
 * with comparison params. Query keys are shared — react-query deduplicates.
 */
export function useAnalyticsData(period: AnalyticsPeriod, locale: Locale = enUS) {
  const range = useMemo(() => periodToRange(period), [period])
  const { from, to, prevFrom, prevTo } = range
  const granularity = GRANULARITY[period]

  // current period summaries — KPIs (total) + time series (buckets)
  const expCurQ = useQuery({
    queryKey: expenseKeys.summary(key(from), key(to), granularity),
    queryFn: () => getExpensesSummary({ from, to, granularity }),
    staleTime: EXPENSE_STALE_TIME,
  })
  const incCurQ = useQuery({
    queryKey: incomeKeys.summary(key(from), key(to), granularity),
    queryFn: () => getIncomesSummary({ from, to, granularity }),
    staleTime: INCOME_STALE_TIME,
  })

  // previous period summaries — only totals (total) for KPI trends
  const expPrevQ = useQuery({
    queryKey: expenseKeys.summary(key(prevFrom), key(prevTo), granularity),
    queryFn: () => getExpensesSummary({ from: prevFrom, to: prevTo, granularity }),
    staleTime: EXPENSE_STALE_TIME,
  })
  const incPrevQ = useQuery({
    queryKey: incomeKeys.summary(key(prevFrom), key(prevTo), granularity),
    queryFn: () => getIncomesSummary({ from: prevFrom, to: prevTo, granularity }),
    staleTime: INCOME_STALE_TIME,
  })

  // expense category stats with the previous period — pie (approxTotal) + comparison (delta)
  const expStatsQ = useQuery({
    queryKey: expenseKeys.categoriesStatsRange(key(from), key(to), key(prevFrom), key(prevTo)),
    queryFn: () => getExpenseCategoriesStats(from, to, prevFrom, prevTo),
    staleTime: EXPENSE_STALE_TIME,
  })

  const expStats = expStatsQ.data ?? []

  const derived = useMemo(
    () => ({
      metrics: computeMetricsFromSummaries(
        expCurQ.data,
        incCurQ.data,
        expPrevQ.data,
        incPrevQ.data,
      ),
      series: buildSeries(expCurQ.data, incCurQ.data, locale),
      donut: groupByCategory(expStats),
      comparison: compareCategories(expStats, COMPARISON_LIMIT),
    }),
    [expCurQ.data, incCurQ.data, expPrevQ.data, incPrevQ.data, expStats, locale],
  )

  return {
    ...derived,
    range,
    // user's base currency — for formatting KPIs
    baseCurrency: expCurQ.data?.baseCurrency ?? incCurQ.data?.baseCurrency,
    isLoading:
      expCurQ.isLoading ||
      incCurQ.isLoading ||
      expPrevQ.isLoading ||
      incPrevQ.isLoading ||
      expStatsQ.isLoading,
    isError:
      expCurQ.isError ||
      incCurQ.isError ||
      expPrevQ.isError ||
      incPrevQ.isError ||
      expStatsQ.isError,
  }
}
