import { SimpleGrid } from "@mantine/core"
import { KpiCard } from "@ui/KpiCard"
import type { Metrics } from "../helpers"
import { formatRub } from "../helpers"

const accent = "var(--mantine-color-lime-4)"

interface Props {
  metrics: Metrics
  /** Подпись периода в нижней строке карточки («за месяц»). */
  periodLabel: string
}

/** Строка KPI: доходы, расходы, накопления и норма сбережений за период. */
export function AnalyticsKpis({ metrics, periodLabel }: Props) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
      <KpiCard
        label="Доходы"
        value={`+${formatRub(metrics.income)}`}
        sub={periodLabel}
        trend={metrics.incomeTrend}
        accent="var(--mantine-color-green-5)"
      />
      <KpiCard
        label="Расходы"
        value={`−${formatRub(metrics.expense)}`}
        sub={periodLabel}
        trend={metrics.expenseTrend}
        accent="var(--mantine-color-red-5)"
      />
      <KpiCard
        label="Накоплено"
        value={`${metrics.saved >= 0 ? "+" : "−"}${formatRub(Math.abs(metrics.saved))}`}
        sub={`${metrics.savingsRate}% от дохода`}
        trend={metrics.savedTrend}
        accent={accent}
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
