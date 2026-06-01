import type { Expense, ExpensesSummary } from "@appTypes/expense"
import type { Income, IncomesSummary } from "@appTypes/income"
import { format, getDate, getDaysInMonth, type Locale, subMonths } from "date-fns"
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

/** Раскладка дохода/расхода по дням текущего месяца (период 1m). */
export function buildMonthDataset(
  expenses: Expense[],
  incomes: Income[],
  compact: boolean,
): ChartDataset {
  const daysInMonth = getDaysInMonth(new Date())
  const incomeByDay = new Array(daysInMonth).fill(0)
  const expenseByDay = new Array(daysInMonth).fill(0)

  incomes.forEach((t) => {
    const day = getDate(t.date) - 1
    if (day >= 0 && day < daysInMonth) incomeByDay[day] += t.amount
  })

  expenses.forEach((t) => {
    const day = getDate(t.date) - 1
    if (day >= 0 && day < daysInMonth) expenseByDay[day] += t.amount
  })

  const labels = Array.from({ length: daysInMonth }, (_, i) =>
    compact ? ((i + 1) % 5 === 1 || i === daysInMonth - 1 ? String(i + 1) : "") : String(i + 1),
  )

  return { income: incomeByDay, expense: expenseByDay, labels }
}

/** Раскладка дохода/расхода по последним `count` месяцам (периоды 6m/1y). */
export function buildSummaryDataset(
  expensesByMonth: ExpensesSummary["byMonth"],
  incomesByMonth: IncomesSummary["byMonth"],
  count: number,
  locale: Locale,
): ChartDataset {
  const now = new Date()
  const months = Array.from({ length: count }, (_, i) => format(subMonths(now, count - 1 - i), "yyyy-MM"))

  const expMap = Object.fromEntries(expensesByMonth.map((m) => [m.month, parseFloat(m.total)]))
  const incMap = Object.fromEntries(incomesByMonth.map((m) => [m.month, parseFloat(m.total)]))

  return {
    income: months.map((m) => incMap[m] ?? 0),
    expense: months.map((m) => expMap[m] ?? 0),
    labels: months.map((m) => {
      const [year, month] = m.split("-").map(Number)
      return format(new Date(year, month - 1, 1), "MMM", { locale })
    }),
  }
}

interface SelectDatasetParams {
  period: string
  periodCount: number
  locale: Locale
  compact: boolean
  expenses?: Expense[]
  incomes?: Income[]
  expensesSummary?: ExpensesSummary
  incomesSummary?: IncomesSummary
}

/**
 * Выбирает набор данных под текущий период: дни месяца (1m), сводка по месяцам (6m/1y)
 * или заглушка, если реальных данных ещё нет.
 */
export function selectDataset({
  period,
  periodCount,
  locale,
  compact,
  expenses,
  incomes,
  expensesSummary,
  incomesSummary,
}: SelectDatasetParams): ChartDataset {
  if (period === "1m" && expenses != null && incomes != null) {
    return buildMonthDataset(expenses, incomes, compact)
  }

  if (period !== "1m" && expensesSummary && incomesSummary) {
    return buildSummaryDataset(expensesSummary.byMonth, incomesSummary.byMonth, periodCount, locale)
  }

  const stub = stubValues[period as keyof typeof stubValues] ?? stubValues["6m"]
  return { ...stub, labels: getMonthLabels(stub.income.length, locale) }
}
