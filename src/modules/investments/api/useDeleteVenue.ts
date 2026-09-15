import { useMutation } from "@tanstack/react-query"
import { deleteVenue } from "./requests"
import { useInvalidateTransferData } from "./useInvalidateTransferData"

interface Options {
  onSuccess?: () => void
  /**
   * 400 means the venue is not empty. It carries a VENUE_NOT_EMPTY code and the counts behind it
   * (see `venueBlockersOf`), so the caller can answer with a way out rather than a message.
   */
  onError?: (error: Error) => void
}

export function useDeleteVenue({ onSuccess, onError }: Options = {}) {
  const invalidate = useInvalidateTransferData()

  return useMutation({
    mutationFn: (id: string) => deleteVenue(id),
    onSuccess: () => {
      invalidate()
      onSuccess?.()
    },
    onError: (error) => onError?.(error),
  })
}
