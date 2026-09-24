import { useLocalStorage } from "@mantine/hooks"
import { useCallback } from "react"

const STORAGE_KEY = "favorite-currencies"

/**
 * Currencies the user starred in a currency dropdown; they are listed first in every picker.
 * Kept in localStorage — per browser, not synced to the account. Mantine's hook broadcasts writes,
 * so starring in one picker reorders the others on the page (and in other tabs) right away.
 */
export function useFavoriteCurrencies() {
  const [favorites, setFavorites] = useLocalStorage<string[]>({
    key: STORAGE_KEY,
    defaultValue: [],
    // client-only app: read synchronously so the list doesn't reorder after the first render
    getInitialValueInEffect: false,
  })

  const toggleFavorite = useCallback(
    (code: string) =>
      setFavorites((prev) =>
        prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
      ),
    [setFavorites],
  )

  return { favorites, toggleFavorite }
}
