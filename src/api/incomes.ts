import { request } from "@api/request"
import { incomeSchema, incomesSummarySchema } from "@appTypes/income"
import { API_URLS } from "@constants/apiUrls"
import { format } from "date-fns"
import { z } from "zod"

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
