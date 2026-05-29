import { DashboardSidebar } from "@components/DashboardSidebar"
import { AppShell } from "@mantine/core"

interface Props {
  onClose: () => void
}

export function NavBar({ onClose }: Props) {
  return (
    <AppShell.Navbar p="md">
      <DashboardSidebar onClose={onClose} />
    </AppShell.Navbar>
  )
}
