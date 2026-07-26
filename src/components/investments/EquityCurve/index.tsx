import { getEquityCurve, type PositionsParams } from "@api/investing"
import { formatPnl, formatUsd, pnlColor } from "@components/investments/format"
import { INCOME_COLOR } from "@constants/chartColors"
import { investingKeys, POSITIONS_STALE_TIME } from "@constants/queries/investing"
import { dateFnsLocales } from "@i18n/languages.ts"
import { Paper, Text } from "@mantine/core"
import { useElementSize } from "@mantine/hooks"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

interface Props {
  /** Journal filters (symbol/account/category) — period (from/to) is intentionally not passed
   *  through, the curve always covers full history; status is irrelevant, the API always
   *  scopes this endpoint to closed positions. */
  params: Pick<PositionsParams, "symbol" | "accountId" | "category">
}

/** Chart geometry (viewBox height and inner padding); width follows the container. */
const H = 200
const PAD_L = 46
const PAD_R = 12
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
  }
  const { data } = useQuery({
    queryKey: investingKeys.equityCurve(chartParams),
    queryFn: () => getEquityCurve(chartParams),
    staleTime: POSITIONS_STALE_TIME,
  })

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
  const span = rawMax - rawMin || 1
  const min = rawMin - span * 0.08
  const max = rawMax + span * 0.08

  const x = (i: number) => PAD_L + (i * (W - PAD_L - PAD_R)) / (points.length - 1)
  const y = (v: number) => PAD_T + ((max - v) / (max - min)) * (H - PAD_T - PAD_B)

  const linePath = points
    .map((p, i) => `${i ? "L" : "M"} ${x(i).toFixed(1)} ${y(p.equity).toFixed(1)}`)
    .join(" ")
  // Fill between the curve and the zero baseline (reads correctly on both sides of zero).
  const areaPath = `${linePath} L ${x(points.length - 1).toFixed(1)} ${y(0).toFixed(1)} L ${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`

  const slotWidth = (W - PAD_L - PAD_R) / (points.length - 1)
  const gridFracs = [0, 0.5, 1]
  const dateLabel = (p: EquityPoint) => format(p.date, "d MMM", { locale })
  // Sparse x labels: first / middle / last trade dates.
  const labelIdx = [0, Math.floor((points.length - 1) / 2), points.length - 1]

  const hoveredPoint = hovered !== null ? points[hovered] : null

  return (
    <Paper>
      <Text fw={600} size="sm" p="md" pb={0}>
        {t("investments.equity_title")}
      </Text>
      <div ref={ref} style={{ padding: "var(--mantine-spacing-md)" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: H, display: "block" }}
          role="img"
          aria-label={t("investments.equity_title")}
          onMouseLeave={() => setHovered(null)}
        >
          <title>{t("investments.equity_title")}</title>
          <defs>
            <linearGradient id="equityG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity="0.25" />
              <stop offset="100%" stopColor={ACCENT} stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {gridFracs.map((frac) => {
            const yy = PAD_T + (H - PAD_T - PAD_B) * frac
            return (
              <g key={frac}>
                <line
                  x1={PAD_L}
                  x2={W - PAD_R}
                  y1={yy}
                  y2={yy}
                  stroke="var(--mantine-color-default-border)"
                  strokeDasharray="2 4"
                />
                <text
                  x={PAD_L - 6}
                  y={yy + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="var(--mantine-color-dimmed)"
                  fontFamily="var(--mantine-font-family-monospace)"
                >
                  {Math.round(max - (max - min) * frac)}
                </text>
              </g>
            )
          })}

          {/* Zero baseline — solid, unlike the dashed value grid. */}
          {min < 0 && (
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y(0)}
              y2={y(0)}
              stroke="var(--mantine-color-default-border)"
            />
          )}

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

          {points.map((p, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length chart points, no reordering
            // biome-ignore lint/a11y/noStaticElementInteractions: SVG hit zone for chart hover
            <g key={i} onMouseEnter={() => setHovered(i)}>
              <rect
                x={x(i) - slotWidth / 2}
                y={PAD_T}
                width={slotWidth}
                height={H - PAD_T - PAD_B}
                fill="transparent"
              />
              {hovered === i && (
                <circle
                  cx={x(i)}
                  cy={y(p.equity)}
                  r="4"
                  fill="var(--mantine-color-body)"
                  stroke={ACCENT}
                  strokeWidth="2"
                />
              )}
            </g>
          ))}
        </svg>

        {/* HTML tooltip under the cursor column — avoids SVG text clipping at the edges. */}
        <div style={{ minHeight: 22 }}>
          {hoveredPoint && (
            <Text ff="monospace" size="xs" c="dimmed" ta="center">
              {format(hoveredPoint.date, "d MMM yyyy HH:mm", { locale })} ·{" "}
              <Text component="span" c={pnlColor(hoveredPoint.equity)} inherit>
                {formatUsd(hoveredPoint.equity, i18n.language)}
              </Text>{" "}
              · PnL{" "}
              <Text component="span" c={pnlColor(hoveredPoint.pnl)} inherit>
                {formatPnl(hoveredPoint.pnl, i18n.language)}
              </Text>
            </Text>
          )}
        </div>
      </div>
    </Paper>
  )
}
