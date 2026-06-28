import { DashboardSidebar } from "@components/DashboardSidebar"
import { AppShell } from "@mantine/core"
import classes from "./classes.module.css"

/**
 * Navigation bar wrapper (AppShell.Navbar).
 * Renders `DashboardSidebar` inside `AppShell.Navbar`. Takes no props.
 */
export function NavBar() {
  return (
    <AppShell.Navbar p="md" className={classes.root}>
      <DashboardSidebar />
    </AppShell.Navbar>
  )
}
