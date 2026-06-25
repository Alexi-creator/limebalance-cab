import { getUsage } from "@api/subscriptions"
import { subscriptionKeys, USAGE_STALE_TIME } from "@constants/queries/subscriptions"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"

/**
 * Current plan usage (categories / transactions) for limit warnings.
 * Shared cache key, so every consumer reads the same counter.
 */
export function useUsage() {
  return useQuery({
    queryKey: subscriptionKeys.usage,
    queryFn: getUsage,
    staleTime: USAGE_STALE_TIME,
  })
}

/**
 * Returns a callback that refreshes the usage counter. Call it after a category/transaction
 * is created (or a 403 reveals the counter is stale) so warnings/blocking stay in sync.
 */
export function useInvalidateUsage() {
  const queryClient = useQueryClient()
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: subscriptionKeys.usage }),
    [queryClient],
  )
}
