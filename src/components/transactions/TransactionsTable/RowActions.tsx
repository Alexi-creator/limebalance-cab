import type { Transaction } from "@appTypes/transaction"
import { DeleteTransactionConfirm } from "@components/transactions/DeleteTransactionConfirm"
import { EditTransactionForm } from "@components/transactions/EditTransactionForm"
import { ActionIcon, Group, Tooltip } from "@mantine/core"
import { useModalStore } from "@store/modalStore"
import { IconPencil, IconTrash } from "@tabler/icons-react"

type RowActionKey = "edit" | "delete"

interface RowActionConfig {
  key: RowActionKey
  label: string
  icon: typeof IconPencil
  color?: string
}

/** Конфиг действий строки — чтобы добавить новое действие, достаточно дописать пункт сюда. */
const ROW_ACTIONS: RowActionConfig[] = [
  { key: "edit", label: "Редактировать", icon: IconPencil },
  { key: "delete", label: "Удалить", icon: IconTrash, color: "red" },
]

interface Props {
  transaction: Transaction
}

/** Иконки-действия строки операции в ряд: открывают модалки редактирования / удаления. */
export function RowActions({ transaction }: Props) {
  const open = useModalStore((s) => s.open)

  const handlers: Record<RowActionKey, () => void> = {
    edit: () =>
      open({
        size: "lg",
        centered: true,
        title: "Редактирование операции",
        children: <EditTransactionForm transaction={transaction} />,
      }),
    delete: () =>
      open({
        centered: true,
        title: "Удаление операции",
        children: <DeleteTransactionConfirm transaction={transaction} />,
      }),
  }

  return (
    <Group gap={4} justify="center" wrap="nowrap">
      {ROW_ACTIONS.map(({ key, label, icon: Icon, color }) => (
        <Tooltip key={key} label={label} withinPortal>
          <ActionIcon
            variant="subtle"
            size="sm"
            color={color ?? "gray"}
            aria-label={label}
            onClick={handlers[key]}
          >
            <Icon size={15} />
          </ActionIcon>
        </Tooltip>
      ))}
    </Group>
  )
}
