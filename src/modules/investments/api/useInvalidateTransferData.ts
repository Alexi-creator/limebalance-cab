import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { expenseKeys, incomeKeys, transactionKeys } from "@/modules/transactions/api/queries"
import { investingKeys } from "./queries"

/**
 * Everything a transfer makes stale: the venue totals, the history itself, and the balance — money
 * sent to an exchange leaves it. A plain transfer is neither an income nor an expense, but one
 * answered as income or expense writes a real transaction, so the transaction lists go too.
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
    // A movement answered as income or expense writes a real transaction: the operations list,
    // the category stats and the analytics all change with it.
    queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    queryClient.invalidateQueries({ queryKey: incomeKeys.all })
    queryClient.invalidateQueries({ queryKey: expenseKeys.all })
  }, [queryClient])
}
