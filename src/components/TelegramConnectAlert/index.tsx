import { RouteNames } from "@constants/routeNames"
import { Alert, Button, Group, Text } from "@mantine/core"
import { useAuthStore } from "@store/authStore"
import { IconBrandTelegram } from "@tabler/icons-react"
import { useReducer } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

const DISMISS_KEY = "tg-connect-dismissed"

/** Ключ закрытия баннера в разрезе пользователя — иначе закрытие у одного скрывает баннер у другого. */
const dismissKeyFor = (id: string) => `${DISMISS_KEY}:${id}`

/**
 * Баннер-продвижение Telegram-бота для тех, кто зарегался в ЛК и ещё не привязал бота
 * (`telegramId` пустой). Закрывается и запоминает это в localStorage (отдельно для каждого
 * пользователя), чтобы не надоедать. Зеркало `AccountAlert` (тот — для TG-юзеров без почты).
 */
export function TelegramConnectAlert() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  // тик для перерисовки после закрытия; сам `dismissed` читаем из localStorage по текущему юзеру
  const [, bump] = useReducer((x: number) => x + 1, 0)

  // идентификатор пользователя для скоупа ключа (id в схеме нет — берём почту/telegram)
  const userId = user?.email ?? user?.telegramId ?? null
  const dismissed = userId != null && localStorage.getItem(dismissKeyFor(userId)) === "1"

  // показываем только залогиненным без привязанного Telegram и кто не закрыл баннер
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
