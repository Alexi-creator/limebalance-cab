import { RouteNames } from "@constants/routeNames"
import { useAuthStore } from "@store/authStore"
import { Navigate, Outlet } from "react-router-dom"

/**
 * Route wrapper for private pages.
 * Redirects an unauthenticated user to the login page.
 * Takes no props — uses `<Outlet />` to render child routes.
 */
export function ProtectedRoute() {
  const user = useAuthStore((s) => s.user)

  if (!user) return <Navigate to={RouteNames.Auth} replace />

  return <Outlet />
}
