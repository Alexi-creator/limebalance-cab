import { useQuery } from "@tanstack/react-query"
import type { Locale } from "date-fns"
import { format, parseISO } from "date-fns"
import { enUS } from "date-fns/locale"
import { useMemo } from "react"
import {
  EXPENSE_STALE_TIME,
  expenseSummaryKeys,
  INCOME_STALE_TIME,
  incomeSummaryKeys,
} from "../api/queries"
import { getExpensesSummary, getIncomesSummary } from "../api/requests"
import type { AnalyticsPeriod } from "../config"
import {
  buildSeries,
  computeMetricsFromSummaries,
  customRange,
  GRANULARITY,
  periodToRange,
  rangeGranularity,
} from "../lib/helpers"

const key = (d: Date) => format(d, "yyyy-MM-dd")

/**
 * Analytics page data. KPIs and the time series come from the `/summary` summaries (current and
 * previous period, base currency). The category breakdown (donut, details, comparison with
 * the previous period) lives in `useCategoryBreakdown`. Query keys are shared — react-query
 * deduplicates.
 *
 * `customFrom`/`customTo` (`YYYY-MM-DD`) — a custom date range from the datepicker; when both
 * are set, it overrides `period` (granularity is derived from the range length).
 */
export function useAnalyticsData(
  period: AnalyticsPeriod,
  locale: Locale = enUS,
  customFrom?: string,
  customTo?: string,
) {
  const isCustom = Boolean(customFrom && customTo)
  const range = useMemo(
    () =>
      customFrom && customTo
        ? customRange(parseISO(customFrom), parseISO(customTo))
        : periodToRange(period),
    [period, customFrom, customTo],
  )
  const { from, to, prevFrom, prevTo } = range
  const granularity = isCustom ? rangeGranularity(from, to) : GRANULARITY[period]

  // current period summaries — KPIs (total) + time series (buckets)
  const expCurQ = useQuery({
    queryKey: expenseSummaryKeys.summary(key(from), key(to), granularity),
    queryFn: () => getExpensesSummary({ from, to, granularity }),
    staleTime: EXPENSE_STALE_TIME,
  })
  const incCurQ = useQuery({
    queryKey: incomeSummaryKeys.summary(key(from), key(to), granularity),
    queryFn: () => getIncomesSummary({ from, to, granularity }),
    staleTime: INCOME_STALE_TIME,
  })

  // previous period summaries — only totals (total) for KPI trends
  const expPrevQ = useQuery({
    queryKey: expenseSummaryKeys.summary(key(prevFrom), key(prevTo), granularity),
    queryFn: () => getExpensesSummary({ from: prevFrom, to: prevTo, granularity }),
    staleTime: EXPENSE_STALE_TIME,
  })
  const incPrevQ = useQuery({
    queryKey: incomeSummaryKeys.summary(key(prevFrom), key(prevTo), granularity),
    queryFn: () => getIncomesSummary({ from: prevFrom, to: prevTo, granularity }),
    staleTime: INCOME_STALE_TIME,
  })

  const derived = useMemo(
    () => ({
      metrics: computeMetricsFromSummaries(
        expCurQ.data,
        incCurQ.data,
        expPrevQ.data,
        incPrevQ.data,
      ),
      series: buildSeries(expCurQ.data, incCurQ.data, locale),
    }),
    [expCurQ.data, incCurQ.data, expPrevQ.data, incPrevQ.data, locale],
  )

  return {
    ...derived,
    range,
    // user's base currency — for formatting KPIs
    baseCurrency: expCurQ.data?.baseCurrency ?? incCurQ.data?.baseCurrency,
    isLoading: expCurQ.isLoading || incCurQ.isLoading || expPrevQ.isLoading || incPrevQ.isLoading,
    isError: expCurQ.isError || incCurQ.isError || expPrevQ.isError || incPrevQ.isError,
  }
}
