import { Button, Group, Text } from "@mantine/core"
import { IconTrash, IconX } from "@tabler/icons-react"

interface Props {
  selectedCount: number
  onClearSelection: () => void
  onBulkDelete: () => void
}

/**
 * Контекстный тулбар таблицы операций. Всегда занимает место (фиксированная высота),
 * чтобы таблица не «прыгала» при появлении/исчезновении: пустой — показывает подсказку,
 * при выделении — счётчик и действия над выбранными.
 */
export function TransactionsToolbar({ selectedCount, onClearSelection, onBulkDelete }: Props) {
  const hasSelection = selectedCount > 0

  return (
    <Group
      px="md"
      gap="sm"
      justify="space-between"
      wrap="nowrap"
      style={{
        height: 44,
        flexShrink: 0,
        borderBottom: "1px solid var(--mantine-color-default-border)",
      }}
    >
      {hasSelection ? (
        <>
          <Group gap="xs" wrap="nowrap">
            <Text size="sm" fw={500}>
              Выбрано {selectedCount}
            </Text>
            <Button
              variant="subtle"
              color="gray"
              size="compact-xs"
              leftSection={<IconX size={14} />}
              onClick={onClearSelection}
            >
              Сбросить
            </Button>
          </Group>

          <Button
            size="xs"
            color="red"
            variant="light"
            leftSection={<IconTrash size={14} />}
            onClick={onBulkDelete}
          >
            Удалить {selectedCount}
          </Button>
        </>
      ) : (
        <Text size="sm" c="dimmed">
          Выберите строки для массовых действий
        </Text>
      )}
    </Group>
  )
}
