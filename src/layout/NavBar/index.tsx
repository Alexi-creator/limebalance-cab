import { DashboardSidebar } from "@components/DashboardSidebar"
import { AppShell } from "@mantine/core"

/**
 * Navigation bar wrapper (AppShell.Navbar).
 * Renders `DashboardSidebar` inside `AppShell.Navbar`. Takes no props.
 */
export function NavBar() {
  return (
    <AppShell.Navbar p="md">
      <DashboardSidebar />
    </AppShell.Navbar>
  )
}
