import { RouteNames } from "@constants/routeNames"
import { useAuthStore } from "@store/authStore"
import { Navigate, Outlet } from "react-router-dom"

export function GuestRoute() {
  const user = useAuthStore((s) => s.user)

  if (user) return <Navigate to={RouteNames.Home} replace />

  return <Outlet />
}
