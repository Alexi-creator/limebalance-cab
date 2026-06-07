import type { ExpensesSummary } from "@appTypes/expense"
import type { IncomesSummary } from "@appTypes/income"
import { format, type Locale, parseISO, subMonths } from "date-fns"
import { stubValues } from "./config"

/** Готовый набор данных для отрисовки: ряды дохода/расхода и подписи оси X. */
export interface ChartDataset {
  income: number[]
  expense: number[]
  labels: string[]
}

/** Короткие названия последних `count` месяцев (для заглушек). */
export function getMonthLabels(count: number, locale: Locale): string[] {
  const now = new Date()
  return Array.from({ length: count }, (_, i) =>
    format(subMonths(now, count - 1 - i), "MMM", { locale }),
  )
}

/** Подпись бакета оси: месяц (`YYYY-MM`) — короткое имя месяца, день — число месяца. */
function bucketLabel(
  bucket: string,
  monthly: boolean,
  locale: Locale,
  compact: boolean,
  index: number,
  count: number,
): string {
  if (monthly) {
    const [year, month] = bucket.split("-").map(Number)
    return format(new Date(year, month - 1, 1), "MMM", { locale })
  }
  const day = parseISO(bucket).getDate()
  // в компактном режиме (узкий экран) подписываем каждый 5-й бакет и последний
  if (compact && index % 5 !== 0 && index !== count - 1) return ""
  return String(day)
}

/**
 * Собирает набор для графика из бакетов сводок дохода/расхода. Мерж по `bucket`;
 * пустые бакеты (бэк отдаёт их с `approxTotal: null`) рисуем как 0. Суммы — в базовой
 * валюте пользователя (`approxTotal`).
 */
export function buildBucketDataset(
  expensesSummary: ExpensesSummary,
  incomesSummary: IncomesSummary,
  locale: Locale,
  compact: boolean,
): ChartDataset {
  const monthly = (expensesSummary.granularity ?? incomesSummary.granularity) === "month"
  const expMap = new Map(expensesSummary.buckets.map((b) => [b.bucket, b.approxTotal ?? 0]))
  const incMap = new Map(incomesSummary.buckets.map((b) => [b.bucket, b.approxTotal ?? 0]))
  // объединяем ключи бакетов обоих рядов (на случай расхождений) и сортируем по дате
  const keys = [...new Set([...expMap.keys(), ...incMap.keys()])].sort()

  return {
    income: keys.map((k) => incMap.get(k) ?? 0),
    expense: keys.map((k) => expMap.get(k) ?? 0),
    labels: keys.map((k, i) => bucketLabel(k, monthly, locale, compact, i, keys.length)),
  }
}

interface SelectDatasetParams {
  period: string
  locale: Locale
  compact: boolean
  expensesSummary?: ExpensesSummary
  incomesSummary?: IncomesSummary
}

/**
 * Выбирает набор данных под текущий период из сводок; пока данных нет (загрузка) —
 * показывает заглушку, чтобы график не схлопывался.
 */
export function selectDataset({
  period,
  locale,
  compact,
  expensesSummary,
  incomesSummary,
}: SelectDatasetParams): ChartDataset {
  if (expensesSummary && incomesSummary) {
    return buildBucketDataset(expensesSummary, incomesSummary, locale, compact)
  }

  const stub = stubValues[period as keyof typeof stubValues] ?? stubValues["6m"]
  return { ...stub, labels: getMonthLabels(stub.income.length, locale) }
}
