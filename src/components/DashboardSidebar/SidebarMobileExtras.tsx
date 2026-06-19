import { LangSwitcher } from "@components/LangSwitcher"
import { ThemeToggle } from "@components/ThemeToggle"
import { ActionIcon, Box, Divider, Group, Indicator } from "@mantine/core"
import { IconBell } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

/** Mobile-only extras block: notifications, language and theme toggles. */
export function SidebarMobileExtras() {
  const { t } = useTranslation()
  return (
    <Box hiddenFrom="sm">
      <Divider mb="xs" />
      <Group px="xs" mb="xs" gap="xs">
        <Indicator color="lime" size={8} offset={6} processing>
          <ActionIcon variant="default" size={36} aria-label={t("common.notifications")}>
            <IconBell size={18} />
          </ActionIcon>
        </Indicator>
        <LangSwitcher />
        <ThemeToggle />
      </Group>
    </Box>
  )
}
