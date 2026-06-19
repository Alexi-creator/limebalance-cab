import { EXPENSE_COLOR, INCOME_COLOR } from "@constants/chartColors"

/** Line colors: income (green) and expense (red). */
export const ACCENT = INCOME_COLOR
export const NEG = EXPENSE_COLOR

/** Geometry of the chart's SVG area (viewBox and inner padding). */
export const CHART = {
  W: 640,
  H: 240,
  PAD_L: 30,
  PAD_R: 10,
  PAD_T: 10,
  PAD_B: 30,
} as const

/** Available toggle periods; `labelKey` — the translation key for the label. */
export const PERIODS = [
  { value: "1m", labelKey: "chart.period_1m" },
  { value: "6m", labelKey: "chart.period_6m" },
  { value: "1y", labelKey: "chart.period_1y" },
] as const

/** Stub values for the 6m/1y periods when there is no real summary. */
export const stubValues = {
  "6m": {
    income: [180, 196, 210, 218, 245, 280],
    expense: [120, 138, 140, 148, 160, 180],
  },
  "1y": {
    income: [180, 196, 188, 210, 224, 232, 218, 245, 258, 242, 280, 310],
    expense: [120, 138, 128, 140, 156, 152, 148, 160, 172, 165, 180, 188],
  },
}
