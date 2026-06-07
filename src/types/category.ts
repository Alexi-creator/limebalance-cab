import { z } from "zod"

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Эмодзи категории; бэк может не вернуть — тогда на фронте берём фолбэк из палитры. */
  emoji: z.string().nullish(),
})

export type Category = z.infer<typeof categorySchema>

/** Сумма операций категории в одной валюте. */
export const categoryCurrencyTotalSchema = z.object({
  currency: z.string(),
  total: z.coerce.number(),
  count: z.coerce.number(),
})
export type CategoryCurrencyTotal = z.infer<typeof categoryCurrencyTotalSchema>

/**
 * Категория с агрегатами по операциям. Операции могут быть в разных валютах:
 * `totals` — разбивка по валютам, `approxTotal` — всё, приведённое к `baseCurrency`
 * (null, если курсы недоступны или валюта неизвестна).
 */
export const categoryStatsSchema = categorySchema.extend({
  count: z.coerce.number(),
  totals: z.array(categoryCurrencyTotalSchema).default([]),
  baseCurrency: z.string().nullish(),
  approxTotal: z.coerce.number().nullish(),
  /**
   * Сравнение с прошлым периодом — приходят, только если в запрос переданы
   * `compareFrom`/`compareTo`. `previousApproxTotal` — сумма категории за прошлый
   * период в базовой валюте, `deltaApproxTotal` — разница (текущий − прошлый).
   */
  previousApproxTotal: z.coerce.number().nullish(),
  deltaApproxTotal: z.coerce.number().nullish(),
})

export type CategoryStats = z.infer<typeof categoryStatsSchema>

/** Тело запроса создания/обновления категории. */
export interface CategoryPayload {
  name: string
  emoji?: string
}
