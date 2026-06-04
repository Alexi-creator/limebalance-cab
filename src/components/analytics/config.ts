import { z } from "zod"

/** Периоды аналитики. Значение хранится в URL (`?period=`), порядок = порядок в переключателе. */
export const ANALYTICS_PERIODS = [
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
  { value: "quarter", label: "Квартал" },
  { value: "year", label: "Год" },
] as const

export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number]["value"]

/** Сколько строк сравнения показываем (топ по модулю изменения). */
export const COMPARISON_LIMIT = 8

/**
 * Схема URL-параметров страницы аналитики. `.catch()`/`.default()` гарантируют, что
 * `useUrlParams` не упадёт на кривом `?period=` в ссылке.
 */
export const analyticsParamsSchema = z.object({
  period: z.enum(["week", "month", "quarter", "year"]).catch("month").default("month"),
})

export type AnalyticsParams = z.infer<typeof analyticsParamsSchema>
