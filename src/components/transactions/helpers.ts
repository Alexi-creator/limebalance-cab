import type { Transaction } from "@appTypes/transaction"
import { formatCurrency } from "@utils/formatCurrency"

/** Сумма операции со знаком: `+` для дохода, `−` для расхода. */
export function formatTxAmount(transaction: Transaction, language: string): string {
  const sign = transaction.type === "income" ? "+" : "−"
  return `${sign}${formatCurrency(transaction.amount, language)}`
}
