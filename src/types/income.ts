import { categorySchema } from "@appTypes/category"
import { wallClockDate } from "@utils/wallClock"
import { z } from "zod"

export const incomeSchema = z.object({
  id: z.string(),
  amount: z.coerce.number(),
  description: z.string(),
  date: wallClockDate(),
  createdAt: z.coerce.date(),
  category: categorySchema,
})

/** Сумма за период в одной валюте (валюты между собой не складываются). */
export const summaryCurrencyTotalSchema = z.object({
  currency: z.string(),
  total: z.coerce.number(),
  count: z.coerce.number(),
})

/**
 * Бакет сводки: разбивка по валютам + прибл. сумма в базовой валюте. `bucket` —
 * метка интервала: `YYYY-MM-DD` для day/week (week = дата понедельника), `YYYY-MM`
 * для month. Пустые бакеты бэк возвращает с пустыми `totals` и `approxTotal` (рисуем 0).
 */
export const bucketSummarySchema = z.object({
  bucket: z.string(),
  totals: z.array(summaryCurrencyTotalSchema).default([]),
  /** Прибл. сумма за бакет в базовой валюте; null, если курсы недоступны. */
  approxTotal: z.coerce.number().nullable(),
})

/**
 * Сводка доходов за период с разбивкой по бакетам выбранной гранулярности. Операции
 * могут быть в разных валютах: по бакетам — `totals` (разбивка по валютам) и
 * `approxTotal` (приведённое к `baseCurrency`); `total` — прибл. итог за весь период.
 */
export const incomesSummarySchema = z.object({
  baseCurrency: z.string(),
  granularity: z.enum(["day", "week", "month"]),
  total: z.coerce.number().nullable(),
  buckets: z.array(bucketSummarySchema),
})

/** Ответ POST /incomes: созданная строка без вложенной категории (только `categoryId`). */
export const createdIncomeSchema = z.object({
  id: z.string(),
  amount: z.coerce.number(),
  description: z.string(),
  date: wallClockDate(),
  createdAt: z.coerce.date(),
  categoryId: z.string(),
})

export type Income = z.infer<typeof incomeSchema>
export type IncomesSummary = z.infer<typeof incomesSummarySchema>
export type CreatedIncome = z.infer<typeof createdIncomeSchema>
