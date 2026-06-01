import { categorySchema } from "@appTypes/category"
import { z } from "zod"

export const incomeSchema = z.object({
  id: z.string(),
  amount: z.coerce.number(),
  description: z.string(),
  date: z.coerce.date(),
  createdAt: z.coerce.date(),
  category: categorySchema,
})

export const incomesSummarySchema = z.object({
  total: z.string(),
  byMonth: z.array(z.object({ month: z.string(), total: z.string() })),
})

/** Ответ POST /incomes: созданная строка без вложенной категории (только `categoryId`). */
export const createdIncomeSchema = z.object({
  id: z.string(),
  amount: z.coerce.number(),
  description: z.string(),
  date: z.coerce.date(),
  createdAt: z.coerce.date(),
  categoryId: z.string(),
})

export type Income = z.infer<typeof incomeSchema>
export type IncomesSummary = z.infer<typeof incomesSummarySchema>
export type CreatedIncome = z.infer<typeof createdIncomeSchema>
