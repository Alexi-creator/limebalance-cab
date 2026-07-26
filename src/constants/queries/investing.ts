import type { PositionsParams } from "@api/investing"

export const investingKeys = {
  all: ["investing"] as const,
  accounts: ["investing", "accounts"] as const,
  positions: (params: PositionsParams) => ["investing", "positions", params] as const,
  allPositions: ["investing", "positions"] as const,
  positionSymbols: ["investing", "positions", "symbols"] as const,
  positionsSummary: (params: PositionsParams) =>
    ["investing", "positions", "summary", params] as const,
  equityCurve: (params: PositionsParams) =>
    ["investing", "positions", "equity-curve", params] as const,
  holdings: ["investing", "holdings"] as const,
}

/** Holdings prices are cached for a minute on the backend — no point refetching sooner. */
export const HOLDINGS_STALE_TIME = 60 * 1000

/** Positions/summary/equity-curve are keyed by their filter params, so this caches per filter
 *  combination: switching back to one already fetched within the last 5 minutes reuses it
 *  instead of refetching, same idea as TRANSACTIONS_STALE_TIME. */
export const POSITIONS_STALE_TIME = 5 * 60 * 1000

/** The set of traded symbols changes rarely (only when a new pair is first traded) — cache it
 *  long, no invalidation needed. */
export const POSITION_SYMBOLS_STALE_TIME = 30 * 60 * 1000

/** Poll the accounts list this often while an account's first sync is still running. */
export const ACCOUNTS_FIRST_SYNC_POLL_MS = 12 * 1000
