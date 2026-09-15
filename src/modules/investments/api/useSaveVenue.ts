import { useMutation } from "@tanstack/react-query"
import { createVenue, updateVenue } from "./requests"
import { useInvalidateTransferData } from "./useInvalidateTransferData"

interface Options {
  /** Id of the venue being edited; absent when adding a new one. */
  venueId?: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/** Adds a manual venue, or renames / archives an existing one. */
export function useSaveVenue({ venueId, onSuccess, onError }: Options) {
  const invalidate = useInvalidateTransferData()

  return useMutation({
    mutationFn: (payload: { name: string; archived?: boolean }) =>
      venueId ? updateVenue(venueId, payload) : createVenue(payload.name),
    onSuccess: () => {
      invalidate()
      onSuccess?.()
    },
    onError: (error) => onError?.(error),
  })
}
