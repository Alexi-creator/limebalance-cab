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
})

export type User = z.infer<typeof userSchema>
