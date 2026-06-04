import { AnalyticsKpis } from "@components/analytics/AnalyticsKpis"
import { CategoryComparison } from "@components/analytics/CategoryComparison"
import { CategoryDonut } from "@components/analytics/CategoryDonut"
import { ANALYTICS_PERIODS, analyticsParamsSchema } from "@components/analytics/config"
import { IncomeExpenseChart } from "@components/analytics/IncomeExpenseChart"
import { useAnalyticsData } from "@components/analytics/useAnalyticsData"
import { useUrlParams } from "@hooks/useUrlParams"
import {
  Button,
  Grid,
  Group,
  Paper,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core"
import { IconDownload } from "@tabler/icons-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

/** Подпись периода для нижней строки KPI («за неделю»). */
const PERIOD_SUB: Record<string, string> = {
  week: "за неделю",
  month: "за месяц",
  quarter: "за квартал",
  year: "за год",
}

export function AnalyticsPage() {
  const [params, setParams] = useUrlParams(analyticsParamsSchema)
  const period = params.period
  const { metrics, series, donut, comparison, range, isLoading, isError } = useAnalyticsData(period)

  const periodLabel = ANALYTICS_PERIODS.find((p) => p.value === period)?.label ?? ""
  const rangeLabel = `${format(range.from, "d MMM", { locale: ru })} – ${format(range.to, "d MMM yyyy", { locale: ru })}`

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={4}>
          <Title order={2} size="h3">
            Аналитика
          </Title>
          <Text size="sm" c="dimmed">
            Куда уходят деньги и как растут накопления
          </Text>
        </Stack>
        <Group gap="xs">
          <SegmentedControl
            value={period}
            onChange={(v) => setParams({ period: v as typeof period })}
            data={ANALYTICS_PERIODS.map((p) => ({ value: p.value, label: p.label }))}
          />
          <Button variant="default" size="sm" leftSection={<IconDownload size={14} />} disabled>
            PDF
          </Button>
        </Group>
      </Group>

      {isError ? (
        <Paper p="xl">
          <Text c="red.5" ta="center">
            Не удалось загрузить аналитику
          </Text>
        </Paper>
      ) : isLoading ? (
        <Stack gap="md">
          <Skeleton h={108} radius="md" />
          <Skeleton h={320} radius="md" />
          <Skeleton h={280} radius="md" />
        </Stack>
      ) : (
        <>
          <AnalyticsKpis metrics={metrics} periodLabel={PERIOD_SUB[period]} />

          <IncomeExpenseChart
            series={series}
            title="Доходы vs расходы"
            subtitle={periodLabel.toLowerCase()}
          />

          <Grid gap="md">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <CategoryDonut slices={donut} title="Расходы по категориям" subtitle={rangeLabel} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <CategoryComparison
                rows={comparison}
                title="Сравнение с прошлым периодом"
                subtitle="Где изменились расходы"
              />
            </Grid.Col>
          </Grid>
        </>
      )}
    </Stack>
  )
}
