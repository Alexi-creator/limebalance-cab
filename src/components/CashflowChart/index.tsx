import type { Expense, ExpensesSummary } from "@appTypes/expense"
import type { Income, IncomesSummary } from "@appTypes/income"
import { dateFnsLocales } from "@i18n/languages.ts"
import { Box, Group, Paper, SegmentedControl, Stack, Text, useMantineTheme } from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { enUS } from "date-fns/locale"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { CashflowSvg } from "./CashflowSvg"
import { ChartLegend } from "./ChartLegend"
import { PERIODS } from "./config"
import { selectDataset } from "./helpers"

export interface CashflowChartProps {
  /**
   * Агрегированная сводка расходов для периодов 6m и 1y.
   * `total` — суммарная сумма за период; `byMonth` — разбивка `{ month: "yyyy-MM", total: string }[]`
   */
  expensesSummary?: ExpensesSummary
  /**
   * Агрегированная сводка доходов для периодов 6m и 1y.
   * `total` — суммарная сумма за период; `byMonth` — разбивка `{ month: "yyyy-MM", total: string }[]`
   */
  incomesSummary?: IncomesSummary
  /** Список расходов текущего месяца для периода 1m. */
  expenses?: Expense[]
  /** Список доходов текущего месяца для периода 1m. */
  incomes?: Income[]
}

/**
 * График денежного потока с переключением периода (1m / 6m / 1y).
 * Выбирает набор данных под период и отдаёт отрисовку в `CashflowSvg`.
 */
export function CashflowChart({
  expensesSummary,
  incomesSummary,
  expenses,
  incomes,
}: CashflowChartProps) {
  const { i18n, t } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const [period, setPeriod] = useState("1m")
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const theme = useMantineTheme()
  const isTabletOrAbove = useMediaQuery(`(min-width: ${theme.breakpoints.sm})`)

  const data = selectDataset({
    period,
    periodCount: period === "1y" ? 12 : 6,
    locale,
    compact: !isTabletOrAbove,
    expenses,
    incomes,
    expensesSummary,
    incomesSummary,
  })

  const periodData = PERIODS.map((p) => ({ value: p.value, label: t(p.labelKey) }))

  return (
    <Paper>
      <Group
        justify="space-between"
        p="md"
        style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
      >
        <Stack gap={2}>
          <Text fw={600} size="sm">
            {t("chart.cashflow_title")}
          </Text>
          <Text size="xs" c="dimmed">
            {t("chart.cashflow_subtitle")}
          </Text>
        </Stack>
        <SegmentedControl size="xs" value={period} onChange={setPeriod} data={periodData} />
      </Group>
      <Box p="md">
        <CashflowSvg
          data={data}
          period={period}
          hoveredIndex={hoveredIndex}
          onHover={setHoveredIndex}
        />
        <ChartLegend />
      </Box>
    </Paper>
  )
}
