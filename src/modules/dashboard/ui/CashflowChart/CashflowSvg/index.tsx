import { useElementSize } from "@mantine/hooks"
import type { PointerEvent } from "react"
import { useTranslation } from "react-i18next"
import { axisPadLeft, formatAxisValue, niceScale, xLabelStep } from "@/shared/lib/chartScale"
import { formatCurrency } from "@/shared/lib/formatCurrency"
import { ChartHoverCard } from "@/shared/ui/ChartHoverCard"
import { ACCENT, CHART, NEG } from "../config"
import type { ChartDataset } from "../helpers"

interface Props {
  /** Data to render (income/expense series and labels). */
  data: ChartDataset
  /** User's base currency — the series amounts come in it. */
  baseCurrency?: string
  /** Index of the point under the cursor or `null`. */
  hoveredIndex: number | null
  /** Callback for hovering/leaving a point. */
  onHover: (index: number | null) => void
}

const { H, PAD_R, PAD_T, PAD_B } = CHART
const AXIS_FONT = 9
const X_FONT = 10

/**
 * SVG rendering of the cash flow chart: grid, income area, income/expense lines,
 * points, and a hover card with the exact date and amounts. All geometry and paths are
 * computed here. The viewBox width follows the real container width so that SVG units map
 * 1:1 to pixels — otherwise circles and text get stretched non-uniformly.
 */
export function CashflowSvg({ data, baseCurrency, hoveredIndex, onHover }: Props) {
  const { t, i18n } = useTranslation()
  const { ref, width } = useElementSize()
  const W = width || CHART.W

  const scale = niceScale(0, Math.max(...data.income, ...data.expense, 0))
  const tickLabels = scale.ticks.map((v) => formatAxisValue(v, i18n.language))
  const PAD_L = axisPadLeft(tickLabels, AXIS_FONT)

  const slots = Math.max(data.income.length - 1, 1)
  const slotWidth = (W - PAD_L - PAD_R) / slots
  const x = (i: number) => PAD_L + i * slotWidth
  const y = (v: number) => H - PAD_B - (v / scale.max) * (H - PAD_B - PAD_T)
  // day labels come pre-thinned from the helpers; month labels are thinned here by width
  const labelStep = data.labels.some((l) => !l) ? 1 : xLabelStep(data.labels, slotWidth, X_FONT)

  const linePath = (arr: number[]) =>
    arr
      .map((v, i) => {
        if (v === 0) return `M ${x(i).toFixed(1)} ${y(0).toFixed(1)}`
        const prevZero = i === 0 || arr[i - 1] === 0
        const nextZero = i === arr.length - 1 || arr[i + 1] === 0
        if (prevZero && nextZero)
          return `M ${x(i).toFixed(1)} ${(H - PAD_B).toFixed(1)} L ${x(i).toFixed(1)} ${y(v).toFixed(1)}`
        if (prevZero) return `M ${x(i).toFixed(1)} ${y(v).toFixed(1)}`
        return `L ${x(i).toFixed(1)} ${y(v).toFixed(1)}`
      })
      .join(" ")

  const areaPath = (arr: number[]) => {
    let path = ""
    let segStart: number | null = null
    arr.forEach((v, i) => {
      if (v > 0) {
        if (segStart === null) {
          path += `M ${x(i).toFixed(1)} ${H - PAD_B} L ${x(i).toFixed(1)} ${y(v).toFixed(1)} `
          segStart = i
        } else {
          path += `L ${x(i).toFixed(1)} ${y(v).toFixed(1)} `
        }
      } else if (segStart !== null) {
        path += `L ${x(i - 1).toFixed(1)} ${H - PAD_B} Z `
        segStart = null
      }
    })
    if (segStart !== null) {
      const last = arr.reduce((li, v, i) => (v > 0 ? i : li), 0)
      path += `L ${x(last).toFixed(1)} ${H - PAD_B} Z`
    }
    return path
  }

  // Nearest point to the pointer — one handler for mouse and touch (tap / drag along the chart).
  const pick = (e: PointerEvent<SVGSVGElement>) => {
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left
    const i = Math.round((px - PAD_L) / slotWidth)
    onHover(Math.min(Math.max(i, 0), data.income.length - 1))
  }

  const signed = (sign: string, n: number) =>
    `${n > 0 ? sign : ""}${formatCurrency(n, i18n.language, baseCurrency)}`

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: H, display: "block", touchAction: "pan-y" }}
        role="img"
        aria-label={t("chart.cashflow_title")}
        onPointerMove={pick}
        onPointerDown={pick}
        // on touch, pointerleave fires right after the finger lifts — keep the card visible
        onPointerLeave={(e) => e.pointerType === "mouse" && onHover(null)}
      >
        <defs>
          <linearGradient id="ovIn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.32" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </linearGradient>
        </defs>

        {scale.ticks.map((v, k) => {
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

        <path d={areaPath(data.income)} fill="url(#ovIn)" />
        <path
          d={linePath(data.expense)}
          stroke={NEG}
          strokeWidth="1.5"
          fill="none"
          opacity="0.7"
          strokeDasharray="3 3"
        />
        <path d={linePath(data.income)} stroke={ACCENT} strokeWidth="2" fill="none" />

        {data.income.map((v: number, i: number) => {
          const isHovered = hoveredIndex === i
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length chart points, no reordering
            <g key={i}>
              <circle
                cx={x(i)}
                cy={y(v)}
                r={isHovered ? 4 : 3}
                fill="var(--mantine-color-body)"
                stroke={ACCENT}
                strokeWidth="2"
              />
              {isHovered && (
                <circle
                  cx={x(i)}
                  cy={y(data.expense[i])}
                  r="4"
                  fill="var(--mantine-color-body)"
                  stroke={NEG}
                  strokeWidth="2"
                />
              )}
              {i % labelStep === 0 && (
                <text
                  x={x(i)}
                  y={H - 10}
                  textAnchor="middle"
                  fontSize={X_FONT}
                  fill="var(--mantine-color-dimmed)"
                  fontFamily="var(--mantine-font-family-monospace)"
                >
                  {data.labels[i]}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {hoveredIndex !== null && hoveredIndex < data.income.length && (
        <ChartHoverCard
          title={data.titles[hoveredIndex]}
          x={x(hoveredIndex)}
          containerWidth={W}
          rows={[
            {
              color: ACCENT,
              label: t("chart.income"),
              value: signed("+", data.income[hoveredIndex]),
            },
            {
              color: NEG,
              label: t("chart.expense"),
              value: signed("−", data.expense[hoveredIndex]),
            },
          ]}
        />
      )}
    </div>
  )
}
