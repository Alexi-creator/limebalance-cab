import { request } from "@api/request"
import type { Expense } from "@appTypes/expense"
import { API_URLS } from "@constants/apiUrls"
import { format } from "date-fns"

export function getExpenses(from?: Date, to?: Date): Promise<Expense[]> {
  const params = new URLSearchParams()
  if (from) params.set("from", format(from, "yyyy-MM-dd"))
  if (to) params.set("to", format(to, "yyyy-MM-dd"))

  const query = params.size ? `?${params}` : ""
  return request<Expense[]>(`${API_URLS.expenses.expenses}${query}`)
}
