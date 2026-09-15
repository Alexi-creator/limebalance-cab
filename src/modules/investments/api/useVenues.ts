import { useQuery } from "@tanstack/react-query"
import { investingKeys, POSITIONS_STALE_TIME } from "./queries"
import { getVenues } from "./requests"

/** Connected exchanges + manual venues, each with the net sent there. */
export function useVenues() {
  return useQuery({
    queryKey: investingKeys.venues,
    queryFn: getVenues,
    staleTime: POSITIONS_STALE_TIME,
  })
}
