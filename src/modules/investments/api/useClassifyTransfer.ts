import { useMutation } from "@tanstack/react-query"
import type { ClassifyTransferPayload } from "./requests"
import { classifyTransfer } from "./requests"
import { useInvalidateTransferData } from "./useInvalidateTransferData"

interface Options {
  transferId: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/** Says what an imported deposit or withdrawal was — the answer can move the free balance. */
export function useClassifyTransfer({ transferId, onSuccess, onError }: Options) {
  const invalidate = useInvalidateTransferData()

  return useMutation({
    mutationFn: (payload: ClassifyTransferPayload) => classifyTransfer(transferId, payload),
    onSuccess: () => {
      invalidate()
      onSuccess?.()
    },
    onError: (error) => onError?.(error),
  })
}
