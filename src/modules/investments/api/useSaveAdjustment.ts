import { useMutation } from "@tanstack/react-query"
import type { AdjustmentPayload } from "./requests"
import { createAdjustment, deleteAdjustment } from "./requests"
import { useInvalidateTransferData } from "./useInvalidateTransferData"

interface Options {
  venueId: string
  onSuccess?: () => void
  /** 400 when the venue is read from the exchange — the correction would be overwritten. */
  onError?: (error: Error) => void
}

export function useSaveAdjustment({ venueId, onSuccess, onError }: Options) {
  const invalidate = useInvalidateTransferData()

  return useMutation({
    mutationFn: (payload: AdjustmentPayload) => createAdjustment(venueId, payload),
    onSuccess: () => {
      invalidate()
      onSuccess?.()
    },
    onError: (error) => onError?.(error),
  })
}

export function useDeleteAdjustment({ onSuccess, onError }: Omit<Options, "venueId">) {
  const invalidate = useInvalidateTransferData()

  return useMutation({
    mutationFn: (id: string) => deleteAdjustment(id),
    onSuccess: () => {
      invalidate()
      onSuccess?.()
    },
    onError: (error) => onError?.(error),
  })
}
