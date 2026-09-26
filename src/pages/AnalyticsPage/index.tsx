import { Box, Grid, Group, Paper, Skeleton, Stack, Text, Title } from "@mantine/core"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useTranslation } from "react-i18next"
import { useAnalyticsData } from "@/modules/analytics/api/useAnalyticsData"
import { type AnalyticsPeriod, analyticsParamsSchema } from "@/modules/analytics/config"
import { useAnalyticsTour } from "@/modules/analytics/hooks/useAnalyticsTour"
import { useCategoryBreakdown } from "@/modules/analytics/hooks/useCategoryBreakdown"
import { resolveAnalyticsPeriod } from "@/modules/analytics/lib/helpers"
import {
  AnalyticsKpis,
  CategoryDonut,
  DetailedStats,
  IncomeExpenseChart,
} from "@/modules/analytics/ui"
import { PeriodFilter } from "@/modules/transactions/ui"
import { useUrlParams } from "@/shared/hooks/useUrlParams"
import { dateFnsLocales } from "@/shared/i18n/languages.ts"
import { TourTriggerButton } from "@/shared/ui/TourTriggerButton"
import classes from "./styles.module.css"

export function AnalyticsPage() {
  const { t, i18n } = useTranslation()
  const { startTour } = useAnalyticsTour()
  const [params, setParams] = useUrlParams(analyticsParamsSchema)
  const { period, from, to } = resolveAnalyticsPeriod(params.period, params.from, params.to)
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const { metrics, series, range, baseCurrency, isLoading, isError } = useAnalyticsData(
    period,
    from,
    to,
    locale,
  )

  // shared by the donut and the details list: same categories, colors, hovered category
  const breakdown = useCategoryBreakdown(range)

  const rangeLabel = `${format(range.from, "d MMM", { locale })} – ${format(range.to, "d MMM yyyy", { locale })}`

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={4}>
          <Title order={2} size="h3">
            {t("analytics.title")}
          </Title>
          <Text size="sm" c="dimmed">
            {t("analytics.subtitle")}
          </Text>
        </Stack>
        <Group gap="xs" align="flex-end">
          <Group gap="xs" align="flex-end" data-tour="an-period">
            <PeriodFilter
              period={params.period}
              from={params.from}
              to={params.to}
              onChange={(next) => setParams({ ...next, period: next.period as AnalyticsPeriod })}
              vertical={false}
              size="sm"
              withAll={false}
              inputClassName={classes.periodInput}
            />
            {/* Hidden until the export API is ready
            <Button variant="default" size="sm" leftSection={<IconDownload size={14} />} disabled>
              PDF
            </Button>
            */}
          </Group>
          <TourTriggerButton onClick={startTour} />
        </Group>
      </Group>

      {isError ? (
        <Paper p="xl">
          <Text c="red.5" ta="center">
            {t("analytics.load_error")}
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
          <Box data-tour="an-kpis">
            <AnalyticsKpis metrics={metrics} periodLabel={rangeLabel} baseCurrency={baseCurrency} />
          </Box>

          {/* desktop: compact charts row, then the details list (with the comparison to the
              previous period built in) — still on the first screen;
              phone: the details list goes right after the KPIs, the charts below it */}
          <Grid gap="md" data-tour="an-charts">
            <Grid.Col span={{ base: 12, md: 8 }} order={{ base: 2, md: 1 }}>
              <IncomeExpenseChart
                series={series}
                title={t("analytics.income_vs_expense")}
                subtitle={rangeLabel}
                baseCurrency={baseCurrency}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }} order={{ base: 3, md: 2 }}>
              <CategoryDonut breakdown={breakdown} subtitle={rangeLabel} />
            </Grid.Col>
            <Grid.Col span={12} order={{ base: 1, md: 3 }}>
              <DetailedStats breakdown={breakdown} subtitle={rangeLabel} locale={locale} />
            </Grid.Col>
          </Grid>
        </>
      )}
    </Stack>
  )
}
