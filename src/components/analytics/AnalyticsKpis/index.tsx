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
  const { i18n } = useTranslation()
  const money = (n: number) => formatCurrency(n, i18n.language, baseCurrency)
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
      <KpiCard
        label="Доходы"
        value={`+${money(metrics.income)}`}
        sub={periodLabel}
        trend={metrics.incomeTrend}
        accent="var(--mantine-color-green-5)"
      />
      <KpiCard
        label="Расходы"
        value={`−${money(metrics.expense)}`}
        sub={periodLabel}
        trend={metrics.expenseTrend}
        accent="var(--mantine-color-red-5)"
      />
      <KpiCard
        label="Накоплено"
        value={`${metrics.saved >= 0 ? "+" : "−"}${money(Math.abs(metrics.saved))}`}
        sub={`${metrics.savingsRate}% от дохода`}
        trend={metrics.savedTrend}
        accent={metrics.saved >= 0 ? "var(--mantine-color-green-5)" : "var(--mantine-color-red-5)"}
      />
      <KpiCard
        label="Норма сбережений"
        value={`${metrics.savingsRate}%`}
        sub="доля от дохода"
        trend={metrics.rateTrend}
      />
    </SimpleGrid>
  )
}
