import { useQuery } from "@tanstack/react-query"
import { investingKeys, POSITIONS_STALE_TIME } from "./queries"
import type { TransfersParams } from "./requests"
import { getTransfers } from "./requests"

/** Deposit / withdrawal history, newest first. */
export function useTransfers(params: TransfersParams = {}) {
  return useQuery({
    queryKey: investingKeys.transfers(params),
    queryFn: () => getTransfers(params),
    staleTime: POSITIONS_STALE_TIME,
  })
}
