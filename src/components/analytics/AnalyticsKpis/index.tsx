import { SimpleGrid } from "@mantine/core"
import { KpiCard } from "@ui/KpiCard"
import { formatCurrency } from "@utils/formatCurrency"
import { useTranslation } from "react-i18next"
import type { Metrics } from "../helpers"

interface Props {
  metrics: Metrics
  /** Period caption in the card's bottom line ("for the month"). */
  periodLabel: string
  /** User's base currency — the amounts from the summaries come in it. */
  baseCurrency?: string
}

/** KPI row: income, expenses, savings, and savings rate for the period. */
export function AnalyticsKpis({ metrics, periodLabel, baseCurrency }: Props) {
  const { t, i18n } = useTranslation()
  const money = (n: number) => formatCurrency(n, i18n.language, baseCurrency)
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
      <KpiCard
        label={t("common.income_plural")}
        value={`+${money(metrics.income)}`}
        sub={periodLabel}
        trend={metrics.incomeTrend}
        accent="var(--mantine-color-green-5)"
      />
      <KpiCard
        label={t("common.expense_plural")}
        value={`−${money(metrics.expense)}`}
        sub={periodLabel}
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
