import { z } from "zod"

export const POSITIONS_PAGE_SIZE_OPTIONS = [20, 50, 100]
export const POSITIONS_DEFAULT_PAGE_SIZE = 100

const PAGE_SIZE_STORAGE_KEY = "investments.pageSize"

/** Falls back to the default when nothing's stored yet, or the stored value is stale (an
 *  option since removed from POSITIONS_PAGE_SIZE_OPTIONS). */
function getStoredPageSize(): number {
  const stored = Number(localStorage.getItem(PAGE_SIZE_STORAGE_KEY))
  return POSITIONS_PAGE_SIZE_OPTIONS.includes(stored) ? stored : POSITIONS_DEFAULT_PAGE_SIZE
}

export function storePageSize(limit: number) {
  localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(limit))
}

/**
 * URL params for the trade journal's filters/pagination — same idea as
 * transactionsParamsSchema: a reload or a shared link keeps the same view.
 * `.catch()`/`.default()` guarantee `useUrlParams` never crashes on a malformed link.
 */
export const positionsParamsSchema = z.object({
  symbol: z.string().optional().catch(undefined),
  accountId: z.string().optional().catch(undefined),
  /** YYYY-MM-DD. */
  from: z.string().optional().catch(undefined),
  to: z.string().optional().catch(undefined),
  // Defaults to "all" — landing on the journal shows everything, open and closed, at once.
  // A real, persisted value (like `category` below), not just the param's absence — otherwise
  // picking "All" couldn't stick across a reload.
  status: z.enum(["all", "OPEN", "CLOSED"]).catch("all").default("all"),
  /** Client-side only — the API has no category param yet. */
  category: z.enum(["all", "linear", "spot", "manual"]).catch("all").default("all"),
  // Defaults to "all" — same reasoning as `status` above.
  pnl: z.enum(["all", "positive", "negative"]).catch("all").default("all"),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  limit: z.coerce
    .number()
    .refine((v) => POSITIONS_PAGE_SIZE_OPTIONS.includes(v))
    .catch(getStoredPageSize)
    .default(getStoredPageSize),
})

export type PositionsUrlParams = z.infer<typeof positionsParamsSchema>
