import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { useState } from "react"
import { expenseCategoryKeys, incomeCategoryKeys } from "@/modules/categories/api/queries"
import {
  getExpenseCategoriesStats,
  getIncomeCategoriesStats,
} from "@/modules/categories/api/requests"
import { COLOR_PALETTE, EMOJI_PALETTE } from "@/modules/categories/config"
import {
  EXPENSE_STALE_TIME,
  expenseSummaryKeys,
  INCOME_STALE_TIME,
  incomeSummaryKeys,
} from "../api/queries"
import { getExpensesStat, getIncomesStat } from "../api/requests"
import type { AnalyticsRange } from "../lib/helpers"
import type { DetailedStat, StatItem } from "../model"

const key = (d: Date) => format(d, "yyyy-MM-dd")

export type StatKind = "expense" | "income"

/** A category of the period with its presentation: color, emoji fallback and share. */
export interface BreakdownRow {
  key: string
  name: string
  emoji: string
  color: string
  /** Total in the base currency; null if exchange rates are unavailable. */
  total: number | null
  /** Share of the period total, 0..100; null when the total is unknown. */
  pct: number | null
  /** Same category in the previous period (base currency); null — no comparison data. */
  prev: number | null
  /** Change vs the previous period in %, rounded; null when there was nothing to compare to. */
  deltaPct: number | null
  items: StatItem[]
}

/** Change in % between two totals; null when the previous one is empty (a "new" category). */
function changePct(cur: number, prev: number | null): number | null {
  return prev ? Math.round(((cur - prev) / prev) * 100) : null
}

/**
 * Category breakdown of the period from `/stat`, shared by the donut and the details list so
 * they always show the same numbers and colors: the expense/income switch, the hovered
 * category (highlighted in both) and the categories opened in the list live here.
 * The comparison with the previous period comes from `/stats` (matched by category name);
 * categories that had money last period but none now are appended with a zero total, so a
 * drop to nothing is still visible.
 */
export function useCategoryBreakdown({ from, to, prevFrom, prevTo }: AnalyticsRange) {
  const [kind, setKindState] = useState<StatKind>("expense")
  const [opened, setOpened] = useState<string[]>([])
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const isExpense = kind === "expense"
  const { data, isLoading, isError } = useQuery<DetailedStat>({
    queryKey: isExpense
      ? expenseSummaryKeys.stat(key(from), key(to))
      : incomeSummaryKeys.stat(key(from), key(to)),
    queryFn: () => (isExpense ? getExpensesStat(from, to) : getIncomesStat(from, to)),
    staleTime: isExpense ? EXPENSE_STALE_TIME : INCOME_STALE_TIME,
  })
  const statsKey = [key(from), key(to), key(prevFrom), key(prevTo)] as const
  const { data: stats } = useQuery({
    queryKey: isExpense
      ? expenseCategoryKeys.statsRange(...statsKey)
      : incomeCategoryKeys.statsRange(...statsKey),
    queryFn: () =>
      isExpense
        ? getExpenseCategoriesStats(from, to, prevFrom, prevTo)
        : getIncomeCategoriesStats(from, to, prevFrom, prevTo),
    staleTime: isExpense ? EXPENSE_STALE_TIME : INCOME_STALE_TIME,
  })
  const prevByName = new Map((stats ?? []).map((s) => [s.name, s.previousApproxTotal ?? 0]))

  // categories by descending total (base currency); without exchange rates (null) — at the end
  const sorted = [...(data?.categories ?? [])].sort((a, b) => (b.total ?? -1) - (a.total ?? -1))
  const sum = sorted.reduce((acc, c) => acc + (c.total ?? 0), 0)
  const current = new Set(sorted.map((c) => c.category))
  const rows: BreakdownRow[] = sorted.map((c, i) => {
    const prev = stats ? (prevByName.get(c.category) ?? 0) : null
    return {
      key: c.category,
      name: c.category,
      emoji: c.emoji || EMOJI_PALETTE[i % EMOJI_PALETTE.length],
      color: COLOR_PALETTE[i % COLOR_PALETTE.length],
      total: c.total,
      pct: c.total != null && sum > 0 ? (c.total / sum) * 100 : null,
      prev,
      deltaPct: c.total != null ? changePct(c.total, prev) : null,
      items: c.items,
    }
  })
  // categories that dropped to zero this period — only in `/stats`, not in `/stat`
  for (const s of stats ?? []) {
    const prev = s.previousApproxTotal ?? 0
    if (prev <= 0 || current.has(s.name)) continue
    const i = rows.length
    rows.push({
      key: s.name,
      name: s.name,
      emoji: s.emoji || EMOJI_PALETTE[i % EMOJI_PALETTE.length],
      color: COLOR_PALETTE[i % COLOR_PALETTE.length],
      total: 0,
      pct: 0,
      prev,
      deltaPct: -100,
      items: [],
    })
  }
  const prevSum = stats?.reduce((acc, s) => acc + (s.previousApproxTotal ?? 0), 0) ?? null

  const setKind = (v: StatKind) => {
    setKindState(v)
    setOpened([])
    setActiveKey(null)
  }
  const toggle = (k: string) =>
    setOpened((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]))

  return {
    kind,
    setKind,
    rows,
    sum,
    total: data?.total ?? null,
    /** Period total change vs the previous period, %; null — nothing to compare to. */
    totalDeltaPct: data?.total != null ? changePct(data.total, prevSum) : null,
    prevSum,
    baseCurrency: data?.baseCurrency,
    isLoading,
    isError,
    activeKey,
    setActiveKey,
    opened,
    setOpened,
    toggle,
  }
}

export type CategoryBreakdown = ReturnType<typeof useCategoryBreakdown>
