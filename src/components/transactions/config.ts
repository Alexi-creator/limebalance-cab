import type { TFunction } from "i18next"
import { z } from "zod"

/** Default page size. */
export const PAGE_LIMIT = 20

/** Available page sizes for the table selector. */
export const PAGE_SIZE_OPTIONS = [20, 50, 100]

/** Type toggle options (value `all` = no type filter). */
export const getTypeOptions = (t: TFunction) => [
  { value: "all", label: t("common.all") },
  { value: "income", label: t("common.income_plural") },
  { value: "expense", label: t("common.expense_plural") },
]

/**
 * URL params schema for the transactions table. `.catch()`/`.default()` guarantee that
 * `useUrlParams` never crashes on malformed values in the link.
 */
export const transactionsParamsSchema = z.object({
  type: z.enum(["income", "expense"]).optional().catch(undefined),
  categoryId: z.string().optional().catch(undefined),
  currency: z.string().optional().catch(undefined),
  search: z.string().optional().catch(undefined),
  /** Transaction date range, format `YYYY-MM-DD`. */
  from: z.string().optional().catch(undefined),
  to: z.string().optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  limit: z.coerce
    .number()
    .refine((v) => PAGE_SIZE_OPTIONS.includes(v))
    .catch(PAGE_LIMIT)
    .default(PAGE_LIMIT),
})

export type TransactionsParams = z.infer<typeof transactionsParamsSchema>
