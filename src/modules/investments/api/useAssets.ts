import { useQuery } from "@tanstack/react-query"
import { COIN_ICONS_STALE_TIME, investingKeys } from "./queries"
import { getAssets } from "./requests"

/**
 * Tickers we can put a price on. Cached as long as the coin icons: the list only changes when the
 * exchange lists a new pair, and a stale entry is harmless — the backend prices it either way.
 */
export function useAssets() {
  return useQuery({
    queryKey: investingKeys.assets,
    queryFn: getAssets,
    staleTime: COIN_ICONS_STALE_TIME,
  })
}
