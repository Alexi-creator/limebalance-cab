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
import { useCashflowData } from "./useCashflowData"

/**
 * Cash flow chart with period switching (1m / 6m / 1y).
 * Loads data itself, picks the dataset for the period, and delegates rendering to `CashflowSvg`.
 */
export function CashflowChart() {
  const { i18n, t } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS
  // Default to 6 months rather than 1 — a single month is a flat, sparse line for a new
  // account; a wider window reads better and keeps looking good as history accumulates.
  const [period, setPeriod] = useState("6m")
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const theme = useMantineTheme()
  // Read the media query synchronously on the first render (no SSR here), otherwise
  // Mantine resolves it in an effect: the chart renders compact, then re-renders on
  // mount — a visible "jump" every time the page (re)mounts.
  const isTabletOrAbove = useMediaQuery(`(min-width: ${theme.breakpoints.sm})`, true, {
    getInitialValueInEffect: false,
  })

  const { expensesSummary, incomesSummary } = useCashflowData(period)

  const data = selectDataset({
    period,
    locale,
    compact: !isTabletOrAbove,
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
