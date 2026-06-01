import { z } from "zod"

/** Размер страницы таблицы операций. */
export const PAGE_LIMIT = 20

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
})

export type TransactionsParams = z.infer<typeof transactionsParamsSchema>
