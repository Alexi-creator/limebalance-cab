import { API_URLS } from "@/shared/api/apiUrls"
import { HttpMethods } from "@/shared/api/httpMethods"
import { request } from "@/shared/api/request"
import {
  type FilterPresetScope,
  filterPresetSchema,
  filterPresetsResponseSchema,
  type PresetFilters,
} from "../model"

export function getFilterPresets(scope: FilterPresetScope) {
  return request(`${API_URLS.filterPresets.presets}?scope=${scope}`, {
    schema: filterPresetsResponseSchema,
  })
}

export interface CreateFilterPresetPayload {
  scope: FilterPresetScope
  name: string
  filters: PresetFilters
}

/** 409 when the same filters or the same name are already saved in this table — see
 *  presetConflictOf. */
export function createFilterPreset(payload: CreateFilterPresetPayload) {
  return request(API_URLS.filterPresets.presets, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
    schema: filterPresetSchema,
  })
}

export function renameFilterPreset(id: string, name: string) {
  return request(`${API_URLS.filterPresets.presets}/${id}`, {
    method: HttpMethods.PATCH,
    body: JSON.stringify({ name }),
    schema: filterPresetSchema,
  })
}

export function deleteFilterPreset(id: string) {
  return request(`${API_URLS.filterPresets.presets}/${id}`, { method: HttpMethods.DELETE })
}
