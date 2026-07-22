import { AnalyticsKpis } from "@components/analytics/AnalyticsKpis"
import { CategoryComparison } from "@components/analytics/CategoryComparison"
import { CategoryDonut } from "@components/analytics/CategoryDonut"
import { ANALYTICS_PERIODS, analyticsParamsSchema } from "@components/analytics/config"
import { DetailedStats } from "@components/analytics/DetailedStats"
import { IncomeExpenseChart } from "@components/analytics/IncomeExpenseChart"
import { useAnalyticsData } from "@components/analytics/useAnalyticsData"
import { useUrlParams } from "@hooks/useUrlParams"
import { dateFnsLocales } from "@i18n/languages.ts"
import { Grid, Group, Paper, SegmentedControl, Skeleton, Stack, Text, Title } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useTranslation } from "react-i18next"
import classes from "./AnalyticsPage.module.css"

export function AnalyticsPage() {
  const { t, i18n } = useTranslation()
  const [params, setParams] = useUrlParams(analyticsParamsSchema)
  const period = params.period
  // custom datepicker range; when both dates are set, it overrides the period presets
  const isCustom = Boolean(params.from && params.to)
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const { metrics, series, donut, comparison, range, baseCurrency, isLoading, isError } =
    useAnalyticsData(period, locale, params.from, params.to)

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
          <AnalyticsKpis
            metrics={metrics}
            periodLabel={isCustom ? rangeLabel : t(`analytics.sub_${period}`)}
            baseCurrency={baseCurrency}
          />

          <DetailedStats from={range.from} to={range.to} subtitle={rangeLabel} locale={locale} />

          <IncomeExpenseChart
            series={series}
            title={t("analytics.income_vs_expense")}
            subtitle={isCustom ? rangeLabel : periodLabel.toLowerCase()}
            baseCurrency={baseCurrency}
          />

          <Grid gap="md">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <CategoryDonut
                slices={donut}
                title={t("analytics.expenses_by_category")}
                subtitle={rangeLabel}
                baseCurrency={baseCurrency}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <CategoryComparison
                rows={comparison}
                title={t("analytics.comparison_title")}
                subtitle={t("analytics.comparison_subtitle")}
                baseCurrency={baseCurrency}
              />
            </Grid.Col>
          </Grid>
        </>
      )}
    </Stack>
  )
}
