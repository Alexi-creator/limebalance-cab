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

/** Месяц сводки: разбивка по валютам + прибл. сумма в базовой валюте. */
export const monthSummarySchema = z.object({
  month: z.string(),
  totals: z.array(summaryCurrencyTotalSchema).default([]),
  /** Прибл. сумма за месяц в базовой валюте; null, если курсы недоступны. */
  approxTotal: z.coerce.number().nullable(),
})

/**
 * Сводка доходов за период. Операции могут быть в разных валютах: помесячно — `totals`
 * (разбивка по валютам) и `approxTotal` (приведённое к `baseCurrency`); `total` —
 * прибл. итог за весь период в базовой валюте.
 */
export const incomesSummarySchema = z.object({
  baseCurrency: z.string(),
  total: z.coerce.number().nullable(),
  byMonth: z.array(monthSummarySchema),
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
