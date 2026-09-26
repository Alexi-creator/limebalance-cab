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
  analyticsRange,
  buildSeries,
  computeMetricsFromSummaries,
  rangeGranularity,
} from "../lib/helpers"

const key = (d: Date) => format(d, "yyyy-MM-dd")

/**
 * Analytics page data. KPIs and the time series come from the `/summary` summaries (current and
 * previous period, base currency). The category breakdown (donut, details, comparison with
 * the previous period) lives in `useCategoryBreakdown`. Query keys are shared — react-query
 * deduplicates.
 *
 * `from`/`to` (`YYYY-MM-DD`, both inclusive) — the resolved dates of the chosen period; `period`
 * picks what they are compared with (see `analyticsRange`). Granularity follows the range length.
 */
export function useAnalyticsData(
  period: AnalyticsPeriod,
  rangeFrom: string,
  rangeTo: string,
  locale: Locale = enUS,
) {
  const range = useMemo(
    () => analyticsRange(period, parseISO(rangeFrom), parseISO(rangeTo)),
    [period, rangeFrom, rangeTo],
  )
  const { from, to, prevFrom, prevTo } = range
  const granularity = rangeGranularity(from, to)

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
