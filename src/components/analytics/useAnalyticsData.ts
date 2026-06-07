import { getExpenses, getExpensesSummary } from "@api/expenses"
import { getIncomes, getIncomesSummary } from "@api/incomes"
import { EXPENSE_STALE_TIME, expenseKeys } from "@constants/queries/expenses"
import { INCOME_STALE_TIME, incomeKeys } from "@constants/queries/incomes"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { useMemo } from "react"
import { type AnalyticsPeriod, COMPARISON_LIMIT } from "./config"
import {
  buildSeries,
  compareCategories,
  computeMetricsFromSummary,
  groupByCategory,
  periodToRange,
} from "./helpers"

const key = (d: Date) => format(d, "yyyy-MM-dd")

// Помесячные сводки в базовой валюте (months=12) — общий ключ с главной/графиком,
// поэтому react-query дедуплицирует запросы между страницами.
const SUMMARY_MONTHS = 12

/**
 * Данные страницы аналитики. KPI считаются из помесячных сводок `/summary`
 * (уже в базовой валюте), а временной ряд/разбивка по категориям/сравнение —
 * из списков операций за период. Ключи запросов общие — react-query дедуплицирует.
 */
export function useAnalyticsData(period: AnalyticsPeriod) {
  const range = useMemo(() => periodToRange(period), [period])
  const { from, to, prevFrom, prevTo } = range

  // KPI — из готовых сводок в базовой валюте (доход/расход помесячно)
  const expSummaryQ = useQuery({
    queryKey: expenseKeys.summary(SUMMARY_MONTHS),
    queryFn: () => getExpensesSummary(SUMMARY_MONTHS),
    staleTime: EXPENSE_STALE_TIME,
  })
  const incSummaryQ = useQuery({
    queryKey: incomeKeys.summary(SUMMARY_MONTHS),
    queryFn: () => getIncomesSummary(SUMMARY_MONTHS),
    staleTime: INCOME_STALE_TIME,
  })

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
  // прошлые расходы нужны только для блока «Сравнение с прошлым периодом»
  const expPrevQ = useQuery({
    queryKey: expenseKeys.range(key(prevFrom), key(prevTo)),
    queryFn: () => getExpenses(prevFrom, prevTo),
    staleTime: EXPENSE_STALE_TIME,
  })

  const expCur = expCurQ.data ?? []
  const incCur = incCurQ.data ?? []
  const expPrev = expPrevQ.data ?? []

  const expSummary = expSummaryQ.data
  const incSummary = incSummaryQ.data

  const derived = useMemo(
    () => ({
      // KPI — из помесячных сводок в базовой валюте за месяцы периода
      metrics: computeMetricsFromSummary(expSummary, incSummary, range),
      series: buildSeries(expCur, incCur, range, period),
      donut: groupByCategory(expCur),
      comparison: compareCategories(expCur, expPrev, COMPARISON_LIMIT),
    }),
    [expSummary, incSummary, expCur, incCur, expPrev, range, period],
  )

  return {
    ...derived,
    range,
    // базовая валюта пользователя — для форматирования KPI
    baseCurrency: expSummary?.baseCurrency ?? incSummary?.baseCurrency,
    isLoading:
      expSummaryQ.isLoading ||
      incSummaryQ.isLoading ||
      expCurQ.isLoading ||
      incCurQ.isLoading ||
      expPrevQ.isLoading,
    isError:
      expSummaryQ.isError ||
      incSummaryQ.isError ||
      expCurQ.isError ||
      incCurQ.isError ||
      expPrevQ.isError,
  }
}
