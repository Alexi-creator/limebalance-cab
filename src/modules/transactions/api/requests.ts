import { format } from "date-fns"
import { z } from "zod"
import { API_URLS } from "@/shared/api/apiUrls"
import { HttpMethods } from "@/shared/api/httpMethods"
import { request } from "@/shared/api/request"
import type { SortDir } from "@/shared/ui/SortableTh"
import type { TransactionSortField } from "../config"
import type { TransactionType } from "../model"
import {
  balanceSchema,
  createdExpenseSchema,
  createdIncomeSchema,
  expenseSchema,
  incomeSchema,
  transactionsResponseSchema,
} from "../model"

/** User's total balance (base + USD), converted by exchange rates. */
export function getBalance() {
  return request(API_URLS.transactions.balance, { schema: balanceSchema })
}

export interface GetTransactionsParams {
  type?: "income" | "expense"
  categoryId?: string[]
  currency?: string[]
  search?: string
  from?: string
  to?: string
  /** Omitted → date, newest first (server default). */
  sortBy?: TransactionSortField
  sortDir?: SortDir
  page: number
  limit: number
}

/** Combined transactions list with pagination and filters. Empty filters are not sent in the query. */
export function getTransactions(params: GetTransactionsParams) {
  const qs = new URLSearchParams()
  if (params.type) qs.set("type", params.type)
  // one repeated param per value: ?categoryId=a&categoryId=b, ?currency=USD&currency=EUR
  if (params.categoryId) for (const id of params.categoryId) qs.append("categoryId", id)
  if (params.currency) for (const c of params.currency) qs.append("currency", c)
  if (params.search) qs.set("search", params.search)
  if (params.from) qs.set("from", params.from)
  if (params.to) qs.set("to", params.to)
  if (params.sortBy) qs.set("sortBy", params.sortBy)
  if (params.sortDir) qs.set("sortDir", params.sortDir)
  qs.set("page", String(params.page))
  qs.set("limit", String(params.limit))

  return request(`${API_URLS.transactions.transactions}?${qs}`, {
    schema: transactionsResponseSchema,
  })
}

export interface UpdateTransactionPayload {
  amount?: number
  description?: string
  categoryId?: string
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

export interface CreateExpensePayload {
  categoryId: string
  amount: number
  description: string
  /** Currency code (ISO 4217), e.g. "USD". */
  currency: string
  /** ISO timestamp; if omitted — the backend sets the current moment. */
  date?: string
}

export interface CreateIncomePayload {
  categoryId: string
  amount: number
  description: string
  /** Currency code (ISO 4217), e.g. "USD". */
  currency: string
  /** ISO timestamp; if omitted — the backend sets the current moment. */
  date?: string
}

export function getExpenses(from?: Date, to?: Date) {
  const params = new URLSearchParams()
  if (from) params.set("from", format(from, "yyyy-MM-dd"))
  if (to) params.set("to", format(to, "yyyy-MM-dd"))

  const query = params.size ? `?${params}` : ""
  return request(`${API_URLS.expenses.expenses}${query}`, { schema: z.array(expenseSchema) })
}

export function getIncomes(from?: Date, to?: Date) {
  const params = new URLSearchParams()
  if (from) params.set("from", format(from, "yyyy-MM-dd"))
  if (to) params.set("to", format(to, "yyyy-MM-dd"))

  const query = params.size ? `?${params}` : ""
  return request(`${API_URLS.incomes.incomes}${query}`, { schema: z.array(incomeSchema) })
}

export function createExpense(payload: CreateExpensePayload) {
  return request(API_URLS.expenses.expenses, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
    schema: createdExpenseSchema,
  })
}

export function createIncome(payload: CreateIncomePayload) {
  return request(API_URLS.incomes.incomes, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
    schema: createdIncomeSchema,
  })
}
