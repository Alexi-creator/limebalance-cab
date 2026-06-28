import type { CategoryStats } from "@appTypes/category"
import { COLOR_PALETTE } from "./config"
import type { DisplayCategory } from "./types"

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

/** Enriches the stats: emoji from the backend (shown only if present — no palette fallback) and color by index. */
export function toDisplay(stat: CategoryStats, index: number): DisplayCategory {
  return {
    ...stat,
    icon: stat.emoji ?? "",
    color: COLOR_PALETTE[index % COLOR_PALETTE.length],
  }
}
