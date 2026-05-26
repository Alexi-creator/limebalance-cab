import { z } from "zod"

export const userSchema = z.object({
  email: z.email().nullish(),
  telegramId: z.string().nullish(),
  subscription: z.string().nullish(),
})

export type User = z.infer<typeof userSchema>
