import { useTranslation } from "react-i18next"
import { ACCENT, CHART, NEG } from "./config"
import type { ChartDataset } from "./helpers"

interface Props {
  /** Данные для отрисовки (ряды дохода/расхода и подписи). */
  data: ChartDataset
  /** Текущий период (влияет на подпись тултипа). */
  period: string
  /** Индекс точки под курсором или `null`. */
  hoveredIndex: number | null
  /** Колбэк наведения/ухода с точки. */
  onHover: (index: number | null) => void
}

const { W, H, PAD_L, PAD_R, PAD_T, PAD_B } = CHART

/**
 * SVG-отрисовка графика денежного потока: сетка, область дохода, линии дохода/расхода,
 * точки и интерактивный тултип. Вся геометрия и пути считаются здесь.
 */
export function CashflowSvg({ data, period, hoveredIndex, onHover }: Props) {
  const { t } = useTranslation()

  const max = Math.max(...data.income, ...data.expense) * 1.1 || 1
  const slots = Math.max(data.income.length - 1, 1)
  const slotWidth = (W - PAD_L - PAD_R) / slots
  const x = (i: number) => PAD_L + i * slotWidth
  const y = (v: number) => H - PAD_B - (v / max) * (H - PAD_B - PAD_T)

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

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: 240, display: "block" }}
      role="img"
      aria-label={t("chart.cashflow_title")}
      onMouseLeave={() => onHover(null)}
    >
      <title>{t("chart.cashflow_title")}</title>
      <defs>
        <linearGradient id="ovIn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.32" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
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
        const hx = x(i)
        const hy = y(v)
        const isHovered = hoveredIndex === i
        const tooltipLabel = period === "1m" ? `${t("chart.day")} ${i + 1}` : data.labels[i]
        const tooltipX = hx > W - 100 ? hx - 98 : hx < 50 ? hx + 8 : hx - 45
        const tooltipY = hy < 65 ? hy + 8 : hy - 62

        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length chart points, no reordering
          // biome-ignore lint/a11y/noStaticElementInteractions: SVG hit zone for chart hover
          <g key={i} onMouseEnter={() => onHover(i)}>
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
              stroke={ACCENT}
              strokeWidth="2"
            />
            {isHovered && (
              <circle
                cx={hx}
                cy={y(data.expense[i])}
                r="4"
                fill="var(--mantine-color-body)"
                stroke={NEG}
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
              {data.labels[i]}
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
                  fill={ACCENT}
                  fontFamily="var(--mantine-font-family-monospace)"
                >
                  +{Math.round(v)}
                </text>
                <text
                  x="8"
                  y="45"
                  fontSize="10"
                  fill={NEG}
                  fontFamily="var(--mantine-font-family-monospace)"
                >
                  −{Math.round(data.expense[i])}
                </text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}
