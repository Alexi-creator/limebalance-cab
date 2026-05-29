import { RouteNames } from "@constants/routeNames"
import { useAuthStore } from "@store/authStore"
import { Navigate, Outlet } from "react-router-dom"

/**
 * Route-обёртка для приватных страниц.
 * Перенаправляет неавторизованного пользователя на страницу входа.
 * Не принимает пропсов — использует `<Outlet />` для рендера дочерних маршрутов.
 */
export function ProtectedRoute() {
  const user = useAuthStore((s) => s.user)

  if (!user) return <Navigate to={RouteNames.Auth} replace />

  return <Outlet />
}
