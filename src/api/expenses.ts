import { request } from "@api/request"
import { type CategoryPayload, categorySchema, categoryStatsSchema } from "@appTypes/category"
import {
  createdExpenseSchema,
  expenseSchema,
  expensesSummarySchema,
  type SummaryGranularity,
} from "@appTypes/expense"
import { API_URLS } from "@constants/apiUrls"
import { HttpMethods } from "@constants/httpMethods"
import { format } from "date-fns"
import { z } from "zod"

/** Income/expense summary params: the interval `[from, to]` and bucket granularity. */
export interface SummaryParams {
  from: Date
  to: Date
  granularity: SummaryGranularity
}

/** Summary query string (`from`/`to` in `YYYY-MM-DD`, `granularity`). */
export function summaryQuery({ from, to, granularity }: SummaryParams): URLSearchParams {
  return new URLSearchParams({
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
    granularity,
  })
}

/** Query string for category stats: the period `[from, to]` + optional previous period. */
export function statsQuery(
  from?: Date,
  to?: Date,
  compareFrom?: Date,
  compareTo?: Date,
): URLSearchParams {
  const params = new URLSearchParams()
  if (from) params.set("from", format(from, "yyyy-MM-dd"))
  if (to) params.set("to", format(to, "yyyy-MM-dd"))
  if (compareFrom) params.set("compareFrom", format(compareFrom, "yyyy-MM-dd"))
  if (compareTo) params.set("compareTo", format(compareTo, "yyyy-MM-dd"))
  return params
}

export interface CreateExpensePayload {
  categoryId: string
  amount: number
  description: string
  /** Currency code (ISO 4217), e.g. "USD". */
  currency: string
  /** ISO timestamp; if omitted — the backend sets the current moment. */
  date?: string
}

export function getExpenses(from?: Date, to?: Date) {
  const params = new URLSearchParams()
  if (from) params.set("from", format(from, "yyyy-MM-dd"))
  if (to) params.set("to", format(to, "yyyy-MM-dd"))

  const query = params.size ? `?${params}` : ""
  return request(`${API_URLS.expenses.expenses}${query}`, { schema: z.array(expenseSchema) })
}

export function getExpensesSummary(params: SummaryParams) {
  return request(`${API_URLS.expenses.summary}?${summaryQuery(params)}`, {
    schema: expensesSummarySchema,
  })
}

export function getExpenseCategories() {
  return request(API_URLS.expenseCategories.categories, { schema: z.array(categorySchema) })
}

/**
 * Expense categories with totals and transaction counts; optionally for the period `[from, to]`.
 * If `compareFrom`/`compareTo` are passed, each category will include
 * `previousApproxTotal`/`deltaApproxTotal` — comparison with the previous period.
 */
export function getExpenseCategoriesStats(
  from?: Date,
  to?: Date,
  compareFrom?: Date,
  compareTo?: Date,
) {
  const params = statsQuery(from, to, compareFrom, compareTo)
  const query = params.size ? `?${params}` : ""
  return request(`${API_URLS.expenseCategories.stats}${query}`, {
    schema: z.array(categoryStatsSchema),
  })
}

export function createExpenseCategory(payload: CategoryPayload) {
  return request(API_URLS.expenseCategories.categories, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
    schema: categorySchema,
  })
}

export function updateExpenseCategory(id: string, payload: CategoryPayload) {
  return request(`${API_URLS.expenseCategories.categories}/${id}`, {
    method: HttpMethods.PATCH,
    body: JSON.stringify(payload),
    schema: categorySchema,
  })
}

export function deleteExpenseCategory(id: string) {
  return request(`${API_URLS.expenseCategories.categories}/${id}`, {
    method: HttpMethods.DELETE,
  })
}

export function createExpense(payload: CreateExpensePayload) {
  return request(API_URLS.expenses.expenses, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
    schema: createdExpenseSchema,
  })
}
