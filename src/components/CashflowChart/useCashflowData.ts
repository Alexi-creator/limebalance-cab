import { getExpenses, getExpensesSummary } from "@api/expenses"
import { getIncomes, getIncomesSummary } from "@api/incomes"
import { EXPENSE_STALE_TIME, expenseKeys } from "@constants/queries/expenses"
import { INCOME_STALE_TIME, incomeKeys } from "@constants/queries/incomes"
import { useQuery } from "@tanstack/react-query"
import { endOfMonth, format, startOfMonth } from "date-fns"

/**
 * Данные графика денежного потока: годовые сводки (для 6m/1y) и операции текущего
 * месяца (для 1m). Ключи общие с другими блоками главной — react-query дедуплицирует.
 */
export function useCashflowData() {
  const now = new Date()
  const from = startOfMonth(now)
  const to = endOfMonth(now)
  const currentMonth = format(from, "yyyy-MM")

  const { data: expensesSummary } = useQuery({
    queryKey: expenseKeys.summary(12),
    queryFn: () => getExpensesSummary(12),
    staleTime: EXPENSE_STALE_TIME,
  })

  const { data: incomesSummary } = useQuery({
    queryKey: incomeKeys.summary(12),
    queryFn: () => getIncomesSummary(12),
    staleTime: INCOME_STALE_TIME,
  })

  const { data: expenses } = useQuery({
    queryKey: expenseKeys.month(currentMonth),
    queryFn: () => getExpenses(from, to),
    staleTime: EXPENSE_STALE_TIME,
  })

  const { data: incomes } = useQuery({
    queryKey: incomeKeys.month(currentMonth),
    queryFn: () => getIncomes(from, to),
    staleTime: INCOME_STALE_TIME,
  })

  return { expensesSummary, incomesSummary, expenses, incomes }
}
