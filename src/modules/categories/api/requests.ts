import { format } from "date-fns"
import { z } from "zod"
import { API_URLS } from "@/shared/api/apiUrls"
import { HttpMethods } from "@/shared/api/httpMethods"
import { request } from "@/shared/api/request"
import { type CategoryPayload, categorySchema, categoryStatsSchema } from "../model"

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

const mergeResultSchema = z.object({ moved: z.coerce.number(), target: categorySchema })

/**
 * Moves every transaction of `sourceId` into `targetId` (same kind) and deletes `sourceId`.
 * The backend also repoints saved filter presets that referenced the source.
 */
export function mergeCategory(isExpense: boolean, sourceId: string, targetId: string) {
  const base = isExpense ? API_URLS.expenseCategories : API_URLS.incomeCategories
  return request(`${base.categories}/${sourceId}/merge`, {
    method: HttpMethods.POST,
    body: JSON.stringify({ targetId }),
    schema: mergeResultSchema,
  })
}
