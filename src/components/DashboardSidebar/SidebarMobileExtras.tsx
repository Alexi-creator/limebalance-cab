import { LangSwitcher } from "@components/LangSwitcher"
import { ThemeToggle } from "@components/ThemeToggle"
import { ActionIcon, Box, Divider, Group, Indicator } from "@mantine/core"
import { IconBell } from "@tabler/icons-react"

/** Доп. блок только для мобильных: уведомления, переключатели языка и темы. */
export function SidebarMobileExtras() {
  return (
    <Box hiddenFrom="sm">
      <Divider mb="xs" />
      <Group px="xs" mb="xs" gap="xs">
        <Indicator color="lime" size={8} offset={6} processing>
          <ActionIcon variant="default" size={36} aria-label="Уведомления">
            <IconBell size={18} />
          </ActionIcon>
        </Indicator>
        <LangSwitcher />
        <ThemeToggle />
      </Group>
    </Box>
  )
}
