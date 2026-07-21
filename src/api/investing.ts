import { request } from "@api/request"
import {
  exchangeAccountSchema,
  holdingsResponseSchema,
  positionsResponseSchema,
} from "@appTypes/investing"
import { API_URLS } from "@constants/apiUrls"
import { HttpMethods } from "@constants/httpMethods"
import { format } from "date-fns"
import { z } from "zod"

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
  /** Filter by close date, inclusive. */
  from?: Date
  to?: Date
  limit?: number
  offset?: number
}

function positionsQuery(params: PositionsParams): string {
  const q = new URLSearchParams()
  if (params.accountId) q.set("accountId", params.accountId)
  if (params.symbol) q.set("symbol", params.symbol)
  if (params.from) q.set("from", format(params.from, "yyyy-MM-dd"))
  if (params.to) q.set("to", format(params.to, "yyyy-MM-dd"))
  if (params.limit != null) q.set("limit", String(params.limit))
  if (params.offset) q.set("offset", String(params.offset))
  return q.size ? `?${q}` : ""
}

export function getPositions(params: PositionsParams = {}) {
  return request(`${API_URLS.investing.positions}${positionsQuery(params)}`, {
    schema: positionsResponseSchema,
  })
}

export interface ManualPositionPayload {
  symbol: string
  direction: "long" | "short"
  qty: number
  entryPrice: number
  exitPrice: number
  /** ISO timestamp. */
  closedAt: string
  openedAt?: string
  leverage?: number
  /** Where the trade happened — MEXC, an exchanger… */
  venue?: string
  /** Omitted → the backend computes it from the prices. */
  closedPnl?: number
}

export function createManualPosition(payload: ManualPositionPayload) {
  return request(API_URLS.investing.positions, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
  })
}

/** Only source=manual — the backend rejects edits of exchange positions with 400. */
export function updateManualPosition(id: string, payload: Partial<ManualPositionPayload>) {
  return request(`${API_URLS.investing.positions}/${id}`, {
    method: HttpMethods.PATCH,
    body: JSON.stringify(payload),
  })
}

export function deleteManualPosition(id: string) {
  return request(`${API_URLS.investing.positions}/${id}`, { method: HttpMethods.DELETE })
}

// ── holdings (portfolio) ───────────────────────────────────────────────────────

export interface HoldingPayload {
  /** 1–15 letters/digits; the backend uppercases it. */
  asset: string
  amount: number
  avgBuyPrice?: number | null
  location?: string
  note?: string | null
}

export function getHoldings() {
  return request(API_URLS.investing.holdings, { schema: holdingsResponseSchema })
}

// POST/PATCH responses are not validated: they return the bare row without the
// live-price fields of the GET shape; the lists are refetched after each mutation anyway.
export function createHolding(payload: HoldingPayload) {
  return request(API_URLS.investing.holdings, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
  })
}

export function updateHolding(id: string, payload: Partial<HoldingPayload>) {
  return request(`${API_URLS.investing.holdings}/${id}`, {
    method: HttpMethods.PATCH,
    body: JSON.stringify(payload),
  })
}

export function deleteHolding(id: string) {
  return request(`${API_URLS.investing.holdings}/${id}`, { method: HttpMethods.DELETE })
}
