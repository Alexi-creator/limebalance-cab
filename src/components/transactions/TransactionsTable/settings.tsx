import type { Transaction } from "@appTypes/transaction"
import { Center, Group, Text } from "@mantine/core"
import { IconTag } from "@tabler/icons-react"
import { formatCurrency } from "@utils/formatCurrency"
import { format, type Locale } from "date-fns"
import type { DataTableColumn } from "mantine-datatable"
import { formatTxAmount } from "../helpers"
import { RowActions } from "./RowActions"

/**
 * Колонки таблицы операций. Формат даты/суммы зависит от локали и языка.
 * `pageTotal` — нетто текущей страницы, выводится в подвале колонки «Сумма».
 * `emojiByCategoryId` — эмодзи категории по её id (берётся из загруженных списков категорий).
 */
export function getTransactionColumns(
  locale: Locale,
  language: string,
  pageTotal: number,
  emojiByCategoryId: Map<string, string>,
): DataTableColumn<Transaction>[] {
  return [
    {
      accessor: "description",
      title: "Операция",
      ellipsis: true,
      footer: (
        <Text size="xs" c="dimmed">
          Итого:
        </Text>
      ),
    },
    {
      accessor: "categoryName",
      title: "Категория",
      width: 190,
      render: (t) => {
        if (!t.categoryName)
          return (
            <Text size="xs" c="dimmed">
              —
            </Text>
          )
        const emoji = emojiByCategoryId.get(t.categoryId)
        return (
          <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
            <Center
              w={26}
              h={26}
              fz={14}
              style={{
                borderRadius: 8,
                flexShrink: 0,
                background: "var(--mantine-color-default-hover)",
                border: "1px solid var(--mantine-color-default-border)",
              }}
            >
              {emoji ?? <IconTag size={14} opacity={0.5} />}
            </Center>
            <Text size="sm" truncate>
              {t.categoryName}
            </Text>
          </Group>
        )
      },
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
      footer: (
        <Text
          ff="monospace"
          size="sm"
          fw={600}
          ta="right"
          c={pageTotal > 0 ? "green.5" : pageTotal < 0 ? "red.5" : "dimmed"}
        >
          {pageTotal > 0 ? "+" : ""}
          {formatCurrency(pageTotal, language)}
        </Text>
      ),
    },
    {
      accessor: "actions",
      title: "",
      width: 90,
      textAlign: "center",
      render: (t) => <RowActions transaction={t} />,
    },
  ]
}
