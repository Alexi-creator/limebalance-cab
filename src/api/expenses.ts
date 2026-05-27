import { request } from "@api/request"
import { expenseSchema, expensesSummarySchema } from "@appTypes/expense"
import { API_URLS } from "@constants/apiUrls"
import { format } from "date-fns"
import { z } from "zod"

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
