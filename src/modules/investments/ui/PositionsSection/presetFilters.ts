import { canonicalizeFilters, type PresetFilters } from "@/modules/presets"
import { periodDates } from "@/modules/transactions/lib/periods"
import { periodToPreset } from "@/modules/transactions/lib/presetFilters"
import { type PositionsUrlParams, positionsParamsSchema } from "./config"

/**
 * The trade journal's filters as a preset stores them — defaults left out (so "hide dust", the
 * default, is not a filter but "show dust" is), no sort, page or page size. The period follows
 * the transactions table's rule: a ready-made range is kept by name, a hand-picked one by dates.
 */
export function positionsToPreset(params: PositionsUrlParams): PresetFilters {
  return canonicalizeFilters({
    symbol: params.symbol,
    accountId: params.accountId,
    status: params.status === "all" ? undefined : params.status,
    category: params.category === "all" ? undefined : params.category,
    pnl: params.pnl === "all" ? undefined : params.pnl,
    dust: params.dust === "hide" ? undefined : params.dust,
    ...periodToPreset(params.period, params.from, params.to),
  })
}

/** A preset back into URL params, every filter written (see transactionsFromPreset). */
export function positionsFromPreset(filters: PresetFilters): Partial<PositionsUrlParams> {
  const p = positionsParamsSchema.parse(filters)
  return {
    symbol: p.symbol,
    accountId: p.accountId,
    status: p.status,
    category: p.category,
    pnl: p.pnl,
    dust: p.dust,
    ...periodDates(p.period, p.from, p.to),
    page: 1,
  }
}
