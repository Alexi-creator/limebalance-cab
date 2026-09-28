import { Box, Button, Grid, Group, Paper, Skeleton, Stack, Text, Title } from "@mantine/core"
import { IconX } from "@tabler/icons-react"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useTranslation } from "react-i18next"
import { useAnalyticsData } from "@/modules/analytics/api/useAnalyticsData"
import { useCategorySeries } from "@/modules/analytics/api/useCategorySeries"
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
import { MultiSelectFilter, PeriodFilter } from "@/modules/transactions/ui"
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
  // with categories picked, the chart shows only that kind, narrowed to them
  const categorySeries = useCategorySeries(range, breakdown.kind, breakdown.selectedIds, locale)
  const chartTitle = breakdown.isFiltered
    ? `${t(breakdown.kind === "expense" ? "common.expense_plural" : "common.income_plural")} · ${t(
        "analytics.selected_total",
        { count: breakdown.visibleRows.length },
      )}`
    : t("analytics.income_vs_expense")

  const categoryOptions = breakdown.rows.map((r) => ({
    value: r.key,
    label: `${r.emoji} ${r.name}`,
  }))

  const hasFilters = params.period != null || breakdown.isFiltered
  // back to the default period and all categories
  const resetFilters = () => {
    setParams({ period: undefined, from: undefined, to: undefined })
    breakdown.setSelected([])
  }

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
        <Group gap="xs" align="flex-end" wrap="nowrap" className={classes.filters}>
          <Group gap="xs" align="flex-end" data-tour="an-period" className={classes.filterFields}>
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
            {/* narrows the donut and the details list (current expense/income switch) to the
                picked categories, with their combined total in the list header */}
            <MultiSelectFilter
              label={t("analytics.filter_categories")}
              placeholder={t("common.all")}
              data={categoryOptions}
              value={breakdown.selected}
              onChange={breakdown.setSelected}
              summary={(count) => t("transactions.categories_selected", { count })}
              inputClassName={classes.periodInput}
              w={180}
            />
            <Button
              variant="light"
              color="red"
              size="sm"
              leftSection={<IconX size={14} />}
              onClick={resetFilters}
              disabled={!hasFilters}
            >
              {t("common.reset")}
            </Button>
            {/* Hidden until the export API is ready
            <Button variant="default" size="sm" leftSection={<IconDownload size={14} />} disabled>
              PDF
            </Button>
            */}
          </Group>
          <TourTriggerButton onClick={startTour} size="input-sm" />
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
                series={categorySeries.series ?? series}
                title={chartTitle}
                subtitle={rangeLabel}
                baseCurrency={baseCurrency}
                only={breakdown.isFiltered ? breakdown.kind : undefined}
                isFetching={
                  breakdown.isFiltered && (categorySeries.isFetching || !categorySeries.series)
                }
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
