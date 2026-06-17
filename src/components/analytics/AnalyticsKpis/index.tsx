import { SimpleGrid } from "@mantine/core"
import { KpiCard } from "@ui/KpiCard"
import { formatCurrency } from "@utils/formatCurrency"
import { useTranslation } from "react-i18next"
import type { Metrics } from "../helpers"

interface Props {
  metrics: Metrics
  /** Подпись периода в нижней строке карточки («за месяц»). */
  periodLabel: string
  /** Базовая валюта пользователя — в ней приходят суммы из сводок. */
  baseCurrency?: string
}

/** Строка KPI: доходы, расходы, накопления и норма сбережений за период. */
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
