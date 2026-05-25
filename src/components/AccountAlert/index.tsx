import { Alert, Button, Group, Text } from "@mantine/core"
import { useAuthStore } from "@store/authStore"
import { IconAlertTriangle } from "@tabler/icons-react"

export function AccountAlert() {
  // const user = useAuthStore((s) => s.user)

  // Stub condition: TG user without email/password
  // const needsEmailSetup = !!(user?.telegramId && !user?.email)

  // if (!needsEmailSetup) return null

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
          Вы вошли через Telegram. Добавьте email и пароль в настройках, чтобы не потерять доступ к
          аккаунту.
        </Text>
        <Button size="xs" color="yellow" variant="filled">
          Перейти в настройки
        </Button>
      </Group>
    </Alert>
  )
}
