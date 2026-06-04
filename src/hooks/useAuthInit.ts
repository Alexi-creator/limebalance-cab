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
        if (isAuthError) setUser(null)
      } finally {
        setInitialized()
      }
    }

    init()
  }, [setUser, setInitialized])

  return { isInitialized }
}
