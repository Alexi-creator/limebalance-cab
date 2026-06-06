import type { Transaction, TransactionsSummary, TransactionType } from "@appTypes/transaction"
import { Center, Group, Text } from "@mantine/core"
import { IconTag } from "@tabler/icons-react"
import { format, type Locale } from "date-fns"
import type { DataTableColumn } from "mantine-datatable"
import { formatTxAmount } from "../helpers"
import { TransactionsSummary as SummaryFooter } from "../TransactionsSummary"
import { RowActions } from "./RowActions"

/**
 * Колонки таблицы операций. Формат даты/суммы зависит от локали и языка.
 * `emojiByCategoryId` — эмодзи категории по её id (берётся из загруженных списков категорий).
 * `summary` — итоги по выборке: если переданы, показываются в футере таблицы.
 */
export function getTransactionColumns(
  locale: Locale,
  language: string,
  emojiByCategoryId: Map<string, string>,
  summary?: TransactionsSummary,
  type?: TransactionType,
): DataTableColumn<Transaction>[] {
  return [
    {
      accessor: "description",
      title: "Операция",
      ellipsis: true,
      // ячейку футера поднимаем над соседними (z-index), иначе их непрозрачный фон
      // перекрывает вылезающий вправо текст итогов
      footerStyle: { position: "relative", zIndex: 1, overflow: "visible" },
      // итоги выводим абсолютным слоем поверх пустых ячеек футера справа: нулевой по
      // ширине якорь не распирает колонку «Операция», поэтому колонки не сдвигаются
      footer: summary ? (
        <div style={{ position: "relative", width: 0 }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
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
