import { z } from "zod"

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Эмодзи категории; бэк может не вернуть — тогда на фронте берём фолбэк из палитры. */
  emoji: z.string().nullish(),
})

export type Category = z.infer<typeof categorySchema>

/** Категория с агрегатами по операциям: `total` — сумма, `count` — число операций. */
export const categoryStatsSchema = categorySchema.extend({
  total: z.coerce.number(),
  count: z.coerce.number(),
})

export type CategoryStats = z.infer<typeof categoryStatsSchema>

/** Тело запроса создания/обновления категории. */
export interface CategoryPayload {
  name: string
  emoji?: string
}
