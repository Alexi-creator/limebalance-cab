import { getExpenses, getExpensesSummary } from "@api/expenses"
import { getIncomes, getIncomesSummary } from "@api/incomes"
import { CashflowChart } from "@components/CashflowChart"
import { GoalsSnippet } from "@components/GoalsSnippet"
import { HomeHeader } from "@components/homePage/HomeHeader"
import { HomeKpis, type Kpi } from "@components/homePage/HomeKpis"
import { PortfolioSnippet } from "@components/PortfolioSnippet"
import { RecentTransactions } from "@components/RecentTransactions"
import { EXPENSE_STALE_TIME, expenseKeys } from "@constants/queries/expenses"
import { INCOME_STALE_TIME, incomeKeys } from "@constants/queries/incomes"
import { Grid, Stack } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { formatCurrency } from "@utils/formatCurrency"
import { endOfMonth, format, startOfMonth } from "date-fns"
import { useTranslation } from "react-i18next"

function getMonthRange() {
  const now = new Date()
  return { from: startOfMonth(now), to: endOfMonth(now) }
}

export function HomePage() {
  const { i18n } = useTranslation()
  const { from, to } = getMonthRange()
  const currentMonth = format(from, "yyyy-MM")

  const {
    data: expensesSummary,
    isLoading: expensesLoading,
    isFetching: expensesFetching,
    refetch: refetchExpenses,
  } = useQuery({
    queryKey: expenseKeys.summary(12),
    queryFn: () => getExpensesSummary(12),
    staleTime: EXPENSE_STALE_TIME,
  })

  const {
    data: incomesSummary,
    isLoading: incomesLoading,
    isFetching: incomesFetching,
    refetch: refetchIncomes,
  } = useQuery({
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

  const currentMonthExpenses = expensesSummary?.byMonth.find((m) => m.month === currentMonth)
  const currentMonthIncomes = incomesSummary?.byMonth.find((m) => m.month === currentMonth)
  const totalExpenses = currentMonthExpenses ? parseFloat(currentMonthExpenses.total) : 0
  const totalIncomes = currentMonthIncomes ? parseFloat(currentMonthIncomes.total) : 0

  const kpis: Kpi[] = [
    {
      key: "balance",
      label: "Текущий баланс",
      value: "284 540 ₽",
      sub: "по всем счетам",
      trend: 12.4,
      accent: "var(--mantine-color-lime-4)",
    },
    {
      key: "income",
      label: "Доход за месяц",
      value: incomesLoading ? "—" : formatCurrency(totalIncomes, i18n.language),
      sub: currentMonthIncomes ? "за текущий месяц" : "нет данных",
      trend: 8.2,
      loading: incomesLoading,
      onRefresh: refetchIncomes,
      isRefreshing: incomesFetching,
    },
    {
      key: "expense",
      label: "Расход за месяц",
      value: expensesLoading ? "—" : formatCurrency(-totalExpenses, i18n.language),
      sub: currentMonthExpenses ? "за текущий месяц" : "нет данных",
      trend: -3.7,
      loading: expensesLoading,
      onRefresh: refetchExpenses,
      isRefreshing: expensesFetching,
    },
    {
      key: "saved",
      label: "Накоплено в мае",
      value: "+90 480 ₽",
      sub: "лучший месяц в году",
      trend: 28.5,
    },
  ]

  return (
    <Stack gap="md">
      <HomeHeader />

      <HomeKpis kpis={kpis} />

      <Grid gap="md">
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <CashflowChart
            expensesSummary={expensesSummary}
            incomesSummary={incomesSummary}
            expenses={expenses}
            incomes={incomes}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Stack gap="md">
            <GoalsSnippet />
            <PortfolioSnippet />
          </Stack>
        </Grid.Col>
      </Grid>

      <RecentTransactions />
    </Stack>
  )
}
