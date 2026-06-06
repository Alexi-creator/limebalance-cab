import { wallClockDate } from "@utils/wallClock"
import { z } from "zod"

export const transactionTypeSchema = z.enum(["income", "expense"])
export type TransactionType = z.infer<typeof transactionTypeSchema>

/** Одна транзакция из объединённого роута /transactions (категория — плоская). */
export const transactionSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  categoryName: z.string().nullable(),
  amount: z.coerce.number(),
  /** Код валюты операции (ISO 4217); может отсутствовать у старых записей. */
  currency: z.string().nullish(),
  description: z.string(),
  date: wallClockDate(),
  type: transactionTypeSchema,
})
export type Transaction = z.infer<typeof transactionSchema>

/**
 * Денежный итог по всей выборке (с учётом фильтров, не только текущая страница),
 * приведённый к базовой валюте пользователя. Суммы null, если курсы недоступны.
 */
export const transactionsSummarySchema = z.object({
  baseCurrency: z.string(),
  income: z.coerce.number().nullable(),
  expense: z.coerce.number().nullable(),
  net: z.coerce.number().nullable(),
})
export type TransactionsSummary = z.infer<typeof transactionsSummarySchema>

/** Пагинированный ответ /transactions. */
export const transactionsResponseSchema = z.object({
  items: z.array(transactionSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  summary: transactionsSummarySchema,
})
export type TransactionsResponse = z.infer<typeof transactionsResponseSchema>
