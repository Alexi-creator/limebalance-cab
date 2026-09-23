import { z } from "zod"
import { ApiError } from "@/shared/api/apiError"

/** Which table a preset belongs to — each has its own filter params. */
export type FilterPresetScope = "transactions" | "positions"

/** A filter value as it can sit in a table's URL. */
export type PresetFilterValue = string | number | boolean | string[]

/** A table's filters with every default left out — what a preset stores. */
export type PresetFilters = Record<string, PresetFilterValue>

const presetFilterValueSchema = z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])

export const filterPresetSchema = z.object({
  id: z.string(),
  scope: z.enum(["transactions", "positions"]),
  name: z.string(),
  filters: z.record(z.string(), presetFilterValueSchema),
  createdAt: z.coerce.date(),
})

export const filterPresetsResponseSchema = z.array(filterPresetSchema)

export type FilterPreset = z.infer<typeof filterPresetSchema>

const presetConflictSchema = z.object({
  code: z.enum(["PRESET_FILTERS_EXIST", "PRESET_NAME_EXISTS"]),
})

/** Which uniqueness rule a failed save/rename hit, or null when it failed for another reason. */
export function presetConflictOf(error: unknown) {
  if (!(error instanceof ApiError)) return null
  const parsed = presetConflictSchema.safeParse(error.body)
  return parsed.success ? parsed.data.code : null
}
