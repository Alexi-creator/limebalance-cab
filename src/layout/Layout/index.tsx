import { Header } from "@layout/Header"
import { Main } from "@layout/Main"
import { NavBar } from "@layout/NavBar"
import { AppShell } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"

/**
 * Корневой layout для авторизованного пользователя.
 * Собирает AppShell из Header, NavBar и Main и управляет состоянием мобильного сайдбара.
 * Не принимает пропсов.
 */
export function Layout() {
  const [opened, { toggle, close }] = useDisclosure()

  return (
    <AppShell
      layout="alt"
      header={{ height: 64 }}
      navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
      style={{ height: "100dvh" }}
    >
      <Header opened={opened} onToggle={toggle} />
      <NavBar onClose={close} />
      <Main />
    </AppShell>
  )
}
