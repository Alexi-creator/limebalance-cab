import { z } from "zod"

export const transactionTypeSchema = z.enum(["income", "expense"])
export type TransactionType = z.infer<typeof transactionTypeSchema>

/** Одна транзакция из объединённого роута /transactions (категория — плоская). */
export const transactionSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  categoryName: z.string().nullable(),
  amount: z.coerce.number(),
  description: z.string(),
  date: z.coerce.date(),
  type: transactionTypeSchema,
})
export type Transaction = z.infer<typeof transactionSchema>

/** Пагинированный ответ /transactions. */
export const transactionsResponseSchema = z.object({
  items: z.array(transactionSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})
export type TransactionsResponse = z.infer<typeof transactionsResponseSchema>
