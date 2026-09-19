import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { transactionKeys } from "@/modules/transactions/api/queries"
import { investingKeys } from "./queries"

/**
 * Everything a transfer makes stale: the venue totals, the history itself, and the balance — money
 * sent to an exchange leaves it. No transaction list or category stat is touched, because a
 * transfer is neither an income nor an expense.
 */
export function useInvalidateTransferData() {
  const queryClient = useQueryClient()

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: investingKeys.venues })
    queryClient.invalidateQueries({ queryKey: investingKeys.allTransfers })
    // A P2P order shows whether it has been recorded yet.
    queryClient.invalidateQueries({ queryKey: investingKeys.allP2pOrders })
    // Coins and corrections feed a manual venue's value, so both go with it.
    queryClient.invalidateQueries({ queryKey: ["investing", "holdings"] })
    queryClient.invalidateQueries({ queryKey: ["investing", "adjustments"] })
    queryClient.invalidateQueries({ queryKey: transactionKeys.balance })
  }, [queryClient])
}
