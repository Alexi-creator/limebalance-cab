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

  // общие пропсы карточки-ссылки (визуал одинаков для обоих вариантов)
  const cardProps = {
    withBorder: true,
    p: "xs",
    mt: "auto",
    style: { cursor: "pointer", textDecoration: "none" },
  } as const

  const content = (
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
          background: "var(--app-color-telegram)",
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
  )

  // привязан — открываем бота в Telegram (внешняя ссылка); нет — ведём в настройки на привязку.
  // рендерим двумя ветками, чтобы у полиморфного `component` Paper был конкретный тип, а не union.
  return linked ? (
    <Paper {...cardProps} component="a" href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer">
      {content}
    </Paper>
  ) : (
    <Paper {...cardProps} component={Link} to={RouteNames.SettingsTelegram} onClick={() => close()}>
      {content}
    </Paper>
  )
}
