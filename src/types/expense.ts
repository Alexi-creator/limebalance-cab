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

export const expensesSummarySchema = z.object({
  total: z.string(),
  byMonth: z.array(z.object({ month: z.string(), total: z.string() })),
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
