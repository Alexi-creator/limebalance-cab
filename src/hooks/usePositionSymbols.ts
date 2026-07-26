import { getPositionSymbols } from "@api/investing"
import { investingKeys, POSITION_SYMBOLS_STALE_TIME } from "@constants/queries/investing"
import { useQuery } from "@tanstack/react-query"

/**
 * Every symbol the user has ever traded (bybit-synced or manual) — powers the trade journal's
 * Pair filter autocomplete. Changes rarely, so cached long; no invalidation wired up for it.
 */
export function usePositionSymbols() {
  return useQuery({
    queryKey: investingKeys.positionSymbols,
    queryFn: getPositionSymbols,
    staleTime: POSITION_SYMBOLS_STALE_TIME,
  })
}
