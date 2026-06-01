import { request } from "@api/request"
import { transactionsResponseSchema } from "@appTypes/transaction"
import { API_URLS } from "@constants/apiUrls"

export interface GetTransactionsParams {
  type?: "income" | "expense"
  categoryId?: string
  search?: string
  from?: string
  to?: string
  page: number
  limit: number
}

/** Объединённый список операций с пагинацией и фильтрами. Пустые фильтры в query не уходят. */
export function getTransactions(params: GetTransactionsParams) {
  const qs = new URLSearchParams()
  if (params.type) qs.set("type", params.type)
  if (params.categoryId) qs.set("categoryId", params.categoryId)
  if (params.search) qs.set("search", params.search)
  if (params.from) qs.set("from", params.from)
  if (params.to) qs.set("to", params.to)
  qs.set("page", String(params.page))
  qs.set("limit", String(params.limit))

  return request(`${API_URLS.transactions.transactions}?${qs}`, {
    schema: transactionsResponseSchema,
  })
}
