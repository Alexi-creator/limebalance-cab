import { resendEmailConfirmation } from "@api/auth"
import { RouteNames } from "@constants/routeNames"
import { Alert, Button, Group, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useAuthStore } from "@store/authStore"
import { IconAlertTriangle } from "@tabler/icons-react"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

/**
 * Warning banner about the account email. Two states:
 * - email setup: a Telegram user with no email at all (`email` and `pendingEmail` both empty) —
 *   prompts to add email + password;
 * - email confirm: an email is awaiting confirmation (`pendingEmail` set, `email` still empty) —
 *   prompts to confirm it via the link sent to that address.
 * A confirmed email (`email` set) shows nothing. Takes no props — reads state from `useAuthStore`.
 */
export function AccountAlert() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)

  // TG user without any email — offer to add one
  const needsEmailSetup = !!(user?.telegramId && !user?.email && !user?.pendingEmail)
  // email submitted but not yet confirmed — the address lives in pendingEmail
  const needsEmailConfirm = !!(!user?.email && user?.pendingEmail)

  const resendMutation = useMutation({
    mutationFn: resendEmailConfirmation,
    onSuccess: () => notifications.show({ color: "green", message: t("settings.email_resent") }),
    onError: () => notifications.show({ color: "red", message: t("settings.error") }),
  })

  if (!needsEmailSetup && !needsEmailConfirm) return null

  return (
    <Alert
      icon={<IconAlertTriangle size={16} />}
      color="orange"
      radius="md"
      mb="md"
      styles={{ message: { width: "100%" } }}
    >
      <Group justify="space-between" wrap="wrap" gap="xs">
        <Text size="sm">
          {needsEmailSetup
            ? t("alerts.account_needs_email")
            : t("alerts.account_confirm_email", { email: user?.pendingEmail })}
        </Text>
        {needsEmailSetup && (
          <Button
            component={Link}
            to={RouteNames.SettingsSecurity}
            size="xs"
            color="yellow"
            variant="filled"
          >
            {t("alerts.account_go_settings")}
          </Button>
        )}
        {needsEmailConfirm && (
          <Group gap="xs">
            <Button
              size="xs"
              color="yellow"
              variant="filled"
              loading={resendMutation.isPending}
              onClick={() => resendMutation.mutate()}
            >
              {t("settings.email_resend")}
            </Button>
            <Button
              component={Link}
              to={RouteNames.SettingsSecurity}
              size="xs"
              color="yellow"
              variant="subtle"
            >
              {t("settings.email_change")}
            </Button>
          </Group>
        )}
      </Group>
    </Alert>
  )
}
