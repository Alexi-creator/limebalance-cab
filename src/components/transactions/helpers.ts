import type { Transaction } from "@appTypes/transaction"
import { formatCurrency } from "@utils/formatCurrency"

/** Сумма операции со знаком: `+` для дохода, `−` для расхода. */
export function formatTxAmount(transaction: Transaction, language: string): string {
  const sign = transaction.type === "income" ? "+" : "−"
  return `${sign}${formatCurrency(transaction.amount, language, transaction.currency)}`
}

/** Нетто по набору операций: сумма доходов минус сумма расходов. */
export function getNetTotal(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0)
}
