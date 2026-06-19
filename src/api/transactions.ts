import { request } from "@api/request"
import type { TransactionType } from "@appTypes/transaction"
import { balanceSchema, transactionsResponseSchema } from "@appTypes/transaction"
import { API_URLS } from "@constants/apiUrls"
import { HttpMethods } from "@constants/httpMethods"

/** User's total balance (base + USD), converted by exchange rates. */
export function getBalance() {
  return request(API_URLS.transactions.balance, { schema: balanceSchema })
}

export interface GetTransactionsParams {
  type?: "income" | "expense"
  categoryId?: string
  currency?: string
  search?: string
  from?: string
  to?: string
  page: number
  limit: number
}

/** Combined transactions list with pagination and filters. Empty filters are not sent in the query. */
export function getTransactions(params: GetTransactionsParams) {
  const qs = new URLSearchParams()
  if (params.type) qs.set("type", params.type)
  if (params.categoryId) qs.set("categoryId", params.categoryId)
  if (params.currency) qs.set("currency", params.currency)
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
  /** Currency code (ISO 4217), e.g. "USD". */
  currency?: string
  /** Transaction date in `YYYY-MM-DD` format (the backend stores it in @db.Date without time). */
  date?: string
}

/** Transaction URL by type: expense → /expenses/:id, income → /incomes/:id. */
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

export function deleteTransactionsBulk(type: TransactionType, ids: string[]) {
  const url = type === "expense" ? API_URLS.expenses.expenses : API_URLS.incomes.incomes
  return request(url, { method: HttpMethods.DELETE, body: JSON.stringify({ ids }) })
}
