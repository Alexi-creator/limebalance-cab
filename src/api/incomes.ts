import { request } from "@api/request"
import type { Income } from "@appTypes/expense"
import { API_URLS } from "@constants/apiUrls"
import { format } from "date-fns"

export function getIncomes(from?: Date, to?: Date): Promise<Income[]> {
  const params = new URLSearchParams()
  if (from) params.set("from", format(from, "yyyy-MM-dd"))
  if (to) params.set("to", format(to, "yyyy-MM-dd"))

  const query = params.size ? `?${params}` : ""
  return request<Income[]>(`${API_URLS.incomes.incomes}${query}`)
}
