import { request } from "@api/request"
import type { TransactionType } from "@appTypes/transaction"
import { transactionsResponseSchema } from "@appTypes/transaction"
import { API_URLS } from "@constants/apiUrls"
import { HttpMethods } from "@constants/httpMethods"

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

export interface UpdateTransactionPayload {
  amount?: number
  description?: string
  /** Код валюты (ISO 4217), напр. «USD». */
  currency?: string
  /** ISO-таймстамп локального времени пользователя. */
  date?: string
}

/** URL операции по типу: расход → /expenses/:id, доход → /incomes/:id. */
function transactionUrl(type: TransactionType, id: string) {
  const base = type === "expense" ? API_URLS.expenses.expenses : API_URLS.incomes.incomes
  return `${base}/${id}`
}

export function updateTransaction(
  type: TransactionType,
  id: string,
  payload: UpdateTransactionPayload,
) {
  return request(transactionUrl(type, id), {
    method: HttpMethods.PATCH,
    body: JSON.stringify(payload),
  })
}

export function deleteTransaction(type: TransactionType, id: string) {
  return request(transactionUrl(type, id), { method: HttpMethods.DELETE })
}
