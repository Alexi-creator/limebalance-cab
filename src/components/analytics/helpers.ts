import type { CategoryStats } from "@appTypes/category"
import type { ExpensesSummary, SummaryGranularity } from "@appTypes/expense"
import type { IncomesSummary } from "@appTypes/income"
import { COLOR_PALETTE, EMOJI_PALETTE } from "@components/categories/config"
import {
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  parseISO,
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

const WEEK_OPTS = { weekStartsOn: 1 as const }

/**
 * Гранулярность бакетов временного ряда под период (передаётся в `/summary`):
 * неделя/месяц — по дням, квартал — по неделям, год — по месяцам.
 */
export const GRANULARITY: Record<AnalyticsPeriod, SummaryGranularity> = {
  week: "day",
  month: "day",
  quarter: "week",
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

/** Метрики и тренды из итогов дохода/расхода (в базовой валюте). */
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

/**
 * KPI-метрики периода в базовой валюте — из итогов `total` сводок `/summary` за
 * текущий и прошлый интервалы (бэк уже привёл всё к базовой валюте). null → 0.
 */
export function computeMetricsFromSummaries(
  expCur: ExpensesSummary | undefined,
  incCur: IncomesSummary | undefined,
  expPrev: ExpensesSummary | undefined,
  incPrev: IncomesSummary | undefined,
): Metrics {
  return metricsFrom(
    incCur?.total ?? 0,
    expCur?.total ?? 0,
    incPrev?.total ?? 0,
    expPrev?.total ?? 0,
  )
}

export interface SeriesPoint {
  label: string
  income: number
  expense: number
}

/** Подпись бакета под гранулярность. Для дней при длинном ряде подписи прореживаем. */
function bucketLabel(
  bucket: string,
  granularity: SummaryGranularity,
  index: number,
  count: number,
): string {
  if (granularity === "month") {
    const [year, month] = bucket.split("-").map(Number)
    return format(new Date(year, month - 1, 1), "LLL", { locale: ru })
  }
  if (granularity === "week") return format(parseISO(bucket), "d.MM")
  // day: при >14 точках подписываем каждую 5-ю и последнюю, иначе все
  if (count > 14 && index % 5 !== 0 && index !== count - 1) return ""
  return String(parseISO(bucket).getDate())
}

/**
 * Временной ряд доходов/расходов из бакетов сводок: мерж по `bucket`, пустые бакеты
 * (`approxTotal: null`) — как 0. Суммы в базовой валюте (`approxTotal`).
 */
export function buildSeries(
  expSummary: ExpensesSummary | undefined,
  incSummary: IncomesSummary | undefined,
): SeriesPoint[] {
  const granularity = expSummary?.granularity ?? incSummary?.granularity ?? "month"
  const expMap = new Map((expSummary?.buckets ?? []).map((b) => [b.bucket, b.approxTotal ?? 0]))
  const incMap = new Map((incSummary?.buckets ?? []).map((b) => [b.bucket, b.approxTotal ?? 0]))
  const keys = [...new Set([...expMap.keys(), ...incMap.keys()])].sort()

  return keys.map((k, i) => ({
    label: bucketLabel(k, granularity, i, keys.length),
    income: incMap.get(k) ?? 0,
    expense: expMap.get(k) ?? 0,
  }))
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

/**
 * Срезы пирога по категориям расходов из `/stats`: сумма категории — `approxTotal`
 * (базовая валюта). Категории без суммы отбрасываем; сортируем по убыванию суммы.
 */
export function groupByCategory(stats: CategoryStats[]): CategorySlice[] {
  const rows = stats
    .map((s) => ({
      id: s.id,
      name: s.name,
      emoji: s.emoji,
      total: s.approxTotal ?? 0,
      count: s.count,
    }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)

  const total = rows.reduce((s, r) => s + r.total, 0)
  return rows.map((v, i) => ({
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

/**
 * Сравнение расходов по категориям с прошлым периодом из `/stats` (когда переданы
 * `compareFrom`/`compareTo`): `approxTotal` — текущий, `previousApproxTotal` — прошлый,
 * `deltaApproxTotal` — разница. По убыванию модуля изменения.
 */
export function compareCategories(stats: CategoryStats[], limit: number): CategoryDelta[] {
  return stats
    .map((s) => {
      const cur = s.approxTotal ?? 0
      const prev = s.previousApproxTotal ?? 0
      const delta = s.deltaApproxTotal ?? cur - prev
      return { id: s.id, name: s.name, cur, prev, delta }
    })
    .filter((r) => r.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, limit)
    .map((r) => ({ ...r, pct: r.prev > 0 ? Math.round((r.delta / r.prev) * 100) : undefined }))
}
