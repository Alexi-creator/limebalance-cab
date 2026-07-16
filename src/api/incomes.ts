import { detailedStatQuery, type SummaryParams, statsQuery, summaryQuery } from "@api/expenses"
import { request } from "@api/request"
import { type CategoryPayload, categorySchema, categoryStatsSchema } from "@appTypes/category"
import { createdIncomeSchema, incomeSchema, incomesSummarySchema } from "@appTypes/income"
import { detailedStatSchema } from "@appTypes/stat"
import { API_URLS } from "@constants/apiUrls"
import { HttpMethods } from "@constants/httpMethods"
import { format } from "date-fns"
import { z } from "zod"

export interface CreateIncomePayload {
  categoryId: string
  amount: number
  description: string
  /** Currency code (ISO 4217), e.g. "USD". */
  currency: string
  /** ISO timestamp; if omitted — the backend sets the current moment. */
  date?: string
}

export function getIncomes(from?: Date, to?: Date) {
  const params = new URLSearchParams()
  if (from) params.set("from", format(from, "yyyy-MM-dd"))
  if (to) params.set("to", format(to, "yyyy-MM-dd"))

  const query = params.size ? `?${params}` : ""
  return request(`${API_URLS.incomes.incomes}${query}`, { schema: z.array(incomeSchema) })
}

export function getIncomesSummary(params: SummaryParams) {
  return request(`${API_URLS.incomes.summary}?${summaryQuery(params)}`, {
    schema: incomesSummarySchema,
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

export function getIncomeCategories() {
  return request(API_URLS.incomeCategories.categories, { schema: z.array(categorySchema) })
}

/**
 * Income categories with totals and transaction counts; optionally for the period `[from, to]`.
 * If `compareFrom`/`compareTo` are passed, each category will include
 * `previousApproxTotal`/`deltaApproxTotal` — comparison with the previous period.
 */
export function getIncomeCategoriesStats(
  from?: Date,
  to?: Date,
  compareFrom?: Date,
  compareTo?: Date,
) {
  const params = statsQuery(from, to, compareFrom, compareTo)
  const query = params.size ? `?${params}` : ""
  return request(`${API_URLS.incomeCategories.stats}${query}`, {
    schema: z.array(categoryStatsSchema),
  })
}

export function createIncomeCategory(payload: CategoryPayload) {
  return request(API_URLS.incomeCategories.categories, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
    schema: categorySchema,
  })
}

export function updateIncomeCategory(id: string, payload: CategoryPayload) {
  return request(`${API_URLS.incomeCategories.categories}/${id}`, {
    method: HttpMethods.PATCH,
    body: JSON.stringify(payload),
    schema: categorySchema,
  })
}

export function deleteIncomeCategory(id: string) {
  return request(`${API_URLS.incomeCategories.categories}/${id}`, {
    method: HttpMethods.DELETE,
  })
}

export function createIncome(payload: CreateIncomePayload) {
  return request(API_URLS.incomes.incomes, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
    schema: createdIncomeSchema,
  })
}
