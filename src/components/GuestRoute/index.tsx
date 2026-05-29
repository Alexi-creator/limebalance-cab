import { RouteNames } from "@constants/routeNames"
import { useAuthStore } from "@store/authStore"
import { Navigate, Outlet } from "react-router-dom"

/**
 * Route-обёртка для публичных страниц (авторизация, регистрация).
 * Перенаправляет авторизованного пользователя на главную страницу.
 * Не принимает пропсов — использует `<Outlet />` для рендера дочерних маршрутов.
 */
export function GuestRoute() {
  const user = useAuthStore((s) => s.user)

  if (user) return <Navigate to={RouteNames.Home} replace />

  return <Outlet />
}
