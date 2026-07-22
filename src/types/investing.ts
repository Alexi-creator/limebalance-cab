import { z } from "zod"

/**
 * Backend Decimals arrive as strings ("0.184"); coerce them to numbers for display.
 * All investing amounts are USD/USDT — no conversion to the user's base currency yet.
 * The nullable variants try `null` first so coercion never turns null into 0 / Invalid Date.
 */
const decimal = () => z.coerce.number()
const nullableDecimal = () => z.union([z.null(), z.coerce.number()])
const nullableDate = () => z.union([z.null(), z.coerce.date()])

export const exchangeAccountSchema = z.object({
  id: z.string(),
  exchange: z.string(),
  label: z.string(),
  status: z.enum(["ACTIVE", "ERROR", "DISABLED"]),
  /** Reason of the last failed sync (shown in a tooltip on the ERROR badge). */
  lastError: z.string().nullable(),
  /** Masked key like "••••3f9a" — the backend never returns the full key. */
  apiKeyMasked: z.string().nullable(),
  /** Trade history is synced starting from this date (= registration date). */
  syncFrom: z.coerce.date(),
  /** null until the very first sync finishes — show "first sync in progress". */
  lastSyncAt: nullableDate(),
  createdAt: z.coerce.date(),
  /** Only present in the POST response; false → warn that the key has trade permissions. */
  readOnly: z.boolean().optional(),
})

export const positionNoteSchema = z.object({
  id: z.string(),
  body: z.string(),
  imageUrl: z.string().nullable(),
  createdAt: z.coerce.date(),
})

export const positionSchema = z.object({
  id: z.string(),
  /** null for manual entries. */
  accountId: z.string().nullable(),
  source: z.enum(["bybit", "manual"]),
  symbol: z.string(),
  /** 'linear' (futures) | 'spot' | 'manual'; kept open for future categories. */
  category: z.string(),
  /** Side of the CLOSING order: "Sell" → the position was Long, "Buy" → Short. */
  side: z.enum(["Sell", "Buy"]),
  qty: decimal(),
  avgEntryPrice: decimal(),
  /** null while the position is still OPEN. */
  avgExitPrice: nullableDecimal(),
  /** USDT; exchange positions include fees. null while OPEN. */
  closedPnl: nullableDecimal(),
  /** Always null for spot. */
  leverage: nullableDecimal(),
  /** Spot/manual: exact. Linear: derived from fills by FIFO — null when the opening fills
   *  predate the synced history. */
  openedAt: nullableDate(),
  /** null while the position is still OPEN. */
  closedAt: nullableDate(),
  /** (qty × avgEntryPrice) / leverage — capital actually committed, in USDT; 1x for spot/manual. */
  entryVolumeUsd: z.number(),
  /** Every fee (trading + funding) over the position's life, signed as Bybit reports it
   *  (positive = paid, negative = rebate). Null for manual entries and undated linear ones. */
  totalFeeUsd: z.number().nullable(),
  status: z.enum(["OPEN", "CLOSED"]),
  notes: z.array(positionNoteSchema),
})

export const positionsResponseSchema = z.object({
  items: z.array(positionSchema),
  total: z.number(),
})

/** GET /investing/positions/summary — aggregated over the whole filtered history, not just
 *  one page. Unlike `positionsResponseSchema.items`, this isn't capped at the API's page limit.
 *  winCount/lossCount/breakevenCount partition closedCount (closedPnl >/</= 0). */
export const positionsSummarySchema = z.object({
  totalPnl: decimal(),
  openCount: z.number(),
  closedCount: z.number(),
  winCount: z.number(),
  lossCount: z.number(),
  breakevenCount: z.number(),
})

/** GET /investing/positions/equity-curve — every closed position matching the filters, sorted
 *  by closedAt ascending, no pagination cap. Just the two fields the curve needs. */
export const equityCurveResponseSchema = z.object({
  items: z.array(
    z.object({
      closedAt: z.coerce.date(),
      closedPnl: decimal(),
    }),
  ),
})

export const holdingSchema = z.object({
  id: z.string(),
  asset: z.string(),
  amount: decimal(),
  avgBuyPrice: nullableDecimal(),
  location: z.string(),
  note: z.string().nullable(),
  /** Live spot price in USD; null when the asset has no USDT ticker on Bybit. */
  price: z.number().nullable(),
  /** amount × price; null when the price is unavailable (excluded from totalValue). */
  value: z.number().nullable(),
  /** Against avgBuyPrice; null when either the price or the buy price is missing. */
  pnlUsd: z.number().nullable(),
  pnlPct: z.number().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const holdingsResponseSchema = z.object({
  items: z.array(holdingSchema),
  /** Sum of `value` over priced positions only, USD. */
  totalValue: z.number(),
})

export type ExchangeAccount = z.infer<typeof exchangeAccountSchema>
export type PositionNote = z.infer<typeof positionNoteSchema>
export type Position = z.infer<typeof positionSchema>
export type PositionsResponse = z.infer<typeof positionsResponseSchema>
export type PositionsSummary = z.infer<typeof positionsSummarySchema>
export type EquityCurveResponse = z.infer<typeof equityCurveResponseSchema>
export type Holding = z.infer<typeof holdingSchema>
export type HoldingsResponse = z.infer<typeof holdingsResponseSchema>

/**
 * Human-readable direction of a position (`side` is the closing/current order's side,
 * same convention whether the position is still OPEN or already CLOSED).
 * Spot has no shorts — a spot position is always a Long regardless of `side`.
 */
export function positionDirection(position: Position): "long" | "short" {
  if (position.category === "spot") return "long"
  return position.side === "Sell" ? "long" : "short"
}

/**
 * `qty` is the full leveraged contract size — the actual price exposure, not what was paid for.
 * Divided by leverage it's the coin amount the committed capital (entryVolumeUsd) would have
 * bought unleveraged; 1x for spot/manual (no leverage) leaves it unchanged.
 */
export function unleveragedQty(position: Position): number {
  return position.leverage ? position.qty / position.leverage : position.qty
}

/** Days held — closedAt minus openedAt. Null when the position is still OPEN, or openedAt
 *  is unknown (see positionSchema). */
export function holdingDays(position: Position): number | null {
  if (!position.openedAt || !position.closedAt) return null
  const ms = position.closedAt.getTime() - position.openedAt.getTime()
  return Math.floor(ms / (24 * 60 * 60 * 1000))
}

/** closedPnl against the capital actually committed (entryVolumeUsd), as a percentage.
 *  Null while the position is still OPEN (closedPnl isn't known yet). */
export function positionRoi(position: Position): number | null {
  if (position.closedPnl == null || !position.entryVolumeUsd) return null
  return (position.closedPnl / position.entryVolumeUsd) * 100
}
