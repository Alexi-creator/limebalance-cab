import type { Expense, ExpensesSummary } from "@appTypes/expense"
import type { Income, IncomesSummary } from "@appTypes/income"
import { COLOR_PALETTE, EMOJI_PALETTE } from "@components/categories/config"
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  subMonths,
  subQuarters,
  subWeeks,
  subYears,
} from "date-fns"
import { ru } from "date-fns/locale"
import type { AnalyticsPeriod } from "./config"

/** Любая операция (доход или расход) — нужны только сумма, дата и категория. */
type Op = Expense | Income

const WEEK_OPTS = { weekStartsOn: 1 as const }

/** Гранулярность баров временного ряда под выбранный период. */
type Granularity = "day" | "week" | "month"

const GRANULARITY: Record<AnalyticsPeriod, Granularity> = {
  week: "day",
  month: "week",
  quarter: "month",
  year: "month",
}

export interface AnalyticsRange {
  from: Date
  to: Date
  prevFrom: Date
  prevTo: Date
}

/** Текущий и предыдущий интервал для выбранного периода относительно `now`. */
export function periodToRange(period: AnalyticsPeriod, now: Date = new Date()): AnalyticsRange {
  switch (period) {
    case "week": {
      // текущая неделя: с понедельника по сегодня включительно (не до будущего воскресенья)
      return {
        from: startOfWeek(now, WEEK_OPTS),
        to: now,
        // прошлая неделя за тот же отрезок (пн .. тот же день недели) — для честного сравнения
        prevFrom: startOfWeek(subWeeks(now, 1), WEEK_OPTS),
        prevTo: subWeeks(now, 1),
      }
    }
    case "quarter": {
      const prev = subQuarters(now, 1)
      return {
        from: startOfQuarter(now),
        to: endOfQuarter(now),
        prevFrom: startOfQuarter(prev),
        prevTo: endOfQuarter(prev),
      }
    }
    case "year": {
      const prev = subYears(now, 1)
      return {
        from: startOfYear(now),
        to: endOfYear(now),
        prevFrom: startOfYear(prev),
        prevTo: endOfYear(prev),
      }
    }
    default: {
      const prev = subMonths(now, 1)
      return {
        from: startOfMonth(now),
        to: endOfMonth(now),
        prevFrom: startOfMonth(prev),
        prevTo: endOfMonth(prev),
      }
    }
  }
}

/** Сумма операций. */
const sum = (ops: Op[]) => ops.reduce((s, o) => s + o.amount, 0)

/** Денежная сумма в формате страниц («1 234 ₽»). */
export function formatRub(n: number): string {
  return `${Math.round(n).toLocaleString("ru-RU")} ₽`
}

/** Изменение в процентах относительно прошлого периода; `undefined` если базы нет (нет badge). */
function pctChange(cur: number, prev: number): number | undefined {
  if (prev === 0) return undefined
  return Math.round(((cur - prev) / prev) * 100)
}

export interface Metrics {
  income: number
  expense: number
  saved: number
  savingsRate: number
  incomeTrend?: number
  expenseTrend?: number
  savedTrend?: number
  rateTrend?: number
}

/** Метрики и тренды из сырых income/expense (в валюте операций; без конвертации). */
function metricsFrom(
  income: number,
  expense: number,
  prevIncome: number,
  prevExpense: number,
): Metrics {
  const saved = income - expense
  const prevSaved = prevIncome - prevExpense
  const savingsRate = income > 0 ? Math.round((saved / income) * 100) : 0
  const prevRate = prevIncome > 0 ? Math.round((prevSaved / prevIncome) * 100) : 0

  return {
    income,
    expense,
    saved,
    savingsRate,
    incomeTrend: pctChange(income, prevIncome),
    expenseTrend: pctChange(expense, prevExpense),
    savedTrend: pctChange(saved, prevSaved),
    rateTrend: prevIncome > 0 ? savingsRate - prevRate : undefined,
  }
}

/** Сумма `approxTotal` (базовая валюта) по месяцам сводки, попадающим в `[from, to]`. */
function sumMonthsInRange(byMonth: ExpensesSummary["byMonth"], from: Date, to: Date): number {
  const fromKey = format(from, "yyyy-MM")
  const toKey = format(to, "yyyy-MM")
  return byMonth
    .filter((m) => m.month >= fromKey && m.month <= toKey)
    .reduce((s, m) => s + (m.approxTotal ?? 0), 0)
}

/**
 * KPI-метрики периода в базовой валюте — из помесячных сводок `/expenses|incomes/summary`.
 * Берём месяцы, попадающие в текущий и прошлый интервал периода. Гранулярность — месяц,
 * поэтому для недельного периода значения приблизительны (учитывается весь месяц).
 */
export function computeMetricsFromSummary(
  expSummary: ExpensesSummary | undefined,
  incSummary: IncomesSummary | undefined,
  range: AnalyticsRange,
): Metrics {
  const exp = expSummary?.byMonth ?? []
  const inc = incSummary?.byMonth ?? []
  return metricsFrom(
    sumMonthsInRange(inc, range.from, range.to),
    sumMonthsInRange(exp, range.from, range.to),
    sumMonthsInRange(inc, range.prevFrom, range.prevTo),
    sumMonthsInRange(exp, range.prevFrom, range.prevTo),
  )
}

/** KPI-метрики периода из сырых списков (в валюте операций; без конвертации). */
export function computeMetrics(expCur: Op[], incCur: Op[], expPrev: Op[], incPrev: Op[]): Metrics {
  return metricsFrom(sum(incCur), sum(expCur), sum(incPrev), sum(expPrev))
}

export interface SeriesPoint {
  label: string
  income: number
  expense: number
}

/** Ключ бакета операции под гранулярность. */
function bucketKey(date: Date, g: Granularity): string {
  if (g === "month") return format(date, "yyyy-MM")
  if (g === "week") return format(startOfWeek(date, WEEK_OPTS), "yyyy-MM-dd")
  return format(date, "yyyy-MM-dd")
}

/** Подпись бакета для оси. */
function bucketLabel(date: Date, g: Granularity): string {
  if (g === "month") return format(date, "LLL", { locale: ru })
  if (g === "week") return format(date, "d.MM")
  return format(date, "EEEEEE", { locale: ru })
}

/** Временной ряд доходов/расходов по бакетам внутри `[from, to]`. */
export function buildSeries(
  expCur: Op[],
  incCur: Op[],
  range: AnalyticsRange,
  period: AnalyticsPeriod,
): SeriesPoint[] {
  const g = GRANULARITY[period]
  const interval = { start: range.from, end: range.to }
  const starts =
    g === "month"
      ? eachMonthOfInterval(interval)
      : g === "week"
        ? eachWeekOfInterval(interval, WEEK_OPTS)
        : eachDayOfInterval(interval)

  const incomeByKey = new Map<string, number>()
  const expenseByKey = new Map<string, number>()
  for (const o of incCur) {
    const k = bucketKey(o.date, g)
    incomeByKey.set(k, (incomeByKey.get(k) ?? 0) + o.amount)
  }
  for (const o of expCur) {
    const k = bucketKey(o.date, g)
    expenseByKey.set(k, (expenseByKey.get(k) ?? 0) + o.amount)
  }

  return starts.map((start) => {
    const k = bucketKey(start, g)
    return {
      label: bucketLabel(start, g),
      income: incomeByKey.get(k) ?? 0,
      expense: expenseByKey.get(k) ?? 0,
    }
  })
}

export interface CategorySlice {
  id: string
  name: string
  icon: string
  color: string
  total: number
  count: number
  pct: number
}

/** Группировка расходов по категориям (для доната), отсортировано по убыванию суммы. */
export function groupByCategory(ops: Op[]): CategorySlice[] {
  const acc = new Map<
    string,
    { name: string; emoji?: string | null; total: number; count: number }
  >()
  for (const o of ops) {
    const c = o.category
    const cur = acc.get(c.id) ?? { name: c.name, emoji: c.emoji, total: 0, count: 0 }
    cur.total += o.amount
    cur.count += 1
    acc.set(c.id, cur)
  }

  const total = sum(ops)
  return [...acc.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.total - a.total)
    .map((v, i) => ({
      id: v.id,
      name: v.name,
      icon: v.emoji || EMOJI_PALETTE[i % EMOJI_PALETTE.length],
      color: COLOR_PALETTE[i % COLOR_PALETTE.length],
      total: v.total,
      count: v.count,
      pct: total > 0 ? Math.round((v.total / total) * 100) : 0,
    }))
}

export interface CategoryDelta {
  id: string
  name: string
  cur: number
  prev: number
  delta: number
  pct?: number
}

/** Сравнение расходов по категориям с прошлым периодом, по убыванию модуля изменения. */
export function compareCategories(cur: Op[], prev: Op[], limit: number): CategoryDelta[] {
  const totals = new Map<string, { name: string; cur: number; prev: number }>()
  const add = (ops: Op[], key: "cur" | "prev") => {
    for (const o of ops) {
      const row = totals.get(o.category.id) ?? { name: o.category.name, cur: 0, prev: 0 }
      row[key] += o.amount
      totals.set(o.category.id, row)
    }
  }
  add(cur, "cur")
  add(prev, "prev")

  return [...totals.entries()]
    .map(([id, v]) => ({ id, name: v.name, cur: v.cur, prev: v.prev, delta: v.cur - v.prev }))
    .filter((r) => r.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, limit)
    .map((r) => ({ ...r, pct: r.prev > 0 ? Math.round((r.delta / r.prev) * 100) : undefined }))
}
