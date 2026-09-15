import { z } from "zod"
import { wallClockDate } from "@/shared/lib/wallClock"

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
  /** Live price while OPEN (from the same Bybit spot-ticker feed as Holdings); null when
   *  unavailable or the position is CLOSED. */
  currentPrice: z.number().nullable(),
  /** Unrealized PnL against currentPrice while OPEN; null when CLOSED or price unavailable. */
  unrealizedPnl: z.number().nullable(),
  /** Last known TP/SL at exchange sync time (bybit) or as entered (manual). Not cleared on
   *  close — a closed linear position still carries whatever TP/SL it had at exit. */
  takeProfitPrice: nullableDecimal(),
  stopLossPrice: nullableDecimal(),
})

export const positionsResponseSchema = z.object({
  items: z.array(positionSchema),
  total: z.number(),
})

/** GET /investing/positions/symbols — every distinct symbol the user has ever traded (bybit or
 *  manual), for the Pair filter's autocomplete. */
export const positionSymbolsResponseSchema = z.object({
  items: z.array(z.string()),
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

export const transferDirectionSchema = z.enum(["IN", "OUT"])
export type TransferDirection = z.infer<typeof transferDirectionSchema>

/**
 * Who is on the other side of a transfer — the one thing that decides what it does to your money:
 *
 * - `LEDGER` — your own free balance. The only peer that moves it.
 * - `VENUE` — another venue. Nothing leaves your net worth, two venues change.
 * - `EXTERNAL` — someone else. The money is gone for good and net worth drops with it.
 */
export const transferPeerSchema = z.enum(["LEDGER", "VENUE", "EXTERNAL"])
export type TransferPeer = z.infer<typeof transferPeerSchema>

export const transferSchema = z.object({
  id: z.string(),
  venueId: z.string(),
  venueName: z.string(),
  /** From the venue's point of view: IN means it gained the money. */
  direction: transferDirectionSchema,
  peer: transferPeerSchema,
  peerVenueId: z.string().nullable(),
  peerVenueName: z.string().nullable(),
  /** Always positive — the sign lives in `direction`. */
  amount: decimal(),
  currency: z.string(),
  /** At the rate of the transfer's own day; null when no rate was available for it. */
  amountUsd: nullableDecimal(),
  /** Set when the move was made in a coin — then `amount` is that coin priced in USD. */
  asset: z.string().nullable(),
  assetAmount: nullableDecimal(),
  note: z.string().nullable(),
  // A @db.Date field — wall-clock, like a transaction's own date.
  date: wallClockDate(),
})

export const transfersResponseSchema = z.object({
  items: z.array(transferSchema),
  total: z.number(),
})

export const venueCoinSchema = z.object({
  coin: z.string(),
  amount: decimal(),
  usdValue: nullableDecimal(),
})

/**
 * A place money sits once it has left the ledger.
 *
 * LIVE means the exchange itself is asked what it is worth on every sync — open positions marked
 * to market included — so `valueUsd` matches what you see on the exchange rather than being
 * reconstructed from deposits. MANUAL means it is worth what you say it is.
 */
export const venueSchema = z.object({
  id: z.string(),
  name: z.string(),
  accountId: z.string().nullable(),
  mode: z.enum(["LIVE", "MANUAL"]),
  archived: z.boolean(),
  /** Net moved in since tracking started, USD. */
  transferredUsd: decimal(),
  /** What it is worth now; null when the exchange has not been read yet. */
  valueUsd: nullableDecimal(),
  /** value − (opening + transferred): the result since tracking began. */
  resultUsd: nullableDecimal(),
  /** What was already here when tracking started — never counted as a result. */
  openingUsd: nullableDecimal(),
  /** Net of the manual corrections applied to this venue, USD. */
  adjustmentsUsd: decimal().default(0),
  /** When the value was last read. Its age is worth showing next to the figure. */
  valueAt: nullableDate(),
  coins: z.array(venueCoinSchema).default([]),
})

/** "This venue holds X more/less than we think, and here is why." Manual venues only. */
export const adjustmentSchema = z.object({
  id: z.string(),
  venueId: z.string(),
  /** Signed: negative when the venue holds less than the records say. */
  amountUsd: decimal(),
  note: z.string(),
  date: wallClockDate(),
})

export const adjustmentsResponseSchema = z.array(adjustmentSchema)

/** A coin tracked by hand inside a manual venue, valued at the live Bybit spot price. */
export const venueHoldingSchema = z.object({
  id: z.string(),
  asset: z.string(),
  amount: decimal(),
  avgBuyPrice: nullableDecimal(),
  venueId: z.string().nullable(),
  location: z.string(),
  note: z.string().nullable(),
  /** null when the asset has no USDT ticker on Bybit — then it is left out of every total. */
  price: z.number().nullable(),
  value: z.number().nullable(),
  pnlUsd: z.number().nullable(),
  pnlPct: z.number().nullable(),
})

export const venueHoldingsResponseSchema = z.object({
  items: z.array(venueHoldingSchema),
  totalValue: z.number(),
})

export const venuesResponseSchema = z.object({
  items: z.array(venueSchema),
  baseCurrency: z.string(),
  totalUsd: decimal(),
  totalBase: nullableDecimal(),
  investedUsd: decimal(),
  resultUsd: decimal(),
  /** A venue could not be valued, so every total is a lower bound. */
  isPartial: z.boolean(),
})

/** GET /investing/coin-icons — ticker -> icon URLs, cached long client-side (see CoinIcon). */
export const coinIconsResponseSchema = z.object({
  items: z.record(z.string(), z.object({ icon: z.string(), iconNight: z.string() })),
})

export type ExchangeAccount = z.infer<typeof exchangeAccountSchema>
export type Transfer = z.infer<typeof transferSchema>
export type Venue = z.infer<typeof venueSchema>
export type VenueCoin = z.infer<typeof venueCoinSchema>
export type Adjustment = z.infer<typeof adjustmentSchema>
export type VenueHolding = z.infer<typeof venueHoldingSchema>
export type VenuesResponse = z.infer<typeof venuesResponseSchema>
export type PositionNote = z.infer<typeof positionNoteSchema>
export type Position = z.infer<typeof positionSchema>
export type PositionsResponse = z.infer<typeof positionsResponseSchema>
export type PositionSymbolsResponse = z.infer<typeof positionSymbolsResponseSchema>
export type PositionsSummary = z.infer<typeof positionsSummarySchema>
export type EquityCurveResponse = z.infer<typeof equityCurveResponseSchema>
export type CoinIconsResponse = z.infer<typeof coinIconsResponseSchema>

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

/** Days held — closedAt (or now, while still OPEN) minus openedAt. Null when openedAt is
 *  unknown (see positionSchema). */
export function holdingDays(position: Position): number | null {
  if (!position.openedAt) return null
  const end = position.closedAt ?? new Date()
  const ms = end.getTime() - position.openedAt.getTime()
  return Math.floor(ms / (24 * 60 * 60 * 1000))
}

/** Realized PnL once CLOSED, unrealized (live) PnL while still OPEN — whichever is known. */
export function positionPnl(position: Position): number | null {
  return position.closedPnl ?? position.unrealizedPnl
}

/** PnL (realized or, while OPEN, unrealized) against the capital actually committed
 *  (entryVolumeUsd), as a percentage. Null when neither PnL nor entryVolumeUsd is known. */
export function positionRoi(position: Position): number | null {
  const pnl = positionPnl(position)
  if (pnl == null || !position.entryVolumeUsd) return null
  return (pnl / position.entryVolumeUsd) * 100
}

/** Hypothetical PnL if the position were to exit exactly at `exitPrice` — same
 *  (exit − entry) × qty formula the backend uses for closedPnl/unrealizedPnl (full, leveraged
 *  qty, not {@link unleveragedQty}). Used to price out the TP/SL levels below. */
function pnlAtPrice(position: Position, exitPrice: number): number {
  const long = positionDirection(position) === "long"
  const raw = long
    ? (exitPrice - position.avgEntryPrice) * position.qty
    : (position.avgEntryPrice - exitPrice) * position.qty
  return Math.round(raw * 100) / 100
}

/** What closing at the take-profit level would net — null while it isn't set. */
export function takeProfitPnl(position: Position): number | null {
  return position.takeProfitPrice == null ? null : pnlAtPrice(position, position.takeProfitPrice)
}

/** What closing at the stop-loss level would net (a loss, unless it's set on the wrong side of
 *  entry) — null while it isn't set. */
export function stopLossPnl(position: Position): number | null {
  return position.stopLossPrice == null ? null : pnlAtPrice(position, position.stopLossPrice)
}

const QUOTE_SUFFIXES = ["USDT", "USDC", "BUSD", "USD", "EUR", "BTC", "ETH"]
const MULTIPLIERS = ["1000000", "100000", "10000", "1000"]

/**
 * Best-effort coin ticker from an exchange pair symbol (BTCUSDT -> BTC), for the CoinIcon
 * lookup. Bybit's multiplier tickers prefix or suffix a scale factor (1000PEPEUSDT,
 * SHIB1000USDT) — stripped by exact match only, so real digit-leading tickers (1INCH) are left
 * alone. A miss here just falls back to CoinIcon's letter avatar, so this doesn't need to cover
 * every case.
 */
export function baseAssetFromSymbol(symbol: string): string {
  let base = symbol.toUpperCase()
  const quote = QUOTE_SUFFIXES.find((q) => base.length > q.length && base.endsWith(q))
  if (quote) base = base.slice(0, -quote.length)

  const prefix = MULTIPLIERS.find((m) => base.startsWith(m) && base.length > m.length)
  if (prefix) return base.slice(prefix.length)

  const suffix = MULTIPLIERS.find((m) => base.endsWith(m) && base.length > m.length)
  if (suffix) return base.slice(0, -suffix.length)

  return base
}
