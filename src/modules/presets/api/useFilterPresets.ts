import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { FilterPresetScope } from "../model"
import { PRESETS_STALE_TIME, presetKeys } from "./queries"
import {
  type CreateFilterPresetPayload,
  createFilterPreset,
  deleteFilterPreset,
  getFilterPresets,
  renameFilterPreset,
} from "./requests"

/** One table's saved presets plus the mutations over them; each one refetches the list. */
export function useFilterPresets(scope: FilterPresetScope) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: presetKeys.list(scope) })

  const list = useQuery({
    queryKey: presetKeys.list(scope),
    queryFn: () => getFilterPresets(scope),
    staleTime: PRESETS_STALE_TIME,
  })

  const create = useMutation({
    mutationFn: (payload: Omit<CreateFilterPresetPayload, "scope">) =>
      createFilterPreset({ ...payload, scope }),
    onSuccess: invalidate,
  })

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameFilterPreset(id, name),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteFilterPreset(id),
    onSuccess: invalidate,
  })

  return { list, create, rename, remove }
}
