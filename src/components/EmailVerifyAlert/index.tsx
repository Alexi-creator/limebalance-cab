import { resendEmailConfirmation } from "@api/auth"
import { Alert, Button, Group, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useAuthStore } from "@store/authStore"
import { IconAlertTriangle } from "@tabler/icons-react"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

/**
 * "Confirm your email" banner for accounts created via email/password whose address is set but
 * not yet confirmed (`email && !emailVerified`). Lets the user resend the confirmation link.
 *
 * Independent of {@link AccountAlert}, which covers the Telegram→email linking flow
 * (`pendingEmail`). The states are mutually exclusive — verification needs an `email`, while the
 * linking flow only runs while `email` is still null — so the two banners never show together.
 * Takes no props — reads state from `useAuthStore`.
 */
export function EmailVerifyAlert() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)

  // The resend endpoint is rate-limited (auth bucket); keep the button disabled for a short
  // cooldown after each click so users cannot hammer it.
  const [cooldown, setCooldown] = useState(false)
  useEffect(() => {
    if (!cooldown) return
    const id = setTimeout(() => setCooldown(false), 3000)
    return () => clearTimeout(id)
  }, [cooldown])

  const resendMutation = useMutation({
    mutationFn: resendEmailConfirmation,
    onSuccess: () => notifications.show({ color: "green", message: t("settings.email_resent") }),
    onError: () => notifications.show({ color: "red", message: t("settings.error") }),
  })

  // Strictly `emailVerified === false` (per spec): a missing/undefined flag (e.g. a stale
  // profile mid-rollout) must not flash the banner at an already-verified user.
  if (!user?.email || user.emailVerified !== false) return null

  return (
    <Alert
      icon={<IconAlertTriangle size={16} />}
      color="orange"
      radius="md"
      mb="md"
      styles={{ message: { width: "100%" } }}
    >
      <Group justify="space-between" wrap="wrap" gap="xs">
        <Text size="sm">{t("alerts.email_verify", { email: user.email })}</Text>
        <Button
          size="xs"
          color="yellow"
          variant="filled"
          loading={resendMutation.isPending}
          disabled={cooldown}
          onClick={() => {
            setCooldown(true)
            resendMutation.mutate()
          }}
        >
          {t("settings.email_resend")}
        </Button>
      </Group>
    </Alert>
  )
}
