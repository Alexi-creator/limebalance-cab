import { ActionIcon, Box, Group, Text } from "@mantine/core"
import { useSidebarStore } from "@store/sidebarStore"
import { IconX } from "@tabler/icons-react"

/** Логотип приложения и кнопка закрытия мобильного меню. */
export function SidebarBrand() {
  const close = useSidebarStore((s) => s.close)

  return (
    <Group gap="xs" px="xs" py={4} mb="sm" justify="space-between">
      <Group gap="xs">
        <Box
          w={26}
          h={26}
          bg="lime.4"
          c="var(--app-logo-ink)"
          ff="monospace"
          fw={600}
          fz={14}
          style={{ borderRadius: 8, display: "grid", placeItems: "center" }}
        >
          L
        </Box>
        <Text fw={600}>LimeBalance</Text>
      </Group>

      <ActionIcon
        variant="subtle"
        color="gray"
        size="sm"
        hiddenFrom="sm"
        onClick={close}
        aria-label="Закрыть меню"
      >
        <IconX size={16} />
      </ActionIcon>
    </Group>
  )
}
