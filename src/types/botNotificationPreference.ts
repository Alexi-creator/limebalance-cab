import { z } from "zod"

/**
 * A user's opt-in/out for one type of proactive Telegram bot push (e.g. `monthly_digest`,
 * `trade_closed`). The list of types is open-ended — the backend may add more — so the UI
 * renders whatever `GET /notifications/preferences` returns instead of hardcoding types.
 */
export const botNotificationPreferenceSchema = z.object({
  type: z.string(),
  enabled: z.boolean(),
})
export type BotNotificationPreference = z.infer<typeof botNotificationPreferenceSchema>
