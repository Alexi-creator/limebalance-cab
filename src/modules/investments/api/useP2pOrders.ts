import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { investingKeys, P2P_STALE_TIME } from "./queries"
import { getP2pOrders } from "./requests"

export const P2P_PAGE_SIZE = 20

/** One page of an account's P2P orders. Not retried: a refusal is the key, not the network. */
export function useP2pOrders(accountId: string | null, page: number) {
  return useQuery({
    queryKey: investingKeys.p2pOrders(accountId ?? "", page),
    queryFn: () => getP2pOrders(accountId as string, page, P2P_PAGE_SIZE),
    enabled: !!accountId,
    staleTime: P2P_STALE_TIME,
    placeholderData: keepPreviousData,
    retry: false,
  })
}
