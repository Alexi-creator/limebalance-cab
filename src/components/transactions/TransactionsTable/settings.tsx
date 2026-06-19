import type { Transaction, TransactionsSummary, TransactionType } from "@appTypes/transaction"
import { Center, Group, Text } from "@mantine/core"
import { IconTag } from "@tabler/icons-react"
import { format, type Locale } from "date-fns"
import type { TFunction } from "i18next"
import type { DataTableColumn } from "mantine-datatable"
import { formatTxAmount } from "../helpers"
import { TransactionsSummary as SummaryFooter } from "../TransactionsSummary"
import { RowActions } from "./RowActions"

/**
 * Transactions table columns. The date/amount format depends on the locale and language.
 * `emojiByCategoryId` — category emoji by its id (taken from the loaded category lists).
 * `summary` — selection totals: if provided, shown in the table footer.
 */
export function getTransactionColumns(
  t: TFunction,
  locale: Locale,
  language: string,
  emojiByCategoryId: Map<string, string>,
  summary?: TransactionsSummary,
  type?: TransactionType,
): DataTableColumn<Transaction>[] {
  return [
    {
      accessor: "description",
      title: t("transactions.col_operation"),
      ellipsis: true,
      // we raise the footer cell above its neighbors (z-index), otherwise their opaque background
      // covers the totals text overflowing to the right; нижний паддинг наращивает высоту строки,
      // чтобы горизонтальный скролл не налезал на цифры (итоги привязаны к верху ячейки)
      footerStyle: { position: "relative", zIndex: 1, overflow: "visible", paddingBottom: 14 },
      // we render the totals as an absolute layer over the empty footer cells on the right: a zero-
      // width anchor does not stretch the "Transaction" column, so the columns do not shift
      footer: summary ? (
        <div style={{ position: "relative", width: 0 }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              // приподнимаем итоги над горизонтальным скроллом таблицы, чтобы он не перекрывал цифры,
              // но оставляем отступ сверху, иначе цифры прилипают к верхней границе строки
              top: "calc(50% - 4px)",
              transform: "translateY(-50%)",
              whiteSpace: "nowrap",
            }}
          >
            <SummaryFooter summary={summary} type={type} />
          </div>
        </div>
      ) : undefined,
    },
    {
      accessor: "categoryName",
      title: t("common.category"),
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
      title: t("transactions.col_date"),
      width: 130,
      render: (t) => (
        <Text size="sm" c="dimmed">
          {format(t.date, "dd MMM yyyy", { locale })}
        </Text>
      ),
    },
    {
      accessor: "amount",
      title: t("transactions.col_amount"),
      width: 150,
      textAlign: "right",
      render: (t) => (
        <Text ff="monospace" size="sm" fw={500} c={t.type === "income" ? "green.5" : "red.5"}>
          {formatTxAmount(t, language)}
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
