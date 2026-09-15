import { useMutation } from "@tanstack/react-query"
import type { VenueHoldingPayload } from "./requests"
import { createVenueHolding, deleteVenueHolding, updateVenueHolding } from "./requests"
import { useInvalidateTransferData } from "./useInvalidateTransferData"

interface Options {
  /** Id of the coin row being edited; absent when adding one. */
  holdingId?: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/** Adds or edits a coin tracked inside a manual venue. */
export function useSaveVenueHolding({ holdingId, onSuccess, onError }: Options) {
  const invalidate = useInvalidateTransferData()

  return useMutation({
    mutationFn: (payload: VenueHoldingPayload) =>
      holdingId ? updateVenueHolding(holdingId, payload) : createVenueHolding(payload),
    onSuccess: () => {
      invalidate()
      onSuccess?.()
    },
    onError: (error) => onError?.(error),
  })
}

export function useDeleteVenueHolding({ onSuccess, onError }: Omit<Options, "holdingId"> = {}) {
  const invalidate = useInvalidateTransferData()

  return useMutation({
    mutationFn: (id: string) => deleteVenueHolding(id),
    onSuccess: () => {
      invalidate()
      onSuccess?.()
    },
    onError: (error) => onError?.(error),
  })
}
