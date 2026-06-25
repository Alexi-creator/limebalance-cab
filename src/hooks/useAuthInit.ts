import { ApiError } from "@api/apiError"
import { checkAuth } from "@api/auth"
import { useAuthStore } from "@store/authStore"
import { syncTimezone } from "@utils/syncTimezone"
import { useEffect, useRef } from "react"

export function useAuthInit() {
  const { setUser, setInitialized, isInitialized } = useAuthStore()
  const initialized = useRef(false)

  useEffect(() => {
    const resolveUser = async () => {
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
      }
    }

    if (!initialized.current) {
      initialized.current = true
      resolveUser().finally(setInitialized)
    }

    // When the page is restored from the bfcache (clicking a browser bookmark, or
    // back/forward), React does not remount: the in-memory auth state is frozen from
    // the previous visit and can be stale relative to the current session cookies —
    // e.g. a logged-in user left staring at the login page. Re-validate on restore.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) resolveUser()
    }
    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
  }, [setUser, setInitialized])

  return { isInitialized }
}
