import { AnalyticsKpis } from "@components/analytics/AnalyticsKpis"
import { CategoryComparison } from "@components/analytics/CategoryComparison"
import { CategoryDonut } from "@components/analytics/CategoryDonut"
import { ANALYTICS_PERIODS, analyticsParamsSchema } from "@components/analytics/config"
import { IncomeExpenseChart } from "@components/analytics/IncomeExpenseChart"
import { useAnalyticsData } from "@components/analytics/useAnalyticsData"
import { useUrlParams } from "@hooks/useUrlParams"
import { dateFnsLocales } from "@i18n/languages.ts"
import { Grid, Group, Paper, SegmentedControl, Skeleton, Stack, Text, Title } from "@mantine/core"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useTranslation } from "react-i18next"
import classes from "./AnalyticsPage.module.css"

export function AnalyticsPage() {
  const { t, i18n } = useTranslation()
  const [params, setParams] = useUrlParams(analyticsParamsSchema)
  const period = params.period
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const { metrics, series, donut, comparison, range, baseCurrency, isLoading, isError } =
    useAnalyticsData(period, locale)

  const periodLabel = t(`analytics.period_${period}`)
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
        <Group gap="xs">
          <SegmentedControl
            classNames={{ root: classes.periodControl }}
            value={period}
            onChange={(v) => setParams({ period: v as typeof period })}
            data={ANALYTICS_PERIODS.map((p) => ({ value: p, label: t(`analytics.period_${p}`) }))}
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
            periodLabel={t(`analytics.sub_${period}`)}
            baseCurrency={baseCurrency}
          />

          <IncomeExpenseChart
            series={series}
            title={t("analytics.income_vs_expense")}
            subtitle={periodLabel.toLowerCase()}
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
