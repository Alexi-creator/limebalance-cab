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

/** Параметры сводки доход/расход: интервал `[from, to]` и гранулярность бакетов. */
export interface SummaryParams {
  from: Date
  to: Date
  granularity: SummaryGranularity
}

/** Query-строка сводки (`from`/`to` в `YYYY-MM-DD`, `granularity`). */
export function summaryQuery({ from, to, granularity }: SummaryParams): URLSearchParams {
  return new URLSearchParams({
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
    granularity,
  })
}

/** Query-строка для статистики категорий: период `[from, to]` + опц. прошлый период. */
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
  /** Код валюты (ISO 4217), напр. «USD». */
  currency: string
  /** ISO-таймстамп; если не передан — бэкенд проставит текущий момент. */
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
 * Категории расходов с суммой и числом операций; опционально за период `[from, to]`.
 * Если переданы `compareFrom`/`compareTo`, в каждой категории появятся
 * `previousApproxTotal`/`deltaApproxTotal` — сравнение с прошлым периодом.
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
