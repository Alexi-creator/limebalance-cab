import { getExpenses } from "@api/expenses"
import { getIncomes } from "@api/incomes"
import { CashflowChart } from "@components/CashflowChart"
import { GoalsSnippet } from "@components/GoalsSnippet"
import { KpiCard } from "@components/KpiCard"
import { PortfolioSnippet } from "@components/PortfolioSnippet"
import { RecentTransactions } from "@components/RecentTransactions"
import { useAdd } from "@components/AddModal"
import { Button, Grid, Group, SimpleGrid, Skeleton, Stack, Text, Title } from "@mantine/core"
import { IconDownload, IconPlus } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { formatCurrency } from "@utils/formatCurrency"
import { endOfMonth, format, startOfMonth } from "date-fns"
import { useTranslation } from "react-i18next"

function getMonthRange() {
  const now = new Date()
  return { from: startOfMonth(now), to: endOfMonth(now) }
}

export function HomePage() {
  const { open } = useAdd()
  const { i18n } = useTranslation()
  const { from, to } = getMonthRange()

  const {
    data: expenses,
    isLoading: expensesLoading,
    isFetching: expensesFetching,
    refetch: refetchExpenses,
  } = useQuery({
    queryKey: ["expenses", "month", format(from, "yyyy-MM")],
    queryFn: () => getExpenses(from, to),
    staleTime: 1 * 60 * 60 * 1000,
  })

  const {
    data: incomes,
    isLoading: incomesLoading,
    isFetching: incomesFetching,
    refetch: refetchIncomes,
  } = useQuery({
    queryKey: ["incomes", "month", format(from, "yyyy-MM")],
    queryFn: () => getIncomes(from, to),
    staleTime: 1 * 60 * 60 * 1000,
  })

  const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0
  const totalIncomes = incomes?.reduce((sum, i) => sum + i.amount, 0) ?? 0

  const formattedExpenses = expensesLoading ? "—" : formatCurrency(-totalExpenses, i18n.language)
  const formattedIncomes = incomesLoading ? "—" : formatCurrency(totalIncomes, i18n.language)

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={4}>
          <Title order={2} size="h3">
            Привет 👋
          </Title>
          <Text size="sm" c="dimmed">
            Ваши финансы за этот месяц
          </Text>
        </Stack>
        <Group gap="xs">
          <Button variant="default" size="sm" leftSection={<IconDownload size={14} />}>
            Экспорт
          </Button>
          <Button size="sm" leftSection={<IconPlus size={14} />} onClick={() => open("transaction", { lockType: true })}>
            Новая операция
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <KpiCard
          label="Текущий баланс"
          value="284 540 ₽"
          sub="по всем счетам"
          trend={12.4}
          accent="var(--mantine-color-lime-4)"
        />
        <Skeleton visible={incomesLoading} radius="md">
          <KpiCard
            label="Доход за месяц"
            value={formattedIncomes}
            sub={`${incomes?.length ?? 0} операций`}
            trend={8.2}
            onRefresh={refetchIncomes}
            isRefreshing={incomesFetching}
          />
        </Skeleton>
        <Skeleton visible={expensesLoading} radius="md">
          <KpiCard
            label="Расход за месяц"
            value={formattedExpenses}
            sub={`${expenses?.length ?? 0} операций`}
            trend={-3.7}
            onRefresh={refetchExpenses}
            isRefreshing={expensesFetching}
          />
        </Skeleton>
        <KpiCard label="Накоплено в мае" value="+90 480 ₽" sub="лучший месяц в году" trend={28.5} />
      </SimpleGrid>

      <Grid gap="md">
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <CashflowChart expenses={expenses} incomes={incomes} />
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
