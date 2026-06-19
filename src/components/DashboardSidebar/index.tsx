import { Stack } from "@mantine/core"
import { SidebarBrand } from "./SidebarBrand"
import { SidebarMobileExtras } from "./SidebarMobileExtras"
import { SidebarNav } from "./SidebarNav"
import { SidebarTelegram } from "./SidebarTelegram"
import { SidebarUserCard } from "./SidebarUserCard"

/**
 * Dashboard navigation sidebar — a thin composition shell.
 * Subscribes to nothing itself: each sub-block (brand, navigation, mobile extras,
 * user card) keeps its hooks locally, which limits the re-render area.
 * Takes no props.
 */
export function DashboardSidebar() {
  return (
    <Stack gap={4} h="100%">
      <SidebarBrand />
      <SidebarNav />
      <SidebarMobileExtras />
      <SidebarTelegram />
      <SidebarUserCard />
    </Stack>
  )
}
