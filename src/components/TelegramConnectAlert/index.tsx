import { RouteNames } from "@constants/routeNames"
import { Alert, Button, Group, Text } from "@mantine/core"
import { useAuthStore } from "@store/authStore"
import { IconBrandTelegram } from "@tabler/icons-react"
import { useReducer } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

const DISMISS_KEY = "tg-connect-dismissed"

/** Per-user banner dismissal key — otherwise dismissing for one user hides the banner for another. */
const dismissKeyFor = (id: string) => `${DISMISS_KEY}:${id}`

/**
 * Telegram bot promo banner for those who registered in the dashboard and have not linked the bot yet
 * (`telegramId` empty). It can be dismissed and remembers that in localStorage (separately for each
 * user) so it does not nag. Mirror of `AccountAlert` (which is for TG users without email).
 */
export function TelegramConnectAlert() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  // tick to re-render after dismissal; `dismissed` itself is read from localStorage for the current user
  const [, bump] = useReducer((x: number) => x + 1, 0)

  // user identifier for scoping the key (there is no id in the schema — we use email/telegram)
  const userId = user?.email ?? user?.telegramId ?? null
  const dismissed = userId != null && localStorage.getItem(dismissKeyFor(userId)) === "1"

  // shown only to logged-in users without a linked Telegram who have not dismissed the banner
  if (!user || !userId || user.telegramId || dismissed) return null

  const dismiss = () => {
    localStorage.setItem(dismissKeyFor(userId), "1")
    bump()
  }

  return (
    <Alert
      icon={<IconBrandTelegram size={16} />}
      color="blue"
      radius="md"
      mb="md"
      withCloseButton
      onClose={dismiss}
      styles={{ message: { width: "100%" } }}
    >
      <Group justify="space-between" wrap="wrap" gap="xs">
        <Text size="sm">{t("alerts.telegram_connect_text")}</Text>
        <Button
          component={Link}
          to={RouteNames.SettingsTelegram}
          size="xs"
          variant="filled"
          leftSection={<IconBrandTelegram size={14} />}
        >
          {t("alerts.telegram_connect_button")}
        </Button>
      </Group>
    </Alert>
  )
}
