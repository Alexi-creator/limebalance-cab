import type { Transaction } from "@appTypes/transaction"
import { DeleteTransactionConfirm } from "@components/transactions/DeleteTransactionConfirm"
import { EditTransactionForm } from "@components/transactions/EditTransactionForm"
import { ActionIcon, Group, Tooltip } from "@mantine/core"
import { useModalStore } from "@store/modalStore"
import { IconPencil, IconTrash } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

type RowActionKey = "edit" | "delete"

interface RowActionConfig {
  key: RowActionKey
  label: string
  icon: typeof IconPencil
  color?: string
}

interface Props {
  transaction: Transaction
}

/** Иконки-действия строки операции в ряд: открывают модалки редактирования / удаления. */
export function RowActions({ transaction }: Props) {
  const { t } = useTranslation()
  const open = useModalStore((s) => s.open)

  const rowActions: RowActionConfig[] = [
    { key: "edit", label: t("common.edit"), icon: IconPencil },
    { key: "delete", label: t("common.delete"), icon: IconTrash, color: "red" },
  ]

  const handlers: Record<RowActionKey, () => void> = {
    edit: () =>
      open({
        size: "lg",
        centered: true,
        title: t("transactions.edit_title"),
        children: <EditTransactionForm transaction={transaction} />,
      }),
    delete: () =>
      open({
        centered: true,
        title: t("transactions.delete_title"),
        children: <DeleteTransactionConfirm transaction={transaction} />,
      }),
  }

  return (
    <Group gap={4} justify="center" wrap="nowrap">
      {rowActions.map(({ key, label, icon: Icon, color }) => (
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
