import { z } from "zod"

export const planSchema = z.object({
  id: z.string(),
  name: z.string(),
  maxCategories: z.number().nullish(),
  maxExpenses: z.number().nullish(),
  maxIncomes: z.number().nullish(),
  /** Decimal serialized as a string, e.g. "12.00" */
  price: z.string(),
  /** Unlocks the investing / crypto section */
  investingAccess: z.boolean(),
})

export const subscriptionSchema = z.object({
  plan: planSchema,
  /** ISO date-time or null (null = perpetual, e.g. the ultra/lifetime plan) */
  expiresAt: z.string().nullish(),
})

export const userSchema = z.object({
  // id: z.string(),
  email: z.email().nullish(),
  telegramId: z.string().nullish(),
  name: z.string().nullish(),
  // locale: z.string().default("en"),
  currency: z.string().nullish(),
  timezone: z.string().nullish(),
  subscription: subscriptionSchema.nullish(),
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
