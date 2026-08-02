import { getCoinIcons } from "@api/investing"
import { COIN_ICONS_STALE_TIME, investingKeys } from "@constants/queries/investing"
import { useQuery } from "@tanstack/react-query"

/**
 * Ticker -> icon URL map for CoinIcon. Cached long (icons practically never change) and safe to
 * call from anywhere — an empty map (e.g. the server has no BYBIT_ICON_API_KEY) just means every
 * CoinIcon falls back to its letter avatar, never a loading/error state worth surfacing.
 */
export function useCoinIcons() {
  return useQuery({
    queryKey: investingKeys.coinIcons,
    queryFn: getCoinIcons,
    staleTime: COIN_ICONS_STALE_TIME,
  })
}
