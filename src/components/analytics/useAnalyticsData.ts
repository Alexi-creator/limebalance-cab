import { getExpenses } from "@api/expenses"
import { getIncomes } from "@api/incomes"
import { EXPENSE_STALE_TIME, expenseKeys } from "@constants/queries/expenses"
import { INCOME_STALE_TIME, incomeKeys } from "@constants/queries/incomes"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { useMemo } from "react"
import { type AnalyticsPeriod, COMPARISON_LIMIT } from "./config"
import {
  buildSeries,
  compareCategories,
  computeMetrics,
  groupByCategory,
  periodToRange,
} from "./helpers"

const key = (d: Date) => format(d, "yyyy-MM-dd")

/**
 * Данные страницы аналитики: грузит операции за текущий и прошлый период
 * и считает из них KPI, временной ряд, разбивку по категориям и сравнение.
 * Ключи range-запросов общие — react-query дедуплицирует между блоками.
 */
export function useAnalyticsData(period: AnalyticsPeriod) {
  const range = useMemo(() => periodToRange(period), [period])
  const { from, to, prevFrom, prevTo } = range

  const expCurQ = useQuery({
    queryKey: expenseKeys.range(key(from), key(to)),
    queryFn: () => getExpenses(from, to),
    staleTime: EXPENSE_STALE_TIME,
  })
  const incCurQ = useQuery({
    queryKey: incomeKeys.range(key(from), key(to)),
    queryFn: () => getIncomes(from, to),
    staleTime: INCOME_STALE_TIME,
  })
  const expPrevQ = useQuery({
    queryKey: expenseKeys.range(key(prevFrom), key(prevTo)),
    queryFn: () => getExpenses(prevFrom, prevTo),
    staleTime: EXPENSE_STALE_TIME,
  })
  const incPrevQ = useQuery({
    queryKey: incomeKeys.range(key(prevFrom), key(prevTo)),
    queryFn: () => getIncomes(prevFrom, prevTo),
    staleTime: INCOME_STALE_TIME,
  })

  const expCur = expCurQ.data ?? []
  const incCur = incCurQ.data ?? []
  const expPrev = expPrevQ.data ?? []
  const incPrev = incPrevQ.data ?? []

  const derived = useMemo(
    () => ({
      metrics: computeMetrics(expCur, incCur, expPrev, incPrev),
      series: buildSeries(expCur, incCur, range, period),
      donut: groupByCategory(expCur),
      comparison: compareCategories(expCur, expPrev, COMPARISON_LIMIT),
    }),
    [expCur, incCur, expPrev, incPrev, range, period],
  )

  return {
    ...derived,
    range,
    isLoading: expCurQ.isLoading || incCurQ.isLoading || expPrevQ.isLoading || incPrevQ.isLoading,
    isError: expCurQ.isError || incCurQ.isError || expPrevQ.isError || incPrevQ.isError,
  }
}
