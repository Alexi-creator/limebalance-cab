import { logout } from "@api/auth"
import { ActionIcon, Avatar, Box, Group, Paper, Text, Tooltip } from "@mantine/core"
import { useAuthStore } from "@store/authStore"
import { IconLogout } from "@tabler/icons-react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

/**
 * Карточка текущего пользователя с кнопкой выхода. Локально подписан на authStore
 * через селекторы, поэтому перерисовывается только при смене пользователя, а не при навигации.
 */
export function SidebarUserCard() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const queryClient = useQueryClient()

  const handleLogout = async () => {
    await logout().catch(() => {})
    setUser(null)
    // выкидываем весь кеш предыдущего пользователя, чтобы новый логин не видел чужие данные
    queryClient.clear()
  }

  const initials = (user?.name || user?.email)?.[0]?.toUpperCase() ?? "Y"
  const displayName = user?.name || user?.email || "You"

  return (
    <Paper mt="auto" p="xs" withBorder>
      <Group gap="xs" wrap="nowrap">
        <Avatar size="sm" radius="xl" color="lime">
          {initials}
        </Avatar>
        <Box style={{ minWidth: 0, flex: 1 }}>
          <Text size="sm" truncate>
            {displayName}
          </Text>
          <Text size="xs" c="dimmed">
            Free
          </Text>
        </Box>
        <Tooltip label={t("nav.logout")} position="right">
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={handleLogout}>
            <IconLogout size={20} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Paper>
  )
}
