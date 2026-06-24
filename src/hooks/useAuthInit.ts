import { ApiError } from "@api/apiError"
import { checkAuth } from "@api/auth"
import { useAuthStore } from "@store/authStore"
import { syncTimezone } from "@utils/syncTimezone"
import { useEffect, useRef } from "react"

export function useAuthInit() {
  const { setUser, setInitialized, isInitialized } = useAuthStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const init = async () => {
      try {
        const user = await checkAuth()
        setUser(user)
        syncTimezone(user)
      } catch (err) {
        const isAuthError = err instanceof ApiError && err.status < 500
        // Only a real auth failure means "logged out". Anything else (schema drift, 5xx,
        // network) is unexpected — log it instead of silently treating the user as a guest.
        if (isAuthError) setUser(null)
        else console.error("auth init failed:", err)
      } finally {
        setInitialized()
      }
    }

    init()
  }, [setUser, setInitialized])

  return { isInitialized }
}
