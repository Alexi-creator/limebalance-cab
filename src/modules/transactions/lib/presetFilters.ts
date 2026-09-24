import { canonicalizeFilters, type PresetFilters } from "@/modules/presets"
import { type TransactionsParams, transactionsParamsSchema } from "../config"
import { PERIOD_PRESETS, type PeriodPreset, periodDates, resolvePeriod } from "./periods"

const isPeriodPreset = (period: string): period is PeriodPreset =>
  (PERIOD_PRESETS as readonly string[]).includes(period)

/**
 * The period part of a preset. A ready-made range is kept as its name alone, so "this month"
 * saved in September shows October in October; only a hand-picked range keeps its dates.
 */
export function periodToPreset(
  period: string | undefined,
  from?: string,
  to?: string,
): PresetFilters {
  const resolved = resolvePeriod(period as TransactionsParams["period"], from, to)
  if (isPeriodPreset(resolved)) return { period: resolved }
  if (resolved === "custom") return canonicalizeFilters({ period: "custom", from, to })
  return {}
}

/** The transactions table's filters as a preset stores them — no sort, page or page size. */
export function transactionsToPreset(params: TransactionsParams): PresetFilters {
  return canonicalizeFilters({
    type: params.type,
    categoryId: params.categoryId,
    currency: params.currency,
    search: params.search,
    ...periodToPreset(params.period, params.from, params.to),
  })
}

/**
 * A preset back into URL params. Every filter is written — the ones the preset leaves out go
 * back to their defaults — so nothing from the previous selection survives. Read through the
 * URL schema, so a stale or hand-crafted preset can't put a bad value in.
 */
export function transactionsFromPreset(filters: PresetFilters): Partial<TransactionsParams> {
  const p = transactionsParamsSchema.parse(filters)
  return {
    type: p.type,
    categoryId: p.categoryId,
    currency: p.currency,
    search: p.search,
    // a preset with no period was saved over all dates — spelled out, or the default would apply
    ...periodDates(p.period ?? "all", p.from, p.to),
    page: 1,
  }
}
