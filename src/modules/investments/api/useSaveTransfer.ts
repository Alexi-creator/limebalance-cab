import { useMutation } from "@tanstack/react-query"
import type { TransferPayload } from "./requests"
import { createTransfer, updateTransfer } from "./requests"
import { useInvalidateTransferData } from "./useInvalidateTransferData"

interface Options {
  /** Id of the transfer being edited; absent when recording a new one. */
  transferId?: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/** Records or edits a deposit / withdrawal. */
export function useSaveTransfer({ transferId, onSuccess, onError }: Options) {
  const invalidate = useInvalidateTransferData()

  return useMutation({
    mutationFn: (payload: TransferPayload) =>
      transferId ? updateTransfer(transferId, payload) : createTransfer(payload),
    onSuccess: () => {
      invalidate()
      onSuccess?.()
    },
    onError: (error) => onError?.(error),
  })
}
