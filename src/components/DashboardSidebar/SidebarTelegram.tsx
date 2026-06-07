import { RouteNames } from "@constants/routeNames"
import { TELEGRAM_BOT_URL } from "@constants/telegram"
import { Box, Group, Paper, Text } from "@mantine/core"
import { useAuthStore } from "@store/authStore"
import { useSidebarStore } from "@store/sidebarStore"
import { IconBrandTelegram } from "@tabler/icons-react"
import { Link } from "react-router-dom"

/**
 * Точка входа в Telegram-бота в сайдбаре. Привязанным (`telegramId`) — прямая ссылка
 * на бота; остальным — переход в настройки на привязку (мягкое продвижение бота).
 */
export function SidebarTelegram() {
  const user = useAuthStore((s) => s.user)
  const close = useSidebarStore((s) => s.close)
  const linked = !!user?.telegramId

  // привязан — открываем бота в Telegram; нет — ведём в настройки на привязку
  const linkProps = linked
    ? {
        component: "a" as const,
        href: TELEGRAM_BOT_URL,
        target: "_blank",
        rel: "noopener noreferrer",
      }
    : { component: Link, to: RouteNames.SettingsTelegram, onClick: () => close() }

  return (
    <Paper
      {...linkProps}
      withBorder
      p="xs"
      mt="auto"
      style={{ cursor: "pointer", textDecoration: "none" }}
    >
      <Group gap="xs" wrap="nowrap">
        <Box
          w={28}
          h={28}
          style={{
            borderRadius: 8,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            color: "var(--mantine-color-white)",
            background: "#229ED9",
          }}
        >
          <IconBrandTelegram size={16} />
        </Box>
        <Box style={{ minWidth: 0, flex: 1 }}>
          <Text size="sm" fw={500} truncate>
            {linked ? "Открыть бота" : "Подключить Telegram"}
          </Text>
          <Text size="xs" c="dimmed" truncate>
            {linked ? "Учёт прямо в Telegram" : "Добавляйте операции в чате"}
          </Text>
        </Box>
      </Group>
    </Paper>
  )
}
