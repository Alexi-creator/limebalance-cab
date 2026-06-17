import { RouteNames } from "@constants/routeNames"
import { Alert, Button, Group, Text } from "@mantine/core"
import { useAuthStore } from "@store/authStore"
import { IconAlertTriangle } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

/**
 * Баннер-предупреждение для пользователей, вошедших через Telegram без привязанного email.
 * Показывается только если `telegramId` установлен, а `email` отсутствует.
 * Не принимает пропсов — читает состояние из `useAuthStore`.
 */
export function AccountAlert() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)

  // Stub condition: TG user without email/password
  const needsEmailSetup = !!(user?.telegramId && !user?.email)

  if (!needsEmailSetup) return null

  return (
    <Alert
      icon={<IconAlertTriangle size={16} />}
      color="orange"
      radius="md"
      mb="md"
      styles={{ message: { width: "100%" } }}
    >
      <Group justify="space-between" wrap="wrap" gap="xs">
        <Text size="sm">{t("alerts.account_needs_email")}</Text>
        <Button
          component={Link}
          to={RouteNames.SettingsSecurity}
          size="xs"
          color="yellow"
          variant="filled"
        >
          {t("alerts.account_go_settings")}
        </Button>
      </Group>
    </Alert>
  )
}
