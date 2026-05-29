import { DashboardSidebar } from "@components/DashboardSidebar"
import { AppShell } from "@mantine/core"

interface Props {
  /** Колбэк закрытия мобильного меню — пробрасывается в `DashboardSidebar` */
  onClose: () => void
}

/**
 * Обёртка навигационной панели (AppShell.Navbar).
 * Рендерит `DashboardSidebar` внутри `AppShell.Navbar`.
 */
export function NavBar({ onClose }: Props) {
  return (
    <AppShell.Navbar p="md">
      <DashboardSidebar onClose={onClose} />
    </AppShell.Navbar>
  )
}
