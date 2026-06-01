import { getExpenses, getExpensesSummary } from "@api/expenses"
import { getIncomes, getIncomesSummary } from "@api/incomes"
import { CashflowChart } from "@components/CashflowChart"
import { GoalsSnippet } from "@components/GoalsSnippet"
import { HomeHeader } from "@components/homePage/HomeHeader"
import { HomeKpis } from "@components/homePage/HomeKpis"
import { PortfolioSnippet } from "@components/PortfolioSnippet"
import { RecentTransactions } from "@components/RecentTransactions"
import { EXPENSE_STALE_TIME, expenseKeys } from "@constants/queries/expenses"
import { INCOME_STALE_TIME, incomeKeys } from "@constants/queries/incomes"
import { Grid, Stack } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { endOfMonth, format, startOfMonth } from "date-fns"

function getMonthRange() {
  const now = new Date()
  return { from: startOfMonth(now), to: endOfMonth(now) }
}

export function HomePage() {
  const { from, to } = getMonthRange()
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

  return (
    <Stack gap="md">
      <HomeHeader />

      <HomeKpis />

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
