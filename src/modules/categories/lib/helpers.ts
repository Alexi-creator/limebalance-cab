import { COLOR_PALETTE } from "../config"
import type { CategoryStats, DisplayCategory } from "../model"

/**
 * Category total in the base currency — for sorting, shares, and bars.
 * 0 if exchange rates are unavailable (`approxTotal === null`): different currencies cannot be compared directly.
 */
export function baseAmount(cat: CategoryStats): number {
  return cat.approxTotal ?? 0
}

/** The total is approximate: there are transactions in a currency other than the base (a conversion happened). */
export function isApprox(cat: CategoryStats): boolean {
  return cat.totals.some((t) => t.currency !== cat.baseCurrency)
}

/** Earliest first transaction among the categories — where the summary total starts. */
export function earliestDate(list: CategoryStats[]): string | null {
  const dates = list.map((c) => c.firstDate).filter((d): d is string => Boolean(d))
  return dates.length ? dates.sort()[0] : null
}

/**
 * Localized `YYYY-MM-DD`, e.g. "12 мар. 2025 г.". It is a civil day, so it is read and printed
 * in UTC — no shift by the viewer's timezone.
 */
export function formatDay(date: string, language: string): string {
  return new Intl.DateTimeFormat(language, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`))
}

/** Enriches the stats: emoji from the backend (shown only if present — no palette fallback) and color by index. */
export function toDisplay(stat: CategoryStats, index: number): DisplayCategory {
  return {
    ...stat,
    icon: stat.emoji ?? "",
    color: COLOR_PALETTE[index % COLOR_PALETTE.length],
  }
}
