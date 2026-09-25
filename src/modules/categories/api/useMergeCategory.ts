import { useMutation, useQueryClient } from "@tanstack/react-query"
import { presetKeys } from "@/modules/presets/api/queries"
import { useInvalidateUsage } from "@/modules/subscription/api/useUsage"
import { transactionKeys } from "@/modules/transactions/api/queries"
import { expenseCategoryKeys, incomeCategoryKeys } from "./queries"
import { mergeCategory } from "./requests"

interface Options {
  isExpense: boolean
  /** The category being folded in — it is deleted on success. */
  sourceId: string
  onSuccess?: () => void
}

/**
 * Merges a category into another of the same kind. Its transactions move to the target, saved
 * presets are repointed, and the source is gone — so categories, transactions, presets and the
 * plan's category counter all change.
 */
export function useMergeCategory({ isExpense, sourceId, onSuccess }: Options) {
  const queryClient = useQueryClient()
  const invalidateUsage = useInvalidateUsage()

  return useMutation({
    mutationFn: (targetId: string) => mergeCategory(isExpense, sourceId, targetId),
    onSuccess: () => {
      const keys = isExpense ? expenseCategoryKeys : incomeCategoryKeys
      queryClient.invalidateQueries({ queryKey: keys.stats })
      queryClient.invalidateQueries({ queryKey: keys.all, exact: true })
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      queryClient.invalidateQueries({ queryKey: presetKeys.all })
      invalidateUsage()
      onSuccess?.()
    },
  })
}
