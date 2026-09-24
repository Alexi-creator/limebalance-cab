import {
  Box,
  Grid,
  Group,
  Paper,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useTranslation } from "react-i18next"
import { useAnalyticsData } from "@/modules/analytics/api/useAnalyticsData"
import { ANALYTICS_PERIODS, analyticsParamsSchema } from "@/modules/analytics/config"
import { useAnalyticsTour } from "@/modules/analytics/hooks/useAnalyticsTour"
import { useCategoryBreakdown } from "@/modules/analytics/hooks/useCategoryBreakdown"
import {
  AnalyticsKpis,
  CategoryDonut,
  DetailedStats,
  IncomeExpenseChart,
} from "@/modules/analytics/ui"
import { useUrlParams } from "@/shared/hooks/useUrlParams"
import { dateFnsLocales } from "@/shared/i18n/languages.ts"
import { TourTriggerButton } from "@/shared/ui/TourTriggerButton"
import classes from "./styles.module.css"

export function AnalyticsPage() {
  const { t, i18n } = useTranslation()
  const { startTour } = useAnalyticsTour()
  const [params, setParams] = useUrlParams(analyticsParamsSchema)
  const period = params.period
  // custom datepicker range; when both dates are set, it overrides the period presets
  const isCustom = Boolean(params.from && params.to)
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const { metrics, series, range, baseCurrency, isLoading, isError } = useAnalyticsData(
    period,
    locale,
    params.from,
    params.to,
  )

  // shared by the donut and the details list: same categories, colors, hovered category
  const breakdown = useCategoryBreakdown(range)

  const rangeLabel = `${format(range.from, "d MMM", { locale })} – ${format(range.to, "d MMM yyyy", { locale })}`
  const periodLabel = isCustom ? rangeLabel : t(`analytics.period_${period}`)

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
        <Group gap="xs">
          <Group gap="xs" data-tour="an-period">
            <SegmentedControl
              classNames={{ root: classes.periodControl }}
              // with a custom range active no preset is highlighted
              value={isCustom ? "" : period}
              onChange={(v) =>
                setParams({ period: v as typeof period, from: undefined, to: undefined })
              }
              data={ANALYTICS_PERIODS.map((p) => ({ value: p, label: t(`analytics.period_${p}`) }))}
            />
            <DatePickerInput
              type="range"
              size="sm"
              classNames={{ input: classes.periodPicker }}
              label={t("transactions.period")}
              placeholder={t("transactions.date_range_placeholder")}
              valueFormat="D MMM YYYY"
              value={[params.from ?? null, params.to ?? null]}
              onChange={([from, to]) => setParams({ from: from ?? undefined, to: to ?? undefined })}
              clearable
              allowSingleDateInRange
              w={230}
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
            <AnalyticsKpis
              metrics={metrics}
              periodLabel={isCustom ? rangeLabel : t(`analytics.sub_${period}`)}
              baseCurrency={baseCurrency}
            />
          </Box>

          {/* desktop: compact charts row, then the details list (with the comparison to the
              previous period built in) — still on the first screen;
              phone: the details list goes right after the KPIs, the charts below it */}
          <Grid gap="md" data-tour="an-charts">
            <Grid.Col span={{ base: 12, md: 8 }} order={{ base: 2, md: 1 }}>
              <IncomeExpenseChart
                series={series}
                title={t("analytics.income_vs_expense")}
                subtitle={isCustom ? rangeLabel : periodLabel.toLowerCase()}
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
