import { getExpenses } from "@api/expenses"
import { CashflowChart } from "@components/CashflowChart"
import { GoalsSnippet } from "@components/GoalsSnippet"
import { KpiCard } from "@components/KpiCard"
import { PortfolioSnippet } from "@components/PortfolioSnippet"
import { RecentTransactions } from "@components/RecentTransactions"
import { Button, Grid, Group, SimpleGrid, Skeleton, Stack, Text, Title } from "@mantine/core"
import { IconDownload, IconPlus } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { formatCurrency } from "@utils/formatCurrency"
import { endOfMonth, startOfMonth } from "date-fns"
import { useTranslation } from "react-i18next"

function getMonthRange() {
  const now = new Date()
  return { from: startOfMonth(now), to: endOfMonth(now) }
}

export function HomePage() {
  const { i18n } = useTranslation()
  const { from, to } = getMonthRange()

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["expenses", "month", from.toISOString().slice(0, 7)],
    queryFn: () => getExpenses(from, to),
  })

  const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0
  const formattedExpenses = isLoading ? "—" : formatCurrency(-totalExpenses, i18n.language)

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
          <Button size="sm" leftSection={<IconPlus size={14} />}>
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
        <KpiCard label="Доход за месяц" value="+218 800 ₽" sub="зарплата + фриланс" trend={4.2} />
        <Skeleton visible={isLoading} radius="md">
          <KpiCard
            label="Расход за месяц"
            value={formattedExpenses}
            sub={`${expenses?.length ?? 0} операций`}
          />
        </Skeleton>
        <KpiCard label="Накоплено в мае" value="+90 480 ₽" sub="лучший месяц в году" trend={28.5} />
      </SimpleGrid>

      <Grid gap="md">
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <CashflowChart />
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
