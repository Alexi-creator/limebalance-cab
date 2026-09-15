import { useQuery } from "@tanstack/react-query"
import { HOLDINGS_STALE_TIME, investingKeys } from "./queries"
import { getAdjustments, getVenueHoldings } from "./requests"

/**
 * What a manual venue is made of: the coins tracked inside it and the corrections applied to it.
 *
 * Only asked for when a venue's details are actually opened — a connected exchange reports its own
 * coins with the balance, so it never needs either of these.
 */
export function useVenueHoldings(venueId: string, enabled = true) {
  return useQuery({
    queryKey: investingKeys.venueHoldings(venueId),
    queryFn: () => getVenueHoldings(venueId),
    staleTime: HOLDINGS_STALE_TIME,
    enabled,
  })
}

export function useAdjustments(venueId: string, enabled = true) {
  return useQuery({
    queryKey: investingKeys.adjustments(venueId),
    queryFn: () => getAdjustments(venueId),
    enabled,
  })
}
