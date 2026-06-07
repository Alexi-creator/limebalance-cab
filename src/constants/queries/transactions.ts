import type { GetTransactionsParams } from "@api/transactions"

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (params: GetTransactionsParams) => ["transactions", "list", params] as const,
  recent: (limit: number) => ["transactions", "recent", limit] as const,
  balance: ["transactions", "balance"] as const,
}

export const TRANSACTIONS_STALE_TIME = 5 * 60 * 1000
