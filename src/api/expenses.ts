import { request } from "@api/request"
import { categorySchema } from "@appTypes/category"
import { createdExpenseSchema, expenseSchema, expensesSummarySchema } from "@appTypes/expense"
import { API_URLS } from "@constants/apiUrls"
import { HttpMethods } from "@constants/httpMethods"
import { format } from "date-fns"
import { z } from "zod"

export interface CreateExpensePayload {
  categoryId: string
  amount: number
  description: string
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

export function getExpensesSummary(months: 1 | 6 | 12) {
  return request(`${API_URLS.expenses.summary}?months=${months}`, { schema: expensesSummarySchema })
}

export function getExpenseCategories() {
  return request(API_URLS.expenseCategories.categories, { schema: z.array(categorySchema) })
}

export function createExpense(payload: CreateExpensePayload) {
  return request(API_URLS.expenses.expenses, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
    schema: createdExpenseSchema,
  })
}
