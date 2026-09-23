import type { FilterPresetScope } from "../model"

export const presetKeys = {
  all: ["filter-presets"] as const,
  list: (scope: FilterPresetScope) => ["filter-presets", scope] as const,
}

/** Presets change only through this client — mutations invalidate, so the list never goes stale
 *  on its own. */
export const PRESETS_STALE_TIME = Number.POSITIVE_INFINITY
