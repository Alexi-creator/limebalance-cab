import { Stack } from "@mantine/core"
import { SidebarBrand } from "./SidebarBrand"
import { SidebarMobileExtras } from "./SidebarMobileExtras"
import { SidebarNav } from "./SidebarNav"
import { SidebarUserCard } from "./SidebarUserCard"

/**
 * Боковая панель навигации дашборда — тонкая оболочка-композиция.
 * Сама ни на что не подписана: каждый под-блок (бренд, навигация, мобильные доп-кнопки,
 * карточка пользователя) держит свои хуки локально, что ограничивает зону перерисовки.
 * Не принимает пропсов.
 */
export function DashboardSidebar() {
  return (
    <Stack gap={4} h="100%">
      <SidebarBrand />
      <SidebarNav />
      <SidebarMobileExtras />
      <SidebarUserCard />
    </Stack>
  )
}
