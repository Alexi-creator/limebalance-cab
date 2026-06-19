import { getMe, linkTelegram } from "@api/auth"
import { TELEGRAM_BOT_URL, TELEGRAM_BOT_USERNAME } from "@constants/telegram"
import { Alert, Anchor, Button, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useAuthStore } from "@store/authStore"
import { IconBrandTelegram, IconCheck, IconExternalLink } from "@tabler/icons-react"
import { useMutation } from "@tanstack/react-query"
import type { TelegramAuthData } from "@telegram-auth/react"
import { LoginButton } from "@telegram-auth/react"
import { useTranslation } from "react-i18next"

/**
 * "Telegram" settings section. If the account is not linked yet (`telegramId` empty) —
 * shows the linking widget (Telegram login button → `linkTelegram` → we update `me`).
 * If linked — shows the status and a direct link to the bot.
 */
export function TelegramForm() {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const linked = !!user?.telegramId

  const mutation = useMutation({
    mutationFn: async (data: TelegramAuthData) => {
      await linkTelegram(data)
      return getMe()
    },
    onSuccess: (updated) => {
      setUser(updated)
      notifications.show({ color: "green", message: t("telegram.linked_success") })
    },
    onError: () => {
      notifications.show({ color: "red", message: t("telegram.link_error") })
    },
  })

  if (linked) {
    return (
      <Stack gap="lg">
        <Alert
          variant="light"
          color="teal"
          radius="md"
          icon={<IconCheck size={16} />}
          title={t("telegram.linked_title")}
        >
          {t("telegram.linked_text")}
        </Alert>

        <Button
          component="a"
          href={TELEGRAM_BOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          variant="light"
          leftSection={<IconBrandTelegram size={16} />}
          rightSection={<IconExternalLink size={14} />}
          style={{ alignSelf: "flex-start" }}
        >
          {t("telegram.open_bot", { username: TELEGRAM_BOT_USERNAME })}
        </Button>
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Text fw={500}>{t("telegram.connect_title")}</Text>
        <Text size="sm" c="dimmed">
          {t("telegram.connect_text")}
        </Text>
      </Stack>

      {mutation.isPending ? (
        <Text size="sm" c="dimmed">
          {t("telegram.linking")}
        </Text>
      ) : (
        <LoginButton
          botUsername={TELEGRAM_BOT_USERNAME}
          onAuthCallback={(data) => mutation.mutate(data)}
          buttonSize="large"
          cornerRadius={8}
          showAvatar
          lang={i18n.language}
        />
      )}

      <Text size="xs" c="dimmed">
        {t("telegram.dont_know_bot")}{" "}
        <Anchor href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer">
          {t("telegram.open_bot", { username: TELEGRAM_BOT_USERNAME })}
        </Anchor>
      </Text>
    </Stack>
  )
}
