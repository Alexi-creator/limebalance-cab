import { request } from "@api/request"
import { categorySchema } from "@appTypes/category"
import { createdIncomeSchema, incomeSchema, incomesSummarySchema } from "@appTypes/income"
import { API_URLS } from "@constants/apiUrls"
import { HttpMethods } from "@constants/httpMethods"
import { format } from "date-fns"
import { z } from "zod"

export interface CreateIncomePayload {
  categoryId: string
  amount: number
  description: string
  /** ISO-таймстамп; если не передан — бэкенд проставит текущий момент. */
  date?: string
}

export function getIncomes(from?: Date, to?: Date) {
  const params = new URLSearchParams()
  if (from) params.set("from", format(from, "yyyy-MM-dd"))
  if (to) params.set("to", format(to, "yyyy-MM-dd"))

  const query = params.size ? `?${params}` : ""
  return request(`${API_URLS.incomes.incomes}${query}`, { schema: z.array(incomeSchema) })
}

export function getIncomesSummary(months: 1 | 6 | 12) {
  return request(`${API_URLS.incomes.summary}?months=${months}`, { schema: incomesSummarySchema })
}

export function getIncomeCategories() {
  return request(API_URLS.incomeCategories.categories, { schema: z.array(categorySchema) })
}

export function createIncome(payload: CreateIncomePayload) {
  return request(API_URLS.incomes.incomes, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
    schema: createdIncomeSchema,
  })
}
