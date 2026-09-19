import { format } from "date-fns"
import { z } from "zod"
import { API_URLS } from "@/shared/api/apiUrls"
import { HttpMethods } from "@/shared/api/httpMethods"
import { request } from "@/shared/api/request"
import {
  adjustmentSchema,
  adjustmentsResponseSchema,
  coinIconsResponseSchema,
  equityCurveResponseSchema,
  exchangeAccountSchema,
  p2pOrdersResponseSchema,
  positionSymbolsResponseSchema,
  positionsResponseSchema,
  positionsSummarySchema,
  transferSchema,
  transfersResponseSchema,
  venueHoldingSchema,
  venueHoldingsResponseSchema,
  venueSchema,
  venuesResponseSchema,
} from "../model"

// ── exchange accounts ──────────────────────────────────────────────────────────

export interface ConnectAccountPayload {
  apiKey: string
  apiSecret: string
  label: string
}

export function getExchangeAccounts() {
  return request(API_URLS.investing.accounts, { schema: z.array(exchangeAccountSchema) })
}

/** Validates the key against Bybit: 400 → the key/secret was rejected, 503 → no ENCRYPTION_KEY on the server. */
export function connectExchangeAccount(payload: ConnectAccountPayload) {
  return request(API_URLS.investing.accounts, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
    schema: exchangeAccountSchema,
  })
}

/** Label only — key, sync status and history are untouched. */
export function renameExchangeAccount(id: string, label: string) {
  return request(`${API_URLS.investing.accounts}/${id}`, {
    method: HttpMethods.PATCH,
    body: JSON.stringify({ label }),
    schema: exchangeAccountSchema,
  })
}

/** Manual sync; resolves with the refreshed account once the sync finishes. */
export function syncExchangeAccount(id: string) {
  return request(`${API_URLS.investing.accounts}/${id}/sync`, {
    method: HttpMethods.POST,
    schema: exchangeAccountSchema,
  })
}

/** Also deletes every position synced from this account. */
export function deleteExchangeAccount(id: string) {
  return request(`${API_URLS.investing.accounts}/${id}`, { method: HttpMethods.DELETE })
}

// ── closed positions (trade journal) ───────────────────────────────────────────

export interface PositionsParams {
  accountId?: string
  symbol?: string
  /** Filter by close date, inclusive. Ignored server-side for status=OPEN — open positions
   *  have no close date to filter on. */
  from?: Date
  to?: Date
  /** Omitted → both, open pinned on top and closed below by close date (server default). */
  status?: "OPEN" | "CLOSED"
  category?: "linear" | "spot" | "manual"
  /** Currently in profit/loss — realized closedPnl for CLOSED rows, live PnL (currentPrice vs
   *  avgEntryPrice) for OPEN ones. */
  pnl?: "positive" | "negative"
  limit?: number
  offset?: number
}

function positionsQuery(params: PositionsParams): string {
  const q = new URLSearchParams()
  if (params.accountId) q.set("accountId", params.accountId)
  if (params.symbol) q.set("symbol", params.symbol)
  if (params.from) q.set("from", format(params.from, "yyyy-MM-dd"))
  if (params.to) q.set("to", format(params.to, "yyyy-MM-dd"))
  if (params.status) q.set("status", params.status)
  if (params.category) q.set("category", params.category)
  if (params.pnl) q.set("pnl", params.pnl)
  if (params.limit != null) q.set("limit", String(params.limit))
  if (params.offset) q.set("offset", String(params.offset))
  return q.size ? `?${q}` : ""
}

export function getPositions(params: PositionsParams = {}) {
  return request(`${API_URLS.investing.positions}${positionsQuery(params)}`, {
    schema: positionsResponseSchema,
  })
}

/** Every distinct symbol the user has ever traded — powers the Pair filter's autocomplete. */
export function getPositionSymbols() {
  return request(API_URLS.investing.positionSymbols, { schema: positionSymbolsResponseSchema })
}

/** Aggregated over every position matching the filters — no page cap, unlike getPositions. */
export function getPositionsSummary(params: PositionsParams = {}) {
  return request(`${API_URLS.investing.positionsSummary}${positionsQuery(params)}`, {
    schema: positionsSummarySchema,
  })
}

/** Every closed position matching the filters (just closedAt/closedPnl) — no page cap, for
 *  drawing the full equity curve. `status` is ignored server-side: always CLOSED. */
export function getEquityCurve(params: Omit<PositionsParams, "status" | "limit" | "offset"> = {}) {
  return request(`${API_URLS.investing.equityCurve}${positionsQuery(params)}`, {
    schema: equityCurveResponseSchema,
  })
}

export interface ManualPositionPayload {
  symbol: string
  direction: "long" | "short"
  qty: number
  entryPrice: number
  /** Omitted together with closedAt → the trade is logged as still OPEN. Either both are
   *  present or neither is — the backend rejects a payload with just one of them (400). */
  exitPrice?: number
  /** ISO timestamp. */
  closedAt?: string
  openedAt?: string
  leverage?: number
  takeProfitPrice?: number
  stopLossPrice?: number
  /** Where the trade happened — MEXC, an exchanger… */
  venue?: string
  /** Omitted → the backend computes it from the prices. */
  closedPnl?: number
  /** POST only — creates the position's first note. Ignored on PATCH. */
  note?: string
  noteImageUrl?: string
}

export function createManualPosition(payload: ManualPositionPayload) {
  return request(API_URLS.investing.positions, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
  })
}

/** Only source=manual — the backend rejects edits of exchange positions with 400. Patching in
 *  exitPrice + closedAt on a still-OPEN position closes it (the backend flips its status). */
export function updateManualPosition(id: string, payload: Partial<ManualPositionPayload>) {
  return request(`${API_URLS.investing.positions}/${id}`, {
    method: HttpMethods.PATCH,
    body: JSON.stringify(payload),
  })
}

export function deleteManualPosition(id: string) {
  return request(`${API_URLS.investing.positions}/${id}`, { method: HttpMethods.DELETE })
}

// ── position notes (any source, open or closed) ────────────────────────────────

export interface PositionNotePayload {
  body: string
  imageUrl?: string
}

export function createPositionNote(positionId: string, payload: PositionNotePayload) {
  return request(`${API_URLS.investing.positions}/${positionId}/notes`, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
  })
}

export function updatePositionNote(
  positionId: string,
  noteId: string,
  payload: Partial<PositionNotePayload>,
) {
  return request(`${API_URLS.investing.positions}/${positionId}/notes/${noteId}`, {
    method: HttpMethods.PATCH,
    body: JSON.stringify(payload),
  })
}

export function deletePositionNote(positionId: string, noteId: string) {
  return request(`${API_URLS.investing.positions}/${positionId}/notes/${noteId}`, {
    method: HttpMethods.DELETE,
  })
}

// ── coin icons ──────────────────────────────────────────────────────────────────

/** Ticker -> icon URLs, cached ~24h server-side — safe to cache long client-side too (see
 *  useCoinIcons). Missing tickers just mean CoinIcon falls back to its letter avatar. */
export function getCoinIcons() {
  return request(API_URLS.investing.coinIcons, { schema: coinIconsResponseSchema })
}

// ── venues and transfers ──────────────────────────────────────────────────────

export interface TransfersParams {
  venueId?: string
  /** Only the imported movements still waiting to be explained. */
  needsReview?: boolean
  from?: Date
  to?: Date
  limit?: number
  offset?: number
}

function transfersQuery(params: TransfersParams): string {
  const q = new URLSearchParams()
  if (params.venueId) q.set("venueId", params.venueId)
  if (params.needsReview !== undefined) q.set("needsReview", String(params.needsReview))
  if (params.from) q.set("from", format(params.from, "yyyy-MM-dd"))
  if (params.to) q.set("to", format(params.to, "yyyy-MM-dd"))
  if (params.limit != null) q.set("limit", String(params.limit))
  if (params.offset) q.set("offset", String(params.offset))
  return q.size ? `?${q}` : ""
}

/** Tickers we can price — the only ones a coin picker is allowed to offer. */
export function getAssets() {
  return request(API_URLS.investing.assets, { schema: z.array(z.string()) })
}

/** Every venue with what went in, what it is worth now, and the result between them. */
export function getVenues() {
  return request(API_URLS.investing.venues, { schema: venuesResponseSchema })
}

/** Adds a place kept by hand — a cold wallet, an exchange with no API key. */
export function createVenue(name: string) {
  return request(API_URLS.investing.venues, {
    method: HttpMethods.POST,
    body: JSON.stringify({ name }),
    schema: venueSchema.partial({ coins: true }),
  })
}

export function updateVenue(id: string, payload: { name?: string; archived?: boolean }) {
  return request(`${API_URLS.investing.venues}/${id}`, {
    method: HttpMethods.PATCH,
    body: JSON.stringify(payload),
    schema: venueSchema.partial({ coins: true }),
  })
}

/** Refused by the backend while the venue still has transfers on record. */
export function deleteVenue(id: string) {
  return request(`${API_URLS.investing.venues}/${id}`, { method: HttpMethods.DELETE })
}

export function getTransfers(params: TransfersParams = {}) {
  return request(`${API_URLS.investing.transfers}${transfersQuery(params)}`, {
    schema: transfersResponseSchema,
  })
}

export interface TransferPayload {
  venueId: string
  /** IN: the venue gained the money. OUT: it left. */
  direction: "IN" | "OUT"
  /** LEDGER moves your free balance; VENUE moves between venues; EXTERNAL is gone for good. */
  peer: "LEDGER" | "VENUE" | "EXTERNAL"
  /** Required when peer is VENUE. */
  peerVenueId?: string
  /** Always positive — the sign lives in `direction`. Omit when moving a coin. */
  amount?: number
  /** The currency that actually left or reached your wallet; only meaningful for peer LEDGER. */
  currency?: string
  /** Ticker, when the move is a coin rather than money. Never against the ledger. */
  asset?: string
  assetAmount?: number
  /** `YYYY-MM-DD` — the backend stores it in @db.Date without time. */
  date?: string
  note?: string
  /** The Bybit P2P order this transfer records — the order then shows as recorded. */
  p2pOrderId?: string
}

export function createTransfer(payload: TransferPayload) {
  return request(API_URLS.investing.transfers, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
    schema: transferSchema,
  })
}

/** The venue and its peer cannot be moved — only the figures and the note. */
export type UpdateTransferPayload = Partial<
  Pick<TransferPayload, "direction" | "amount" | "currency" | "date">
> & { note?: string | null }

export function updateTransfer(id: string, payload: UpdateTransferPayload) {
  return request(`${API_URLS.investing.transfers}/${id}`, {
    method: HttpMethods.PATCH,
    body: JSON.stringify(payload),
    schema: transferSchema,
  })
}

/** What an imported deposit or withdrawal really was. */
export interface ClassifyTransferPayload {
  peer: "LEDGER" | "VENUE" | "EXTERNAL"
  /** Required when peer is VENUE. */
  peerVenueId?: string
  /** peer LEDGER only, required there: what left or reached the wallet, in its own currency. */
  amount?: number
  currency?: string
  note?: string
  /** A transfer already recorded by hand for this movement — merged in, and its answer taken. */
  replacesId?: string
}

export function classifyTransfer(id: string, payload: ClassifyTransferPayload) {
  return request(`${API_URLS.investing.transfers}/${id}/classify`, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
    schema: transferSchema,
  })
}

/** Refused by the backend for imported transfers — those are classified, not deleted. */
export function deleteTransfer(id: string) {
  return request(`${API_URLS.investing.transfers}/${id}`, { method: HttpMethods.DELETE })
}

// ── P2P ──────────────────────────────────────────────────────────────────────

/** A page of a connected account's P2P orders, read live from the exchange. */
export function getP2pOrders(accountId: string, page: number, size: number) {
  return request(
    `${API_URLS.investing.accounts}/${accountId}/p2p-orders?page=${page}&size=${size}`,
    { schema: p2pOrdersResponseSchema },
  )
}

// ── venue corrections and tracked coins ───────────────────────────────────────

export function getAdjustments(venueId: string) {
  return request(`${API_URLS.investing.venues}/${venueId}/adjustments`, {
    schema: adjustmentsResponseSchema,
  })
}

export interface AdjustmentPayload {
  /** Signed USD: negative when the venue holds less than the records say. Never zero. */
  amountUsd: number
  /** Required — a correction without a reason is unreadable a month later. */
  note: string
  date?: string
}

export function createAdjustment(venueId: string, payload: AdjustmentPayload) {
  return request(`${API_URLS.investing.venues}/${venueId}/adjustments`, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
    schema: adjustmentSchema,
  })
}

export function deleteAdjustment(id: string) {
  return request(`${API_URLS.investing.adjustments}/${id}`, { method: HttpMethods.DELETE })
}

/** The coins tracked by hand inside one venue. */
export function getVenueHoldings(venueId: string) {
  return request(`${API_URLS.investing.holdings}?venueId=${venueId}`, {
    schema: venueHoldingsResponseSchema,
  })
}

export interface VenueHoldingPayload {
  venueId: string
  asset: string
  amount: number
  avgBuyPrice?: number | null
  note?: string | null
}

export function createVenueHolding(payload: VenueHoldingPayload) {
  return request(API_URLS.investing.holdings, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
    schema: venueHoldingSchema.partial({ price: true, value: true, pnlUsd: true, pnlPct: true }),
  })
}

export function updateVenueHolding(id: string, payload: Partial<VenueHoldingPayload>) {
  return request(`${API_URLS.investing.holdings}/${id}`, {
    method: HttpMethods.PATCH,
    body: JSON.stringify(payload),
    schema: venueHoldingSchema.partial({ price: true, value: true, pnlUsd: true, pnlPct: true }),
  })
}

export function deleteVenueHolding(id: string) {
  return request(`${API_URLS.investing.holdings}/${id}`, { method: HttpMethods.DELETE })
}
