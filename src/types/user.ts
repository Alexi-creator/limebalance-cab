import { z } from "zod"

export const userSchema = z.object({
  id: z.string(),
  email: z.email().optional(),
  telegramId: z.string().optional(),
  name: z.string().optional(),
  locale: z.string().default("en"),
})

export type User = z.infer<typeof userSchema>
