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
 * Секция настроек «Telegram». Если аккаунт ещё не привязан (`telegramId` пустой) —
 * показывает виджет привязки (логин-кнопка Telegram → `linkTelegram` → обновляем `me`).
 * Если привязан — показывает статус и прямую ссылку на бота.
 */
export function TelegramForm() {
  const { i18n } = useTranslation()
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
      notifications.show({ color: "green", message: "Telegram привязан" })
    },
    onError: () => {
      notifications.show({ color: "red", message: "Не удалось привязать Telegram" })
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
          title="Telegram привязан"
        >
          Ваш аккаунт связан с ботом — операции из Telegram попадают сюда автоматически.
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
          Открыть @{TELEGRAM_BOT_USERNAME}
        </Button>
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Text fw={500}>Подключите Telegram-бота</Text>
        <Text size="sm" c="dimmed">
          Добавляйте доходы и расходы прямо в Telegram — они синхронизируются с этим кабинетом.
          Привяжите бота к аккаунту, чтобы он вас узнавал.
        </Text>
      </Stack>

      {mutation.isPending ? (
        <Text size="sm" c="dimmed">
          Привязываем…
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
        Не знаете бота?{" "}
        <Anchor href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer">
          Открыть @{TELEGRAM_BOT_USERNAME}
        </Anchor>
      </Text>
    </Stack>
  )
}
