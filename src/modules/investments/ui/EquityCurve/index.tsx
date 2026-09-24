import { Paper, Text } from "@mantine/core"
import { useElementSize } from "@mantine/hooks"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { type PointerEvent, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { INCOME_COLOR } from "@/shared/config/chartColors"
import { dateFnsLocales } from "@/shared/i18n/languages.ts"
import { axisPadLeft, formatAxisValue, niceScale } from "@/shared/lib/chartScale"
import { ChartHoverCard } from "@/shared/ui/ChartHoverCard"
import type { PositionsParams } from "../../api/requests"
import { useEquityCurve } from "../../api/useEquityCurve"
import { formatPnl, formatUsd, pnlColor } from "../../lib/format"

interface Props {
  /** Journal filters (symbol/account/category/hideDust) — period (from/to) is intentionally not
   *  passed through, the curve always covers full history; status is irrelevant, the API always
   *  scopes this endpoint to closed positions. */
  params: Pick<PositionsParams, "symbol" | "accountId" | "category" | "hideDust">
}

/** Chart geometry (viewBox height and inner padding); width follows the container,
 *  the left padding fits the Y labels. */
const H = 200
const PAD_R = 12
const AXIS_FONT = 9
const PAD_T = 12
const PAD_B = 24

const ACCENT = INCOME_COLOR

interface EquityPoint {
  date: Date
  /** Cumulative closedPnl up to and including this trade, oldest → newest. */
  equity: number
  /** This trade's own closedPnl (shown in the tooltip). */
  pnl: number
}

/**
 * Equity curve: cumulative closedPnl over closed trades, oldest → newest,
 * x-spaced by trade sequence (not calendar time — trades are unevenly spaced).
 * Built from GET /investing/positions/equity-curve — every closed position matching the
 * filters, already sorted by closedAt ascending, no page cap.
 */
export function EquityCurve({ params }: Props) {
  const { t, i18n } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const { ref, width } = useElementSize()
  const [hovered, setHovered] = useState<number | null>(null)

  // Explicit allowlist, not a spread of `params` — the caller's object may still carry
  // from/to/status at runtime even though the Props type omits them; the curve must ignore them.
  const chartParams: PositionsParams = {
    symbol: params.symbol,
    accountId: params.accountId,
    category: params.category,
    hideDust: params.hideDust,
  }
  const { data } = useEquityCurve(chartParams)

  const points = useMemo<EquityPoint[]>(() => {
    let equity = 0
    return (data?.items ?? []).map((p) => {
      equity += p.closedPnl
      return { date: p.closedAt, equity, pnl: p.closedPnl }
    })
  }, [data])

  // A curve needs at least two closed trades; below that the KPI row says it all.
  if (points.length < 2) return null

  const W = width || 640

  const values = points.map((p) => p.equity)
  // Keep zero in the domain — the baseline is what gives the curve its meaning.
  const rawMin = Math.min(0, ...values)
  const rawMax = Math.max(0, ...values)
  const { min, max, ticks } = niceScale(rawMin, rawMax)
  const tickLabels = ticks.map((v) => formatAxisValue(v, i18n.language))
  const PAD_L = axisPadLeft(tickLabels, AXIS_FONT)

  const x = (i: number) => PAD_L + (i * (W - PAD_L - PAD_R)) / (points.length - 1)
  const y = (v: number) => PAD_T + ((max - v) / (max - min)) * (H - PAD_T - PAD_B)

  const linePath = points
    .map((p, i) => `${i ? "L" : "M"} ${x(i).toFixed(1)} ${y(p.equity).toFixed(1)}`)
    .join(" ")
  // Fill between the curve and the zero baseline (reads correctly on both sides of zero).
  const areaPath = `${linePath} L ${x(points.length - 1).toFixed(1)} ${y(0).toFixed(1)} L ${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`

  const slotWidth = (W - PAD_L - PAD_R) / (points.length - 1)
  // Nearest trade to the pointer — one handler for mouse and touch (tap / drag along the curve).
  const pick = (e: PointerEvent<SVGSVGElement>) => {
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left
    const i = Math.round((px - PAD_L) / slotWidth)
    setHovered(Math.min(Math.max(i, 0), points.length - 1))
  }
  const dateLabel = (p: EquityPoint) => format(p.date, "d MMM", { locale })
  // Sparse x labels: first / middle / last trade dates.
  const labelIdx = [0, Math.floor((points.length - 1) / 2), points.length - 1]

  const hoveredPoint = hovered !== null ? points[hovered] : null

  return (
    <Paper>
      <Text fw={600} size="sm" p="md" pb={0}>
        {t("investments.equity_title")}
      </Text>
      <div style={{ padding: "var(--mantine-spacing-md)" }}>
        <div ref={ref} style={{ position: "relative" }}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: "100%", height: H, display: "block", touchAction: "pan-y" }}
            role="img"
            aria-label={t("investments.equity_title")}
            onPointerMove={pick}
            onPointerDown={pick}
            // on touch, pointerleave fires right after the finger lifts — keep the card visible
            onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(null)}
          >
            <defs>
              <linearGradient id="equityG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT} stopOpacity="0.25" />
                <stop offset="100%" stopColor={ACCENT} stopOpacity="0.04" />
              </linearGradient>
            </defs>

            {ticks.map((v, k) => {
              const yy = y(v)
              return (
                <g key={v}>
                  <line
                    x1={PAD_L}
                    x2={W - PAD_R}
                    y1={yy}
                    y2={yy}
                    stroke="var(--mantine-color-default-border)"
                    strokeDasharray={v === 0 ? "0" : "2 4"}
                  />
                  <text
                    x={PAD_L - 6}
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

            {labelIdx.map((i) => (
              <text
                key={i}
                x={x(i)}
                y={H - 8}
                textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
                fontSize="10"
                fill="var(--mantine-color-dimmed)"
                fontFamily="var(--mantine-font-family-monospace)"
              >
                {dateLabel(points[i])}
              </text>
            ))}

            {hovered !== null && (
              <line
                x1={x(hovered)}
                x2={x(hovered)}
                y1={PAD_T}
                y2={H - PAD_B}
                stroke="var(--mantine-color-default-border)"
              />
            )}

            <path d={areaPath} fill="url(#equityG)" />
            <path d={linePath} stroke={ACCENT} strokeWidth="2" fill="none" />

            {hoveredPoint && hovered !== null && (
              <circle
                cx={x(hovered)}
                cy={y(hoveredPoint.equity)}
                r="4"
                fill="var(--mantine-color-body)"
                stroke={ACCENT}
                strokeWidth="2"
              />
            )}
          </svg>

          {hoveredPoint && hovered !== null && (
            <ChartHoverCard
              title={format(hoveredPoint.date, "d MMM yyyy, HH:mm", { locale })}
              x={x(hovered)}
              containerWidth={W}
              rows={[
                {
                  label: t("investments.kpi_pnl"),
                  value: formatUsd(hoveredPoint.equity, i18n.language),
                  valueColor: pnlColor(hoveredPoint.equity),
                },
                {
                  label: "PnL",
                  value: formatPnl(hoveredPoint.pnl, i18n.language),
                  valueColor: pnlColor(hoveredPoint.pnl),
                },
              ]}
            />
          )}
        </div>
      </div>
    </Paper>
  )
}
