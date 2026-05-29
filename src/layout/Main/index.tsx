import { AccountAlert } from "@components/AccountAlert"
import { RouteNames } from "@constants/routeNames"
import { AppShell, LoadingOverlay } from "@mantine/core"
import { useLoaderStore } from "@store/loaderStore"
import { Outlet, useLocation } from "react-router-dom"

const FILL_HEIGHT_ROUTES = new Set<string>([RouteNames.Transactions])

/**
 * Основная контентная область приложения (AppShell.Main).
 * Показывает глобальный LoadingOverlay, AccountAlert и рендерит дочерние маршруты через `<Outlet />`.
 * На странице транзакций отключает прокрутку (overflow: hidden) для таблицы с фиксированной высотой.
 * Не принимает пропсов.
 */
export function Main() {
  const { isLoading } = useLoaderStore()
  const { pathname } = useLocation()
  const isFillHeight = FILL_HEIGHT_ROUTES.has(pathname)

  return (
    <AppShell.Main
      bg="var(--mantine-color-default)"
      className="main-fixed"
      style={{
        position: "fixed",
        top: "var(--app-shell-header-height, 64px)",
        right: 0,
        bottom: 0,
        minHeight: 0,
        overflowY: isFillHeight ? "hidden" : "auto",
        padding: "var(--mantine-spacing-md)",
      }}
    >
      <LoadingOverlay visible={isLoading} />
      <AccountAlert />
      <Outlet />
    </AppShell.Main>
  )
}
