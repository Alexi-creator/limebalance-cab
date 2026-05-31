import { AccountAlert } from "@components/AccountAlert"
import { RouteNames } from "@constants/routeNames"
import { AppShell, Box, LoadingOverlay } from "@mantine/core"
import { useLoaderStore } from "@store/loaderStore"
import { Outlet, useLocation } from "react-router-dom"

import classes from "./classes.module.css"

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
      classNames={{ main: classes.root }}
      style={{ overflowY: isFillHeight ? "hidden" : "auto" }}
    >
      <LoadingOverlay visible={isLoading} />

      <AccountAlert />

      <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Outlet />
      </Box>
    </AppShell.Main>
  )
}
