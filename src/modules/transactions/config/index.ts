import type { TFunction } from "i18next"
import { z } from "zod"
import { PERIOD_VALUES } from "../lib/periods"

/** Default page size. */
export const PAGE_LIMIT = 20

/** Available page sizes for the table selector. */
export const PAGE_SIZE_OPTIONS = [20, 50, 100]

/** Type toggle options (value `all` = no type filter). */
export const getTypeOptions = (t: TFunction) => [
  { value: "all", label: t("common.all") },
  { value: "expense", label: t("common.expense_plural") },
  { value: "income", label: t("common.income_plural") },
]

/** Columns the table can be sorted by, the default first. */
export const TRANSACTION_SORT_FIELDS = ["date", "amount"] as const
export type TransactionSortField = (typeof TRANSACTION_SORT_FIELDS)[number]

/** Sortable columns with their titles — the mobile sort picker lists them in this order. */
export const getTransactionSortFields = (t: TFunction) => [
  { value: "date" as const, label: t("transactions.col_date") },
  { value: "amount" as const, label: t("transactions.col_amount") },
]

/**
 * URL params schema for the transactions table. `.catch()`/`.default()` guarantee that
 * `useUrlParams` never crashes on malformed values in the link.
 */
export const transactionsParamsSchema = z.object({
  /** Which table the page shows. Exchanges are not transactions, so they get their own view
   *  rather than a row type — mixing them into the table would put them in its totals. */
  view: z.enum(["transactions", "exchanges"]).catch("transactions").default("transactions"),
  type: z.enum(["income", "expense"]).optional().catch(undefined),
  // Multi-select: serialized in the URL as repeated params (?categoryId=a&categoryId=b).
  // Normalized to an array — a single value in the URL still parses to a one-element array.
  categoryId: z
    .preprocess((v) => (v == null ? [] : Array.isArray(v) ? v : [v]), z.array(z.string()))
    .catch([])
    .default([]),
  currency: z
    .preprocess((v) => (v == null ? [] : Array.isArray(v) ? v : [v]), z.array(z.string()))
    .catch([])
    .default([]),
  search: z.string().optional().catch(undefined),
  /**
   * Which option the period filter shows. The dates below are always written alongside it, so the
   * request itself never depends on this — it only keeps a preset recognizable as a preset after a
   * reload (`from`/`to` alone cannot tell "this month" from a range typed by hand). Absent means
   * the default period (DEFAULT_PERIOD), so "all" is written out explicitly.
   */
  period: z.enum(PERIOD_VALUES).optional().catch(undefined),
  /** Transaction date range, format `YYYY-MM-DD`. */
  from: z.string().optional().catch(undefined),
  to: z.string().optional().catch(undefined),
  /** Amount sorts by the value at the time of the transaction, across currencies (server-side). */
  sortBy: z.enum(TRANSACTION_SORT_FIELDS).catch("date").default("date"),
  sortDir: z.enum(["asc", "desc"]).catch("desc").default("desc"),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  limit: z.coerce
    .number()
    .refine((v) => PAGE_SIZE_OPTIONS.includes(v))
    .catch(PAGE_LIMIT)
    .default(PAGE_LIMIT),
})

export type TransactionsParams = z.infer<typeof transactionsParamsSchema>
