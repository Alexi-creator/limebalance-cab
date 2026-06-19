import type { Transaction } from "@appTypes/transaction"
import { formatCurrency } from "@utils/formatCurrency"

/** Signed transaction amount: `+` for income, `−` for expense. */
export function formatTxAmount(transaction: Transaction, language: string): string {
  const sign = transaction.type === "income" ? "+" : "−"
  return `${sign}${formatCurrency(transaction.amount, language, transaction.currency)}`
}
