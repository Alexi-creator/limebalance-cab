import { categorySchema } from "@appTypes/category"
import { z } from "zod"

export const expenseSchema = z.object({
  id: z.string(),
  amount: z.coerce.number(),
  description: z.string(),
  date: z.coerce.date(),
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
 * Сводка трат за период. Операции могут быть в разных валютах: помесячно — `totals`
 * (разбивка по валютам) и `approxTotal` (приведённое к `baseCurrency`); `total` —
 * прибл. итог за весь период в базовой валюте.
 */
export const expensesSummarySchema = z.object({
  baseCurrency: z.string(),
  total: z.coerce.number().nullable(),
  byMonth: z.array(monthSummarySchema),
})

/** Ответ POST /expenses: созданная строка без вложенной категории (только `categoryId`). */
export const createdExpenseSchema = z.object({
  id: z.string(),
  amount: z.coerce.number(),
  description: z.string(),
  date: z.coerce.date(),
  createdAt: z.coerce.date(),
  categoryId: z.string(),
})

export type Expense = z.infer<typeof expenseSchema>
export type ExpensesSummary = z.infer<typeof expensesSummarySchema>
export type CreatedExpense = z.infer<typeof createdExpenseSchema>
