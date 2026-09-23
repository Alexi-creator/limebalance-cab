import type { PresetFilters, PresetFilterValue } from "../model"

/**
 * One form for a filter set, so two sets that filter the same way compare equal: keys sorted,
 * arrays sorted and de-duplicated, empty values dropped. Mirrors the backend's
 * canonicalizeFilters — the stored copy comes back from JSONB with its keys reordered, so both
 * sides of a comparison go through this.
 */
export function canonicalizeFilters(
  filters: Record<string, PresetFilterValue | null | undefined>,
): PresetFilters {
  const out: PresetFilters = {}
  for (const key of Object.keys(filters).sort()) {
    const value = filters[key]
    if (value == null || value === "") continue
    if (Array.isArray(value)) {
      const items = [...new Set(value)].sort()
      if (items.length > 0) out[key] = items
      continue
    }
    out[key] = value
  }
  return out
}

/** A comparable key for a filter set; equal for sets canonicalizeFilters makes equal. */
export const filtersKey = (filters: Record<string, PresetFilterValue | null | undefined>) =>
  JSON.stringify(canonicalizeFilters(filters))

export const hasFilters = (filters: PresetFilters) => Object.keys(filters).length > 0
