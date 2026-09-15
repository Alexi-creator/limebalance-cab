import { useMutation } from "@tanstack/react-query"
import { deleteVenue } from "./requests"
import { useInvalidateTransferData } from "./useInvalidateTransferData"

interface Options {
  onSuccess?: () => void
  /** 400 means the venue still has transfers on record — surface the message as-is. */
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
