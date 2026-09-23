import { useMutation, useQueryClient } from "@tanstack/react-query"
import { investingKeys } from "./queries"
import { setP2pAutoRecord } from "./requests"
import { useInvalidateTransferData } from "./useInvalidateTransferData"

interface Options {
  onSuccess?: (enabled: boolean) => void
  onError?: (error: Error) => void
}

/** Switches P2P auto-recording for one account. Recorded orders move the wallet balance. */
export function useSetP2pAutoRecord({ onSuccess, onError }: Options = {}) {
  const queryClient = useQueryClient()
  const invalidateTransfers = useInvalidateTransferData()

  return useMutation({
    mutationFn: ({ accountId, enabled }: { accountId: string; enabled: boolean }) =>
      setP2pAutoRecord(accountId, enabled),
    onSuccess: (_, { enabled }) => {
      queryClient.invalidateQueries({ queryKey: investingKeys.accounts })
      invalidateTransfers()
      onSuccess?.(enabled)
    },
    onError: (error) => onError?.(error),
  })
}
