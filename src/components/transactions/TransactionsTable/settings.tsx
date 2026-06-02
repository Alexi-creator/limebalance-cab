import type { Transaction } from "@appTypes/transaction"
import { Badge, Text } from "@mantine/core"
import { formatCurrency } from "@utils/formatCurrency"
import { format, type Locale } from "date-fns"
import type { DataTableColumn } from "mantine-datatable"
import { formatTxAmount } from "../helpers"
import { RowActions } from "./RowActions"

/**
 * Колонки таблицы операций. Формат даты/суммы зависит от локали и языка.
 * `pageTotal` — нетто текущей страницы, выводится в подвале колонки «Сумма».
 */
export function getTransactionColumns(
  locale: Locale,
  language: string,
  pageTotal: number,
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
