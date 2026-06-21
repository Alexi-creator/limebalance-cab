import { EXPENSE_COLOR, INCOME_COLOR } from "@constants/chartColors"
import { Box, Group, Paper, Stack, Text } from "@mantine/core"
import { formatCurrency } from "@utils/formatCurrency"
import { useTranslation } from "react-i18next"
import { ChartTooltip, useChartTooltip } from "../chartTooltip"
import type { SeriesPoint } from "../helpers"

const W = 720
const H = 300
const TOP = 20
const PLOT_H = 240
const LEFT = 40

/** Rounds the maximum up to a "nice" value for the top axis line. */
function niceMax(value: number): number {
  if (value <= 0) return 1
  const pow = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / pow) * pow
}

/** Compact axis label: thousands → "12k". */
function axisLabel(v: number): string {
  return v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v))
}

interface Props {
  series: SeriesPoint[]
  title: string
  subtitle: string
  /** User's base currency — the series amounts come in it. */
  baseCurrency?: string
}

/** Paired bars of income (filled) and expenses (outlined) by period buckets. */
export function IncomeExpenseChart({ series, title, subtitle, baseCurrency }: Props) {
  const { t, i18n } = useTranslation()
  const money = (n: number) => formatCurrency(n, i18n.language, baseCurrency)
  const { wrapRef, tip, show, hide } = useChartTooltip()
  const max = niceMax(Math.max(1, ...series.flatMap((p) => [p.income, p.expense])))
  const slot = (W - LEFT - 10) / Math.max(series.length, 1)
  const barW = Math.min(14, slot * 0.32)
  const base = TOP + PLOT_H
  const slotX = (i: number) => LEFT + slot * (i + 0.5)

  return (
    <Paper>
      <Group
        justify="space-between"
        p="md"
        style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
      >
        <Stack gap={2}>
          <Text fw={600} size="sm">
            {title}
          </Text>
          <Text size="xs" c="dimmed">
            {subtitle}
          </Text>
        </Stack>
        <Group gap="lg">
          <Group gap={6}>
            <Box w={10} h={10} style={{ background: INCOME_COLOR, borderRadius: 2 }} />
            <Text size="xs">{t("common.income_plural")}</Text>
          </Group>
          <Group gap={6}>
            <Box w={10} h={10} style={{ background: EXPENSE_COLOR, borderRadius: 2 }} />
            <Text size="xs">{t("common.expense_plural")}</Text>
          </Group>
        </Group>
      </Group>
      <Box p="md" ref={wrapRef} style={{ position: "relative" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: 280, display: "block" }}
          role="img"
          aria-label={t("analytics.chart_aria")}
        >
          <title>{t("analytics.chart_aria")}</title>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const yy = TOP + PLOT_H * t
            return (
              <g key={t}>
                <line
                  x1={LEFT}
                  x2={W - 10}
                  y1={yy}
                  y2={yy}
                  stroke="var(--mantine-color-default-border)"
                  strokeDasharray={t === 1 ? "0" : "2 4"}
                />
                <text
                  x={LEFT - 6}
                  y={yy + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="var(--mantine-color-dimmed)"
                  fontFamily="var(--mantine-font-family-monospace)"
                >
                  {axisLabel(max * (1 - t))}
                </text>
              </g>
            )
          })}
          {series.map((p, i) => {
            const cx = slotX(i)
            const hIn = (p.income / max) * PLOT_H
            const hOut = (p.expense / max) * PLOT_H
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: buckets are positional and stable by index
              <g key={i}>
                <rect
                  x={cx - barW - 1}
                  y={base - hIn}
                  width={barW}
                  height={hIn}
                  rx="2"
                  fill={INCOME_COLOR}
                />
                <rect
                  x={cx + 1}
                  y={base - hOut}
                  width={barW}
                  height={hOut}
                  rx="2"
                  fill={EXPENSE_COLOR}
                />
                <text
                  x={cx}
                  y={base + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--mantine-color-dimmed)"
                  fontFamily="var(--mantine-font-family-monospace)"
                >
                  {p.label}
                </text>
                {/* transparent full-column hit area — makes the thin bars easy to hover */}
                {/* biome-ignore lint/a11y/noStaticElementInteractions: hover tooltip on a decorative chart column */}
                <rect
                  x={cx - slot / 2}
                  y={TOP}
                  width={slot}
                  height={PLOT_H}
                  fill="transparent"
                  style={{ cursor: "pointer" }}
                  onMouseMove={(e) =>
                    show(
                      e,
                      `${t("common.income_plural")}: ${money(p.income)} · ${t("common.expense_plural")}: ${money(p.expense)}`,
                    )
                  }
                  onMouseLeave={hide}
                />
              </g>
            )
          })}
        </svg>
        <ChartTooltip tip={tip} />
      </Box>
    </Paper>
  )
}
