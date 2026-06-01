import { AddModal } from "@components/AddModal"
import { Button, Group, Stack, Text, Title } from "@mantine/core"
import { useModalStore } from "@store/modalStore"
import { IconDownload, IconPlus } from "@tabler/icons-react"

/**
 * Шапка главной страницы: приветствие и кнопки экспорта / создания операции.
 * Локально владеет открытием модалки через `modalStore`. Не принимает пропсов.
 */
export function HomeHeader() {
  const open = useModalStore((s) => s.open)

  return (
    <Group justify="space-between" align="flex-end" wrap="wrap">
      <Stack gap={4}>
        <Title order={2} size="h3">
          Привет 👋
        </Title>
        <Text size="sm" c="dimmed">
          Ваши финансы за этот месяц
        </Text>
      </Stack>
      <Group gap="xs">
        <Button variant="default" size="sm" leftSection={<IconDownload size={14} />}>
          Экспорт
        </Button>
        <Button
          size="sm"
          leftSection={<IconPlus size={14} />}
          onClick={() =>
            open({ size: "lg", centered: true, children: <AddModal type="transaction" lockType /> })
          }
        >
          Новая операция
        </Button>
      </Group>
    </Group>
  )
}
