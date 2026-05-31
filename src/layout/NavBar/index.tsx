import { DashboardSidebar } from "@components/DashboardSidebar"
import { AppShell } from "@mantine/core"

/**
 * Обёртка навигационной панели (AppShell.Navbar).
 * Рендерит `DashboardSidebar` внутри `AppShell.Navbar`. Не принимает пропсов.
 */
export function NavBar() {
  return (
    <AppShell.Navbar p="md">
      <DashboardSidebar />
    </AppShell.Navbar>
  )
}
