import { Alert, Anchor, Button, Divider, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconBrandTelegram, IconCheck, IconExternalLink } from "@tabler/icons-react"
import { LoginButton } from "@telegram-auth/react"
import { useTranslation } from "react-i18next"
import { useLinkTelegram } from "@/modules/auth/api/useLinkTelegram"
import { useAuthStore } from "@/modules/auth/hooks/useAuthStore"
import {
  handleTelegramBotLinkClick,
  TELEGRAM_BOT_URL,
  TELEGRAM_BOT_USERNAME,
} from "@/shared/config/telegram"
import { BotNotificationsForm } from "../BotNotificationsForm"

/**
 * "Telegram" settings section. If the account is not linked yet (`telegramId` empty) —
 * shows the linking widget (Telegram login button → `linkTelegram` → we update `me`).
 * If linked — shows the status and a direct link to the bot.
 */
export function TelegramForm() {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const linked = !!user?.telegramId

  const mutation = useLinkTelegram({
    onSuccess: () => notifications.show({ color: "green", message: t("telegram.linked_success") }),
    onError: () => notifications.show({ color: "red", message: t("telegram.link_error") }),
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
          onClick={handleTelegramBotLinkClick}
          variant="light"
          leftSection={<IconBrandTelegram size={16} />}
          rightSection={<IconExternalLink size={14} />}
          style={{ alignSelf: "flex-start" }}
        >
          {t("telegram.open_bot", { username: TELEGRAM_BOT_USERNAME })}
        </Button>

        <Divider />

        <BotNotificationsForm />
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
        <Anchor
          href={TELEGRAM_BOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleTelegramBotLinkClick}
        >
          {t("telegram.open_bot", { username: TELEGRAM_BOT_USERNAME })}
        </Anchor>
      </Text>
    </Stack>
  )
}
