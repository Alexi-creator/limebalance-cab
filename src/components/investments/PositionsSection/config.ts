import { z } from "zod"

export const POSITIONS_PAGE_SIZE_OPTIONS = [20, 50, 100]
export const POSITIONS_DEFAULT_PAGE_SIZE = 20

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
  status: z.enum(["OPEN", "CLOSED"]).optional().catch(undefined),
  /** Client-side only — the API has no category param yet. */
  category: z.enum(["all", "linear", "spot", "manual"]).catch("all").default("all"),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  limit: z.coerce
    .number()
    .refine((v) => POSITIONS_PAGE_SIZE_OPTIONS.includes(v))
    .catch(POSITIONS_DEFAULT_PAGE_SIZE)
    .default(POSITIONS_DEFAULT_PAGE_SIZE),
})

export type PositionsUrlParams = z.infer<typeof positionsParamsSchema>
