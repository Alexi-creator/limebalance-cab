import { Box, Group, Paper, Stack, Text } from "@mantine/core"
import { useElementSize } from "@mantine/hooks"
import { type PointerEvent, useState } from "react"
import { useTranslation } from "react-i18next"
import { EXPENSE_COLOR, INCOME_COLOR } from "@/shared/config/chartColors"
import { axisPadLeft, formatAxisValue, niceScale, xLabelStep } from "@/shared/lib/chartScale"
import { formatCurrency } from "@/shared/lib/formatCurrency"
import { ChartHoverCard } from "@/shared/ui/ChartHoverCard"
import type { SeriesPoint } from "../../lib/helpers"

/** Chart geometry; the width follows the container so text keeps its size on phones. */
const H = 180
const TOP = 10
const PLOT_H = 140
const RIGHT = 10
const AXIS_FONT = 9
const X_FONT = 10

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
  const { ref, width } = useElementSize()
  const [hovered, setHovered] = useState<number | null>(null)
  const W = width || 720

  const scale = niceScale(0, Math.max(0, ...series.flatMap((p) => [p.income, p.expense])))
  const tickLabels = scale.ticks.map((v) => formatAxisValue(v, i18n.language))
  const LEFT = axisPadLeft(tickLabels, AXIS_FONT)
  const slot = (W - LEFT - RIGHT) / Math.max(series.length, 1)
  const barW = Math.min(14, slot * 0.32)
  const base = TOP + PLOT_H
  const slotX = (i: number) => LEFT + slot * (i + 0.5)
  // day labels come pre-thinned from the helpers; month / week labels are thinned here by width
  const labels = series.map((p) => p.label)
  const labelStep = labels.some((l) => !l) ? 1 : xLabelStep(labels, slot, X_FONT)

  // Column under the pointer — one handler for mouse and touch (tap / drag along the chart).
  const pick = (e: PointerEvent<SVGSVGElement>) => {
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left
    const i = Math.floor((px - LEFT) / slot)
    setHovered(i >= 0 && i < series.length ? i : null)
  }
  const hoveredPoint = hovered !== null ? series[hovered] : undefined

  return (
    <Paper h="100%">
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
      <Box p="md">
        <Box ref={ref} style={{ position: "relative" }}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: "100%", height: H, display: "block", touchAction: "pan-y" }}
            role="img"
            aria-label={t("analytics.chart_aria")}
            onPointerMove={pick}
            onPointerDown={pick}
            // on touch, pointerleave fires right after the finger lifts — keep the card visible
            onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(null)}
          >
            {hovered !== null && (
              <rect
                x={LEFT + slot * hovered}
                y={TOP}
                width={slot}
                height={PLOT_H}
                fill="var(--mantine-color-default-hover)"
              />
            )}
            {scale.ticks.map((v, k) => {
              const yy = base - (v / scale.max) * PLOT_H
              return (
                <g key={v}>
                  <line
                    x1={LEFT}
                    x2={W - RIGHT}
                    y1={yy}
                    y2={yy}
                    stroke="var(--mantine-color-default-border)"
                    strokeDasharray={v === 0 ? "0" : "2 4"}
                  />
                  <text
                    x={LEFT - 6}
                    y={yy + 3}
                    textAnchor="end"
                    fontSize={AXIS_FONT}
                    fill="var(--mantine-color-dimmed)"
                    fontFamily="var(--mantine-font-family-monospace)"
                  >
                    {tickLabels[k]}
                  </text>
                </g>
              )
            })}
            {series.map((p, i) => {
              const cx = slotX(i)
              const hIn = (p.income / scale.max) * PLOT_H
              const hOut = (p.expense / scale.max) * PLOT_H
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
                  {i % labelStep === 0 && (
                    <text
                      x={cx}
                      y={base + 18}
                      textAnchor="middle"
                      fontSize={X_FONT}
                      fill="var(--mantine-color-dimmed)"
                      fontFamily="var(--mantine-font-family-monospace)"
                    >
                      {p.label}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
          {hovered !== null && hoveredPoint && (
            <ChartHoverCard
              title={hoveredPoint.title}
              x={slotX(hovered)}
              containerWidth={W}
              rows={[
                {
                  color: INCOME_COLOR,
                  label: t("common.income_plural"),
                  value: money(hoveredPoint.income),
                },
                {
                  color: EXPENSE_COLOR,
                  label: t("common.expense_plural"),
                  value: money(hoveredPoint.expense),
                },
              ]}
            />
          )}
        </Box>
      </Box>
    </Paper>
  )
}
