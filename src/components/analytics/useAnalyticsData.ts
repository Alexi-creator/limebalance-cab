import { getExpenseCategoriesStats, getExpensesSummary } from "@api/expenses"
import { getIncomesSummary } from "@api/incomes"
import { EXPENSE_STALE_TIME, expenseKeys } from "@constants/queries/expenses"
import { INCOME_STALE_TIME, incomeKeys } from "@constants/queries/incomes"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
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
 * Данные страницы аналитики. KPI и временной ряд — из сводок `/summary` (текущий и
 * прошлый период, базовая валюта), пирог и сравнение по категориям — из `/stats`
 * с параметрами сравнения. Ключи запросов общие — react-query дедуплицирует.
 */
export function useAnalyticsData(period: AnalyticsPeriod) {
  const range = useMemo(() => periodToRange(period), [period])
  const { from, to, prevFrom, prevTo } = range
  const granularity = GRANULARITY[period]

  // сводки текущего периода — KPI (total) + временной ряд (buckets)
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

  // сводки прошлого периода — только итоги (total) для трендов KPI
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

  // статистика категорий расходов с прошлым периодом — пирог (approxTotal) + сравнение (delta)
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
      series: buildSeries(expCurQ.data, incCurQ.data),
      donut: groupByCategory(expStats),
      comparison: compareCategories(expStats, COMPARISON_LIMIT),
    }),
    [expCurQ.data, incCurQ.data, expPrevQ.data, incPrevQ.data, expStats],
  )

  return {
    ...derived,
    range,
    // базовая валюта пользователя — для форматирования KPI
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
