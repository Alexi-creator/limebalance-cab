import { getBotNotificationPreferences, setBotNotificationPreference } from "@api/notifications"
import type { BotNotificationPreference } from "@appTypes/botNotificationPreference"
import { notificationKeys } from "@constants/queries/notifications"
import { Skeleton, Stack, Switch, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useAuthStore } from "@store/authStore"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { hasInvestmentsAccess } from "@utils/subscription"
import { useTranslation } from "react-i18next"

// i18n label per known type; unknown types (backend added a new one) fall back to the raw string.
const TYPE_LABEL_KEYS: Record<string, string> = {
  monthly_digest: "settings.notifications.type_monthly_digest",
  trade_closed: "settings.notifications.type_trade_closed",
}

/**
 * Per-type opt-in/out for proactive Telegram bot pushes (monthly digest, trade closed, …).
 * Renders whatever `GET /notifications/preferences` returns — the list of types is open-ended,
 * so we never hardcode it. `trade_closed` is hidden for users without investing access since it
 * can never fire for them.
 */
export function BotNotificationsForm() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: notificationKeys.preferences,
    queryFn: getBotNotificationPreferences,
    // Nothing else changes these server-side — our own mutation keeps the cache in sync via
    // optimistic updates, so there's no need to ever refetch in the background.
    staleTime: Infinity,
  })

  const mutation = useMutation({
    mutationFn: ({ type, enabled }: { type: string; enabled: boolean }) =>
      setBotNotificationPreference(type, enabled),
    onMutate: async ({ type, enabled }) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.preferences })
      const previous = queryClient.getQueryData<BotNotificationPreference[]>(
        notificationKeys.preferences,
      )
      queryClient.setQueryData<BotNotificationPreference[]>(notificationKeys.preferences, (old) =>
        old?.map((pref) => (pref.type === type ? { ...pref, enabled } : pref)),
      )
      return { previous }
    },
    // On success the optimistic state from onMutate IS the new truth (PATCH answers with an
    // empty body, nothing to reconcile with) — only roll it back on failure.
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationKeys.preferences, context.previous)
      }
      notifications.show({ color: "red", message: t("settings.notifications.error") })
    },
  })

  const preferences = (data ?? []).filter(
    (pref) => pref.type !== "trade_closed" || hasInvestmentsAccess(user),
  )

  if (isLoading) {
    return (
      <Stack gap="lg">
        <Skeleton height={24} width="60%" />
        <Skeleton height={24} width="80%" />
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Text fw={500}>{t("settings.notifications.title")}</Text>
        <Text size="sm" c="dimmed">
          {t("settings.notifications.subtitle")}
        </Text>
      </Stack>

      <Stack gap="md">
        {preferences.map((pref) => {
          const labelKey = TYPE_LABEL_KEYS[pref.type]
          return (
            <Switch
              key={pref.type}
              label={labelKey ? t(labelKey) : pref.type}
              checked={pref.enabled}
              onChange={(e) =>
                mutation.mutate({ type: pref.type, enabled: e.currentTarget.checked })
              }
            />
          )
        })}
      </Stack>
    </Stack>
  )
}
