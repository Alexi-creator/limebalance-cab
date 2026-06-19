import { Button, Group, Text } from "@mantine/core"
import { IconTrash, IconX } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

interface Props {
  selectedCount: number
  onClearSelection: () => void
  onBulkDelete: () => void
}

/**
 * Contextual toolbar for the transactions table. Always occupies space (fixed height),
 * so the table does not "jump" when it appears/disappears: when empty — shows a hint,
 * when there is a selection — a counter and actions over the selected rows.
 */
export function TransactionsToolbar({ selectedCount, onClearSelection, onBulkDelete }: Props) {
  const { t } = useTranslation()
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
              {t("transactions.toolbar_selected", { count: selectedCount })}
            </Text>
            <Button
              variant="subtle"
              color="gray"
              size="compact-xs"
              leftSection={<IconX size={14} />}
              onClick={onClearSelection}
            >
              {t("common.reset")}
            </Button>
          </Group>

          <Button
            size="xs"
            color="red"
            variant="light"
            leftSection={<IconTrash size={14} />}
            onClick={onBulkDelete}
          >
            {t("common.delete")} {selectedCount}
          </Button>
        </>
      ) : (
        <Text size="sm" c="dimmed">
          {t("transactions.toolbar_hint")}
        </Text>
      )}
    </Group>
  )
}
