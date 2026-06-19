import { RouteNames } from "@constants/routeNames"
import { Alert, Button, Group, Text } from "@mantine/core"
import { useAuthStore } from "@store/authStore"
import { IconAlertTriangle } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

/**
 * Warning banner for users who signed in via Telegram without a linked email.
 * Shown only if `telegramId` is set and `email` is missing.
 * Takes no props — reads state from `useAuthStore`.
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
