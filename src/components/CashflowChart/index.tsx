import type { Expense, ExpensesSummary } from "@appTypes/expense"
import type { Income, IncomesSummary } from "@appTypes/income"
import { dateFnsLocales } from "@i18n/languages.ts"
import { Box, Group, Paper, SegmentedControl, Stack, Text, useMantineTheme } from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { format, getDate, type Locale, subMonths } from "date-fns"
import { enUS } from "date-fns/locale"
import { useState } from "react"
import { useTranslation } from "react-i18next"

const accent = "var(--mantine-color-lime-4)"
const neg = "var(--mantine-color-red-5)"

function getMonthLabels(count: number, locale: Locale) {
  const now = new Date()
  return Array.from({ length: count }, (_, i) =>
    format(subMonths(now, count - 1 - i), "MMM", { locale }),
  )
}

const stubValues = {
  "6m": {
    income: [180, 196, 210, 218, 245, 280],
    expense: [120, 138, 140, 148, 160, 180],
  },
  "1y": {
    income: [180, 196, 188, 210, 224, 232, 218, 245, 258, 242, 280, 310],
    expense: [120, 138, 128, 140, 156, 152, 148, 160, 172, 165, 180, 188],
  },
}

function buildMonthDataset(expenses: Expense[], incomes: Income[], compact: boolean) {
  const today = getDate(new Date())
  const incomeByDay = new Array(today).fill(0)
  const expenseByDay = new Array(today).fill(0)

  incomes.forEach((t) => {
    const day = getDate(new Date(t.createdAt)) - 1
    if (day >= 0 && day < today) incomeByDay[day] += t.amount
  })
  expenses.forEach((t) => {
    const day = getDate(new Date(t.createdAt)) - 1
    if (day >= 0 && day < today) expenseByDay[day] += t.amount
  })

  const labels = Array.from({ length: today }, (_, i) =>
    compact ? ((i + 1) % 5 === 1 || i === today - 1 ? String(i + 1) : "") : String(i + 1),
  )

  return { income: incomeByDay, expense: expenseByDay, labels }
}

function buildSummaryDataset(
  expensesByMonth: ExpensesSummary["byMonth"],
  incomesByMonth: IncomesSummary["byMonth"],
  count: number,
  locale: Locale,
) {
  const expSlice = expensesByMonth.slice(-count)
  const incSlice = incomesByMonth.slice(-count)
  return {
    income: incSlice.map((m) => parseFloat(m.total)),
    expense: expSlice.map((m) => parseFloat(m.total)),
    labels: expSlice.map((m) => {
      const [year, month] = m.month.split("-").map(Number)
      return format(new Date(year, month - 1, 1), "MMM", { locale })
    }),
  }
}

interface Props {
  expensesSummary?: ExpensesSummary
  incomesSummary?: IncomesSummary
  expenses?: Expense[]
  incomes?: Income[]
}

export function CashflowChart({ expensesSummary, incomesSummary, expenses, incomes }: Props) {
  const { i18n, t } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const [period, setPeriod] = useState("1m")
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const theme = useMantineTheme()
  const isTabletOrAbove = useMediaQuery(`(min-width: ${theme.breakpoints.sm})`)

  const periodCount = period === "1y" ? 12 : 6

  const d =
    period === "1m" && expenses != null && incomes != null
      ? buildMonthDataset(expenses, incomes, !isTabletOrAbove)
      : period !== "1m" && expensesSummary && incomesSummary
        ? buildSummaryDataset(expensesSummary.byMonth, incomesSummary.byMonth, periodCount, locale)
        : {
            ...(stubValues[period as keyof typeof stubValues] ?? stubValues["6m"]),
            labels: getMonthLabels(
              (stubValues[period as keyof typeof stubValues] ?? stubValues["6m"]).income.length,
              locale,
            ),
          }

  const W = 640,
    H = 240,
    PAD_L = 30,
    PAD_R = 10,
    PAD_T = 10,
    PAD_B = 30
  const max = Math.max(...d.income, ...d.expense) * 1.1 || 1
  const slots = Math.max(d.income.length - 1, 1)
  const slotWidth = (W - PAD_L - PAD_R) / slots
  const x = (i: number) => PAD_L + i * slotWidth
  const y = (v: number) => H - PAD_B - (v / max) * (H - PAD_B - PAD_T)
  const linePath = (arr: number[]) =>
    arr.map((v, i) => `${i ? "L" : "M"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ")
  const areaPath = (arr: number[]) =>
    `${linePath(arr)} L ${x(arr.length - 1).toFixed(1)} ${H - PAD_B} L ${x(0).toFixed(1)} ${H - PAD_B} Z`

  const periodData = [
    { value: "1m", label: t("chart.period_1m") },
    { value: "6m", label: t("chart.period_6m") },
    { value: "1y", label: t("chart.period_1y") },
  ]

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
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ width: "100%", height: 240, display: "block" }}
          role="img"
          aria-label={t("chart.cashflow_title")}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <title>{t("chart.cashflow_title")}</title>
          <defs>
            <linearGradient id="ovIn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.32" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const yy = PAD_T + (H - PAD_T - PAD_B) * frac
            return (
              <g key={frac}>
                <line
                  x1={PAD_L}
                  x2={W - PAD_R}
                  y1={yy}
                  y2={yy}
                  stroke="var(--mantine-color-default-border)"
                  strokeDasharray={frac === 1 ? "0" : "2 4"}
                />
                <text
                  x={PAD_L - 6}
                  y={yy + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="var(--mantine-color-dimmed)"
                  fontFamily="var(--mantine-font-family-monospace)"
                >
                  {Math.round(max * (1 - frac))}
                </text>
              </g>
            )
          })}

          {hoveredIndex !== null && (
            <line
              x1={x(hoveredIndex)}
              x2={x(hoveredIndex)}
              y1={PAD_T}
              y2={H - PAD_B}
              stroke="var(--mantine-color-default-border)"
              strokeWidth="1"
            />
          )}

          <path d={areaPath(d.income)} fill="url(#ovIn)" />
          <path
            d={linePath(d.expense)}
            stroke={neg}
            strokeWidth="1.5"
            fill="none"
            opacity="0.7"
            strokeDasharray="3 3"
          />
          <path d={linePath(d.income)} stroke={accent} strokeWidth="2" fill="none" />

          {d.income.map((v: number, i: number) => {
            const hx = x(i)
            const hy = y(v)
            const isHovered = hoveredIndex === i
            const tooltipLabel = period === "1m" ? `${t("chart.day")} ${i + 1}` : d.labels[i]
            const tooltipX = hx > W - 100 ? hx - 98 : hx < 50 ? hx + 8 : hx - 45
            const tooltipY = hy < 65 ? hy + 8 : hy - 62

            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length chart points, no reordering
              // biome-ignore lint/a11y/noStaticElementInteractions: SVG hit zone for chart hover
              <g key={i} onMouseEnter={() => setHoveredIndex(i)}>
                <rect
                  x={hx - slotWidth / 2}
                  y={PAD_T}
                  width={slotWidth}
                  height={H - PAD_T - PAD_B}
                  fill="transparent"
                />
                <circle
                  cx={hx}
                  cy={hy}
                  r={isHovered ? 4 : 3}
                  fill="var(--mantine-color-body)"
                  stroke={accent}
                  strokeWidth="2"
                />
                {isHovered && (
                  <circle
                    cx={hx}
                    cy={y(d.expense[i])}
                    r="4"
                    fill="var(--mantine-color-body)"
                    stroke={neg}
                    strokeWidth="2"
                  />
                )}
                <text
                  x={hx}
                  y={H - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--mantine-color-dimmed)"
                  fontFamily="var(--mantine-font-family-monospace)"
                >
                  {d.labels[i]}
                </text>
                {isHovered && (
                  <g transform={`translate(${tooltipX}, ${tooltipY})`}>
                    <rect
                      x="0"
                      y="0"
                      width="90"
                      height="54"
                      rx="4"
                      fill="var(--mantine-color-dark-6)"
                      stroke="var(--mantine-color-dark-4)"
                      strokeWidth="1"
                    />
                    <text
                      x="8"
                      y="15"
                      fontSize="9"
                      fill="var(--mantine-color-dimmed)"
                      fontFamily="var(--mantine-font-family-monospace)"
                    >
                      {tooltipLabel}
                    </text>
                    <text
                      x="8"
                      y="30"
                      fontSize="10"
                      fill={accent}
                      fontFamily="var(--mantine-font-family-monospace)"
                    >
                      +{Math.round(v)}
                    </text>
                    <text
                      x="8"
                      y="45"
                      fontSize="10"
                      fill={neg}
                      fontFamily="var(--mantine-font-family-monospace)"
                    >
                      −{Math.round(d.expense[i])}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
        <Group gap="lg" mt="sm">
          <Group gap={6}>
            <Box w={10} h={10} style={{ background: accent, borderRadius: 2 }} />
            <Text size="xs">{t("chart.income")}</Text>
          </Group>
          <Group gap={6}>
            <Box w={10} h={0} style={{ borderTop: `2px dashed ${neg}` }} />
            <Text size="xs">{t("chart.expense")}</Text>
          </Group>
        </Group>
      </Box>
    </Paper>
  )
}
