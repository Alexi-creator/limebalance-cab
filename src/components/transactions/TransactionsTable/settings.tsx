import type { Transaction } from "@appTypes/transaction"
import { ActionIcon, Badge, Text, Tooltip } from "@mantine/core"
import { IconDotsVertical } from "@tabler/icons-react"
import { format, type Locale } from "date-fns"
import type { DataTableColumn } from "mantine-datatable"
import { formatTxAmount } from "../helpers"

/** Колонки таблицы операций. Формат даты/суммы зависит от локали и языка. */
export function getTransactionColumns(
  locale: Locale,
  language: string,
): DataTableColumn<Transaction>[] {
  return [
    { accessor: "description", title: "Операция", ellipsis: true },
    {
      accessor: "categoryName",
      title: "Категория",
      width: 170,
      render: (t) =>
        t.categoryName ? (
          <Badge variant="default" size="sm">
            {t.categoryName}
          </Badge>
        ) : (
          <Text size="xs" c="dimmed">
            —
          </Text>
        ),
    },
    {
      accessor: "date",
      title: "Дата",
      width: 130,
      render: (t) => (
        <Text size="sm" c="dimmed">
          {format(t.date, "dd MMM yyyy", { locale })}
        </Text>
      ),
    },
    {
      accessor: "amount",
      title: "Сумма",
      width: 150,
      textAlign: "right",
      render: (t) => (
        <Text ff="monospace" size="sm" fw={500} c={t.type === "income" ? "green.5" : undefined}>
          {formatTxAmount(t, language)}
        </Text>
      ),
    },
    {
      accessor: "actions",
      title: "",
      width: 50,
      render: () => (
        <Tooltip label="Действия">
          <ActionIcon variant="subtle" size="sm" color="gray">
            <IconDotsVertical size={14} />
          </ActionIcon>
        </Tooltip>
      ),
    },
  ]
}
