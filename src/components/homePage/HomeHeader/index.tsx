import { Stack, Text, Title } from "@mantine/core"

/**
 * Шапка главной страницы: приветствие и краткое описание периода.
 */
export function HomeHeader() {
  return (
    <Stack gap={4}>
      <Title order={2} size="h3">
        Привет 👋
      </Title>
      <Text size="sm" c="dimmed">
        Ваши финансы за этот месяц
      </Text>
    </Stack>
  )
}
