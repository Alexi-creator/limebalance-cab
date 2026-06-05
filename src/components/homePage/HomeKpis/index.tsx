import { getExpensesSummary } from "@api/expenses"
import { getIncomesSummary } from "@api/incomes"
import { EXPENSE_STALE_TIME, expenseKeys } from "@constants/queries/expenses"
import { INCOME_STALE_TIME, incomeKeys } from "@constants/queries/incomes"
import { SimpleGrid, Skeleton } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { KpiCard } from "@ui/KpiCard"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"
import { buildKpis } from "./helpers"

/**
 * Ряд KPI-карточек главной страницы. Сам тянет сводки доход/расход (дедуплицируются
 * с запросами графика по тем же ключам) и строит карточки через `buildKpis`.
 */
export function HomeKpis() {
  const { i18n } = useTranslation()
  const currentMonth = format(new Date(), "yyyy-MM")

  const expensesQuery = useQuery({
    queryKey: expenseKeys.summary(12),
    queryFn: () => getExpensesSummary(12),
    staleTime: EXPENSE_STALE_TIME,
  })

  const incomesQuery = useQuery({
    queryKey: incomeKeys.summary(12),
    queryFn: () => getIncomesSummary(12),
    staleTime: INCOME_STALE_TIME,
  })

  const expenseMonth = expensesQuery.data?.byMonth.find((m) => m.month === currentMonth)
  const incomeMonth = incomesQuery.data?.byMonth.find((m) => m.month === currentMonth)

  // базовая валюта пользователя — в ней приходят approxTotal/total сводки
  const baseCurrency = incomesQuery.data?.baseCurrency ?? expensesQuery.data?.baseCurrency

  const kpis = buildKpis({
    language: i18n.language,
    baseCurrency,
    income: {
      total: incomeMonth?.approxTotal ?? 0,
      hasData: (incomeMonth?.totals.length ?? 0) > 0,
      loading: incomesQuery.isLoading,
      isFetching: incomesQuery.isFetching,
      refetch: incomesQuery.refetch,
    },
    expense: {
      total: expenseMonth?.approxTotal ?? 0,
      hasData: (expenseMonth?.totals.length ?? 0) > 0,
      loading: expensesQuery.isLoading,
      isFetching: expensesQuery.isFetching,
      refetch: expensesQuery.refetch,
    },
  })

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
      {kpis.map(({ key, loading, ...card }) => (
        <Skeleton key={key} visible={loading ?? false} radius="md">
          <KpiCard {...card} />
        </Skeleton>
      ))}
    </SimpleGrid>
  )
}
