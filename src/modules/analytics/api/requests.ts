import { format } from "date-fns"
import { API_URLS } from "@/shared/api/apiUrls"
import { request } from "@/shared/api/request"
import {
  detailedStatSchema,
  expensesSummarySchema,
  incomesSummarySchema,
  type SummaryGranularity,
} from "../model"

/** Income/expense summary params: the interval `[from, to]` and bucket granularity. */
export interface SummaryParams {
  from: Date
  to: Date
  granularity: SummaryGranularity
  /** Only these categories; omitted — all of them. */
  categoryIds?: string[]
}

/** Summary query string (`from`/`to` in `YYYY-MM-DD`, `granularity`, repeated `categoryId`). */
export function summaryQuery({
  from,
  to,
  granularity,
  categoryIds,
}: SummaryParams): URLSearchParams {
  const query = new URLSearchParams({
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
    granularity,
  })
  for (const id of categoryIds ?? []) query.append("categoryId", id)
  return query
}

/** Query string for the detailed stat: the period `[from, to]`, both inclusive. */
export function detailedStatQuery(from: Date, to: Date): URLSearchParams {
  return new URLSearchParams({ from: format(from, "yyyy-MM-dd"), to: format(to, "yyyy-MM-dd") })
}

export function getExpensesSummary(params: SummaryParams) {
  return request(`${API_URLS.expenses.summary}?${summaryQuery(params)}`, {
    schema: expensesSummarySchema,
  })
}

export function getIncomesSummary(params: SummaryParams) {
  return request(`${API_URLS.incomes.summary}?${summaryQuery(params)}`, {
    schema: incomesSummarySchema,
  })
}

/**
 * Detailed expense stat for `[from, to]`: the overall total and per-category totals in the
 * base currency + the transaction details (each in its original currency).
 */
export function getExpensesStat(from: Date, to: Date) {
  return request(`${API_URLS.expenses.stat}?${detailedStatQuery(from, to)}`, {
    schema: detailedStatSchema,
  })
}

/**
 * Detailed income stat for `[from, to]`: the overall total and per-category totals in the
 * base currency + the transaction details (each in its original currency).
 */
export function getIncomesStat(from: Date, to: Date) {
  return request(`${API_URLS.incomes.stat}?${detailedStatQuery(from, to)}`, {
    schema: detailedStatSchema,
  })
}
