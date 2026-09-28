import { useQuery } from "@tanstack/react-query"
import type { Locale } from "date-fns"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import type { StatKind } from "../hooks/useCategoryBreakdown"
import { type AnalyticsRange, buildSeries, rangeGranularity } from "../lib/helpers"
import type { ExpensesSummary, IncomesSummary } from "../model"
import {
  EXPENSE_STALE_TIME,
  expenseSummaryKeys,
  INCOME_STALE_TIME,
  incomeSummaryKeys,
} from "./queries"
import { getExpensesSummary, getIncomesSummary } from "./requests"

const key = (d: Date) => format(d, "yyyy-MM-dd")

/**
 * The time series of one kind (expenses or incomes) narrowed to the analytics category filter —
 * `/summary?categoryId=…`, same buckets as the unfiltered chart. Null while nothing is picked:
 * the chart then shows both kinds from `useAnalyticsData`.
 */
export function useCategorySeries(
  { from, to }: AnalyticsRange,
  kind: StatKind,
  categoryIds: string[],
  locale: Locale = enUS,
) {
  const granularity = rangeGranularity(from, to)
  const isExpense = kind === "expense"
  const enabled = categoryIds.length > 0
  const params = { from, to, granularity, categoryIds }

  const { data, isFetching } = useQuery({
    queryKey: isExpense
      ? expenseSummaryKeys.summaryByCategories(key(from), key(to), granularity, categoryIds)
      : incomeSummaryKeys.summaryByCategories(key(from), key(to), granularity, categoryIds),
    queryFn: (): Promise<ExpensesSummary | IncomesSummary> =>
      isExpense ? getExpensesSummary(params) : getIncomesSummary(params),
    staleTime: isExpense ? EXPENSE_STALE_TIME : INCOME_STALE_TIME,
    enabled,
    // switching the picked categories keeps the previous bars until the new ones arrive
    placeholderData: (prev) => prev,
  })

  const series =
    enabled && data
      ? isExpense
        ? buildSeries(data as ExpensesSummary, undefined, locale)
        : buildSeries(undefined, data as IncomesSummary, locale)
      : null
  return { series, isFetching: enabled && isFetching }
}
