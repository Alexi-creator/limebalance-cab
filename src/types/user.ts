import { z } from "zod"

export const userSchema = z.object({
  // id: z.string(),
  email: z.email().nullish(),
  telegramId: z.string().nullish(),
  name: z.string().nullish(),
  // locale: z.string().default("en"),
  currency: z.string().nullish(),
  timezone: z.string().nullish(),
  subscription: z.string().nullish(),
  /** Whether a password is set. Users who signed in via Google/Telegram may not have one. */
  hasPassword: z.boolean().nullish(),
  /**
   * Email awaiting confirmation. The backend writes `email` only after the user follows the
   * link from the confirmation message; until then the submitted address lives in `pendingEmail`.
   * So the three states are: no email at all (`email` and `pendingEmail` both null), awaiting
   * confirmation (`email` null, `pendingEmail` set), confirmed (`email` set).
   */
  pendingEmail: z.email().nullish(),
})

export type User = z.infer<typeof userSchema>
