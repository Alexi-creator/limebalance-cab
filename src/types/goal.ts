import { z } from "zod"

/**
 * A savings goal from `GET /goals`. `currentAmount` is the sum of contributions; the derived
 * fields (`progress`, `remaining`, `monthsLeft`, `perMonth`, `isOverdue`, …) are computed by the
 * backend. The cross-goal aggregate fields in {@link goalsSummarySchema} may be null when exchange
 * rates are unavailable — render those as "—".
 */
export const goalSchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string().nullable(),
  targetAmount: z.coerce.number(),
  currentAmount: z.coerce.number(),
  currency: z.string(),
  /** Target date (ISO date) or null for an open-ended goal. */
  targetDate: z.coerce.date().nullable(),
  /** 0–100, rounded. */
  progress: z.coerce.number(),
  /** max(target − current, 0). */
  remaining: z.coerce.number(),
  /** Whole months left until the target date; null when there is no date. */
  monthsLeft: z.number().nullable(),
  /** remaining / monthsLeft; null when there is no date. */
  perMonth: z.coerce.number().nullable(),
  isCompleted: z.boolean(),
  isOverdue: z.boolean(),
  archived: z.boolean(),
  completedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
})
export type Goal = z.infer<typeof goalSchema>

/** Cross-goal aggregate for the top card. Amounts are in the base currency (null without rates). */
export const goalsSummarySchema = z.object({
  baseCurrency: z.string(),
  activeCount: z.number(),
  totalSaved: z.coerce.number().nullable(),
  totalTarget: z.coerce.number().nullable(),
  totalRemaining: z.coerce.number().nullable(),
  overallProgress: z.coerce.number().nullable(),
})
export type GoalsSummary = z.infer<typeof goalsSummarySchema>

export const goalsResponseSchema = z.object({
  items: z.array(goalSchema),
  summary: goalsSummarySchema,
})
export type GoalsResponse = z.infer<typeof goalsResponseSchema>

/** A single contribution from `GET /goals/:id/contributions`. Negative amount = withdrawal. */
export const contributionSchema = z.object({
  id: z.string(),
  amount: z.coerce.number(),
  note: z.string().nullable(),
  date: z.coerce.date(),
  createdAt: z.coerce.date(),
})
export type Contribution = z.infer<typeof contributionSchema>

export const contributionsSchema = z.array(contributionSchema)
