import { getExpensesSummary, type SummaryParams } from "@api/expenses"
import { getIncomesSummary } from "@api/incomes"
import type { SummaryGranularity } from "@appTypes/expense"
import { EXPENSE_STALE_TIME, expenseKeys } from "@constants/queries/expenses"
import { INCOME_STALE_TIME, incomeKeys } from "@constants/queries/incomes"
import { useQuery } from "@tanstack/react-query"
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns"

/** Интервал и гранулярность сводки под выбранный период графика. */
function periodToParams(period: string): SummaryParams {
  const now = new Date()
  if (period === "1m") {
    // весь текущий месяц по дням: будущие дни бэк вернёт пустыми (рисуем 0)
    return { from: startOfMonth(now), to: endOfMonth(now), granularity: "day" }
  }
  // 6m / 1y — помесячно за последние N месяцев включая текущий
  const count = period === "1y" ? 12 : 6
  return { from: startOfMonth(subMonths(now, count - 1)), to: now, granularity: "month" }
}

/**
 * Данные графика денежного потока за выбранный период из сводок `/summary`
 * (уже в базовой валюте). 1m — по дням, 6m/1y — по месяцам. Ключи запросов общие
 * с другими блоками главной (та же гранулярность) — react-query дедуплицирует.
 */
export function useCashflowData(period: string) {
  const params = periodToParams(period)
  const fromKey = format(params.from, "yyyy-MM-dd")
  const toKey = format(params.to, "yyyy-MM-dd")
  const granularity: SummaryGranularity = params.granularity

  const { data: expensesSummary } = useQuery({
    queryKey: expenseKeys.summary(fromKey, toKey, granularity),
    queryFn: () => getExpensesSummary(params),
    staleTime: EXPENSE_STALE_TIME,
  })

  const { data: incomesSummary } = useQuery({
    queryKey: incomeKeys.summary(fromKey, toKey, granularity),
    queryFn: () => getIncomesSummary(params),
    staleTime: INCOME_STALE_TIME,
  })

  return { expensesSummary, incomesSummary }
}
