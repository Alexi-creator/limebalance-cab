import { ScrollArea, Stack } from "@mantine/core"
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
 *
 * Brand stays pinned at the top, the user card at the bottom, and the navigation in
 * between scrolls on its own — so a short viewport (notably mobile) never clips the menu.
 */
export function DashboardSidebar() {
  return (
    <Stack gap={4} h="100%">
      <SidebarBrand />
      <ScrollArea style={{ flex: 1 }} type="auto" offsetScrollbars>
        <Stack gap={4}>
          <SidebarNav />
          <SidebarMobileExtras />
        </Stack>
      </ScrollArea>
      <SidebarTelegram />
      <SidebarUserCard />
    </Stack>
  )
}
