import { useMutation } from "@tanstack/react-query"
import type { TransferPayload, UpdateTransferPayload } from "./requests"
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
      transferId ? updateTransfer(transferId, toUpdate(payload)) : createTransfer(payload),
    onSuccess: () => {
      invalidate()
      onSuccess?.()
    },
    onError: (error) => onError?.(error),
  })
}

/**
 * The edit endpoint rejects anything it cannot change — the venue, the peer, the coin. A coin move
 * also keeps its size and direction: those shifted the venues' composition, so changing them means
 * deleting it and recording a new one. An empty note is sent as null so clearing it sticks.
 */
function toUpdate({ asset, direction, amount, currency, date, note }: TransferPayload) {
  const payload: UpdateTransferPayload = { date, note: note ?? null }
  return asset ? payload : { ...payload, direction, amount, currency }
}
