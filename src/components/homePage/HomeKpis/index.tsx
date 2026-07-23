import { getExpensesSummary } from "@api/expenses"
import { getIncomesSummary } from "@api/incomes"
import { getBalance } from "@api/transactions"
import { EXPENSE_STALE_TIME, expenseKeys } from "@constants/queries/expenses"
import { INCOME_STALE_TIME, incomeKeys } from "@constants/queries/incomes"
import { TRANSACTIONS_STALE_TIME, transactionKeys } from "@constants/queries/transactions"
import { SimpleGrid, Skeleton } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { KpiCard } from "@ui/KpiCard"
import { endOfMonth, format, startOfMonth } from "date-fns"
import { useTranslation } from "react-i18next"
import { buildKpis } from "./helpers"

/**
 * Row of KPI cards on the home page. Fetches the total balance (/transactions/balance) and
 * income/expense summaries for the current month (granularity=day — deduplicated with the chart
 * by the same keys), then builds the cards via `buildKpis`.
 */
export function HomeKpis() {
  const { t, i18n } = useTranslation()
  const now = new Date()
  const from = startOfMonth(now)
  // whole month (to=end of month) — shared key/range with the chart; future days are empty
  const to = endOfMonth(now)
  const fromKey = format(from, "yyyy-MM-dd")
  const toKey = format(to, "yyyy-MM-dd")
  const summaryParams = { from, to, granularity: "day" as const }

  const balanceQuery = useQuery({
    queryKey: transactionKeys.balance,
    queryFn: getBalance,
    staleTime: TRANSACTIONS_STALE_TIME,
  })

  const expensesQuery = useQuery({
    queryKey: expenseKeys.summary(fromKey, toKey, "day"),
    queryFn: () => getExpensesSummary(summaryParams),
    staleTime: EXPENSE_STALE_TIME,
  })

  const incomesQuery = useQuery({
    queryKey: incomeKeys.summary(fromKey, toKey, "day"),
    queryFn: () => getIncomesSummary(summaryParams),
    staleTime: INCOME_STALE_TIME,
  })

  // whether there is at least one transaction in the period (for the "no data" caption)
  const incomeHasData = (incomesQuery.data?.buckets ?? []).some((b) => b.totals.length > 0)
  const expenseHasData = (expensesQuery.data?.buckets ?? []).some((b) => b.totals.length > 0)

  // user's base currency — the summary approxTotal/total come in it
  const baseCurrency = incomesQuery.data?.baseCurrency ?? expensesQuery.data?.baseCurrency

  const kpis = buildKpis({
    t,
    language: i18n.language,
    baseCurrency,
    balance: {
      total: balanceQuery.data?.balance ?? null,
      usd: balanceQuery.data?.balanceUsd ?? null,
      baseCurrency: balanceQuery.data?.baseCurrency,
      loading: balanceQuery.isLoading,
    },
    income: {
      total: incomesQuery.data?.total ?? 0,
      hasData: incomeHasData,
      loading: incomesQuery.isLoading,
      isFetching: incomesQuery.isFetching,
      refetch: incomesQuery.refetch,
    },
    expense: {
      total: expensesQuery.data?.total ?? 0,
      hasData: expenseHasData,
      loading: expensesQuery.isLoading,
      isFetching: expensesQuery.isFetching,
      refetch: expensesQuery.refetch,
    },
  })

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" data-tour="kpis">
      {kpis.map(({ key, loading, ...card }) => (
        <Skeleton key={key} visible={loading ?? false} radius="md">
          <KpiCard {...card} />
        </Skeleton>
      ))}
    </SimpleGrid>
  )
}
