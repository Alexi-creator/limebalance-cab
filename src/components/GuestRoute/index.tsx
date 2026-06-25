import { RouteNames } from "@constants/routeNames"
import { useAuthStore } from "@store/authStore"
import { Navigate, Outlet } from "react-router-dom"

/**
 * Route wrapper for public pages (login, registration).
 * Redirects an authenticated user to the home page.
 * Takes no props — uses `<Outlet />` to render child routes.
 */
export function GuestRoute() {
  const user = useAuthStore((s) => s.user)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  console.log(
    "[AUTH_DBG] GuestRoute render init=",
    isInitialized,
    "user=",
    !!user,
    "path=",
    window.location.pathname,
  )

  if (user) return <Navigate to={RouteNames.Home} replace />

  return <Outlet />
}
