import { z } from "zod"

/** Размер страницы по умолчанию. */
export const PAGE_LIMIT = 20

/** Доступные размеры страницы для селектора в таблице. */
export const PAGE_SIZE_OPTIONS = [20, 50, 100]

/** Опции переключателя типа (значение `all` = без фильтра по типу). */
export const TYPE_OPTIONS = [
  { value: "all", label: "Все" },
  { value: "income", label: "Доходы" },
  { value: "expense", label: "Расходы" },
]

/**
 * Схема параметров URL для таблицы операций. `.catch()`/`.default()` гарантируют, что
 * `useUrlParams` никогда не упадёт на кривых значениях в ссылке.
 */
export const transactionsParamsSchema = z.object({
  type: z.enum(["income", "expense"]).optional().catch(undefined),
  categoryId: z.string().optional().catch(undefined),
  search: z.string().optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  limit: z.coerce
    .number()
    .refine((v) => PAGE_SIZE_OPTIONS.includes(v))
    .catch(PAGE_LIMIT)
    .default(PAGE_LIMIT),
})

export type TransactionsParams = z.infer<typeof transactionsParamsSchema>
