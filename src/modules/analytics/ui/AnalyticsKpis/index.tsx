import { SimpleGrid } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { formatCurrency } from "@/shared/lib/formatCurrency"
import { KpiCard } from "@/shared/ui/KpiCard"
import { AVERAGE_KEYS } from "../../config"
import type { Metrics, PeriodAverages } from "../../lib/helpers"

interface Props {
  metrics: Metrics
  /** Period caption in the card's bottom line ("for the month"). */
  periodLabel: string
  /** User's base currency — the amounts from the summaries come in it. */
  baseCurrency?: string
  /** Income / expense per day, week or month — a second caption line under the totals. */
  averages?: PeriodAverages
}

/** KPI row: income, expenses, savings, and savings rate for the period. */
export function AnalyticsKpis({ metrics, periodLabel, baseCurrency, averages }: Props) {
  const { t, i18n } = useTranslation()
  const money = (n: number) => formatCurrency(n, i18n.language, baseCurrency)
  const withAverage = (avg: number | null | undefined) =>
    avg && averages
      ? [periodLabel, t(AVERAGE_KEYS[averages.granularity], { amount: money(Math.round(avg)) })]
      : periodLabel
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
      <KpiCard
        label={t("common.income_plural")}
        value={`+${money(metrics.income)}`}
        sub={withAverage(averages?.income)}
        trend={metrics.incomeTrend}
        accent="var(--mantine-color-green-5)"
      />
      <KpiCard
        label={t("common.expense_plural")}
        value={`−${money(metrics.expense)}`}
        sub={withAverage(averages?.expense)}
        trend={metrics.expenseTrend}
        accent="var(--mantine-color-red-5)"
      />
      <KpiCard
        label={t("analytics.kpi_saved")}
        value={`${metrics.saved >= 0 ? "+" : "−"}${money(Math.abs(metrics.saved))}`}
        sub={t("analytics.savings_of_income", { rate: metrics.savingsRate })}
        trend={metrics.savedTrend}
        accent={metrics.saved >= 0 ? "var(--mantine-color-green-5)" : "var(--mantine-color-red-5)"}
      />
      <KpiCard
        label={t("analytics.kpi_savings_rate")}
        value={`${metrics.savingsRate}%`}
        sub={t("analytics.savings_share")}
        trend={metrics.rateTrend}
      />
    </SimpleGrid>
  )
}
