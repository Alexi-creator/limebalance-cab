import { Header } from "@layout/Header"
import { Main } from "@layout/Main"
import { NavBar } from "@layout/NavBar"
import { AppShell } from "@mantine/core"
import { useSidebarStore } from "@store/sidebarStore"
import type { ReactNode } from "react"

/**
 * Обёртка над AppShell — единственный подписчик на состояние мобильного меню.
 * При переключении перерисовывается только она, а `children` (Header/NavBar/Main)
 * остаются ссылочно стабильными и не перерисовываются.
 */
function AppShellFrame({ children }: { children: ReactNode }) {
  const opened = useSidebarStore((s) => s.opened)

  return (
    <AppShell
      layout="alt"
      header={{ height: 64 }}
      navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
      style={{ height: "100dvh" }}
    >
      {children}
    </AppShell>
  )
}

/**
 * Корневой layout для авторизованного пользователя.
 * Статичная композиция Header, NavBar и Main; состояние мобильного меню живёт
 * в `sidebarStore`, поэтому сам Layout не перерисовывается при его переключении.
 * Не принимает пропсов.
 */
export function Layout() {
  return (
    <AppShellFrame>
      <Header />
      <NavBar />
      <Main />
    </AppShellFrame>
  )
}
