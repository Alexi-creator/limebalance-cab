import { z } from "zod"

/**
 * Structured data behind a `monthly_summary` notification. The bell renders (and localizes) the
 * card from this instead of the server's `title`/`body`, which are Russian-only fallbacks.
 */
export const monthlySummaryPayloadSchema = z.object({
  /** Calendar month as `YYYY-MM`. */
  period: z.string(),
  baseCurrency: z.string(),
  /** Totals converted to the base currency; null when exchange rates are unavailable. */
  income: z.number().nullable(),
  expense: z.number().nullable(),
  net: z.number().nullable(),
  topCategory: z.object({ name: z.string(), emoji: z.string().nullable() }).nullable(),
})
export type MonthlySummaryPayload = z.infer<typeof monthlySummaryPayloadSchema>

/** Structured data behind a `goal_completed` notification (the goal that just hit 100%). */
export const goalCompletedPayloadSchema = z.object({
  goalId: z.string(),
  name: z.string(),
})
export type GoalCompletedPayload = z.infer<typeof goalCompletedPayloadSchema>

/**
 * A notification from `GET /notifications`. `type` drives the icon and whether the card is rendered
 * from {@link monthlySummaryPayloadSchema} (`monthly_summary`) or from the server `title`/`body`
 * fallback (`news` and anything else). Read state is persisted on the backend via `isRead`.
 */
export const notificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  /** Server-rendered fallback text; may be null — never relied on when a `type` template exists. */
  title: z.string().nullable(),
  body: z.string().nullable(),
  payload: z.unknown().nullable(),
  isRead: z.boolean(),
  createdAt: z.coerce.date(),
})
export type AppNotification = z.infer<typeof notificationSchema>

export const notificationsResponseSchema = z.object({
  items: z.array(notificationSchema),
  unreadCount: z.number(),
})
export type NotificationsResponse = z.infer<typeof notificationsResponseSchema>

/** Shape returned by the mark-read endpoints. */
export const unreadCountSchema = z.object({
  unreadCount: z.number(),
})
