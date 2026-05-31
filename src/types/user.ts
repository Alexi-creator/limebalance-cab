import { z } from "zod"

export const userSchema = z.object({
  // id: z.string(),
  email: z.email().nullish(),
  telegramId: z.string().nullish(),
  name: z.string().nullish(),
  // locale: z.string().default("en"),
  subscription: z.string().nullish(),
})

export type User = z.infer<typeof userSchema>
