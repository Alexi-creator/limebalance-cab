import { useMutation } from "@tanstack/react-query"
import { deleteTransfer } from "./requests"
import { useInvalidateTransferData } from "./useInvalidateTransferData"

interface Options {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/** Deletes a transfer — the money returns to the free balance, it was never really spent. */
export function useDeleteTransfer({ onSuccess, onError }: Options = {}) {
  const invalidate = useInvalidateTransferData()

  return useMutation({
    mutationFn: (id: string) => deleteTransfer(id),
    onSuccess: () => {
      invalidate()
      onSuccess?.()
    },
    onError: (error) => onError?.(error),
  })
}
