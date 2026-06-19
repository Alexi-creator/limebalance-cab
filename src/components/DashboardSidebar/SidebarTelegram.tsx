import { RouteNames } from "@constants/routeNames"
import { TELEGRAM_BOT_URL } from "@constants/telegram"
import { Box, Group, Paper, Text } from "@mantine/core"
import { useAuthStore } from "@store/authStore"
import { useSidebarStore } from "@store/sidebarStore"
import { IconBrandTelegram } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

/**
 * Entry point to the Telegram bot in the sidebar. For linked users (`telegramId`) — a direct link
 * to the bot; for everyone else — a jump to settings to link it (a soft bot promo).
 */
export function SidebarTelegram() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const close = useSidebarStore((s) => s.close)
  const linked = !!user?.telegramId

  // shared props for the link card (the visuals are the same for both variants).
  // the card renders as <a>, and Paper does not style itself as a link — we set the text color
  // explicitly, otherwise the nested <Text> inherits the purple currentColor of a visited <a> from UA styles.
  const cardProps = {
    withBorder: true,
    p: "xs",
    mt: "auto",
    style: { cursor: "pointer", textDecoration: "none", color: "var(--mantine-color-text)" },
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
          {linked ? t("sidebar.telegram_open") : t("sidebar.telegram_connect")}
        </Text>
        <Text size="xs" c="dimmed" truncate>
          {linked ? t("sidebar.telegram_open_desc") : t("sidebar.telegram_connect_desc")}
        </Text>
      </Box>
    </Group>
  )

  // linked — open the bot in Telegram (external link); not — lead to settings to link.
  // we render in two branches so the polymorphic `component` Paper has a concrete type, not a union.
  return linked ? (
    <Paper
      {...cardProps}
      component="a"
      href={TELEGRAM_BOT_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      {content}
    </Paper>
  ) : (
    <Paper {...cardProps} component={Link} to={RouteNames.SettingsTelegram} onClick={() => close()}>
      {content}
    </Paper>
  )
}
