import type { TFunction } from "i18next"
import { z } from "zod"

/** Размер страницы по умолчанию. */
export const PAGE_LIMIT = 20

/** Доступные размеры страницы для селектора в таблице. */
export const PAGE_SIZE_OPTIONS = [20, 50, 100]

/** Опции переключателя типа (значение `all` = без фильтра по типу). */
export const getTypeOptions = (t: TFunction) => [
  { value: "all", label: t("common.all") },
  { value: "income", label: t("common.income_plural") },
  { value: "expense", label: t("common.expense_plural") },
]

/**
 * Схема параметров URL для таблицы операций. `.catch()`/`.default()` гарантируют, что
 * `useUrlParams` никогда не упадёт на кривых значениях в ссылке.
 */
export const transactionsParamsSchema = z.object({
  type: z.enum(["income", "expense"]).optional().catch(undefined),
  categoryId: z.string().optional().catch(undefined),
  currency: z.string().optional().catch(undefined),
  search: z.string().optional().catch(undefined),
  /** Диапазон дат операций, формат `YYYY-MM-DD`. */
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
