import type { Transaction } from "@appTypes/transaction"
import { dateFnsLocales } from "@i18n/languages.ts"
import { ActionIcon, Badge, Box, LoadingOverlay, Table, Text, Tooltip } from "@mantine/core"
import { IconDotsVertical } from "@tabler/icons-react"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useTranslation } from "react-i18next"
import { formatTxAmount } from "../helpers"

interface Props {
  transactions: Transaction[]
  isLoading: boolean
  isError: boolean
  /** Показываются данные предыдущего запроса, пока грузится новая страница/фильтр. */
  isPlaceholder?: boolean
}

/** Таблица операций с состояниями загрузки/ошибки/пустого результата. */
export function TransactionsTable({ transactions, isLoading, isError, isPlaceholder }: Props) {
  const { i18n } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS

  return (
    <Box
      style={{
        flex: 1,
        overflow: "auto",
        minHeight: 0,
        position: "relative",
        opacity: isPlaceholder ? 0.55 : 1,
        pointerEvents: isPlaceholder ? "none" : undefined,
        transition: "opacity 150ms ease",
      }}
    >
      <LoadingOverlay visible={isLoading} />
      <Table
        verticalSpacing="sm"
        striped
        highlightOnHover
        style={{ minWidth: 640, tableLayout: "fixed" }}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Операция</Table.Th>
            <Table.Th w={170}>Категория</Table.Th>
            <Table.Th w={130}>Дата</Table.Th>
            <Table.Th w={140} ta="right">
              Сумма
            </Table.Th>
            <Table.Th w={40} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {transactions.map((t) => (
            <Table.Tr key={`${t.type}-${t.id}`}>
              <Table.Td>
                <Tooltip label={t.description} position="top-start" openDelay={300}>
                  <Text size="sm" truncate="end" style={{ minWidth: 0 }}>
                    {t.description}
                  </Text>
                </Tooltip>
              </Table.Td>
              <Table.Td>
                {t.categoryName ? (
                  <Badge variant="default" size="sm">
                    {t.categoryName}
                  </Badge>
                ) : (
                  <Text size="xs" c="dimmed">
                    —
                  </Text>
                )}
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {format(t.date, "dd MMM yyyy", { locale })}
                </Text>
              </Table.Td>
              <Table.Td ta="right">
                <Text
                  ff="monospace"
                  size="sm"
                  fw={500}
                  c={t.type === "income" ? "green.5" : undefined}
                >
                  {formatTxAmount(t, i18n.language)}
                </Text>
              </Table.Td>
              <Table.Td>
                <Tooltip label="Действия">
                  <ActionIcon variant="subtle" size="sm" color="gray">
                    <IconDotsVertical size={14} />
                  </ActionIcon>
                </Tooltip>
              </Table.Td>
            </Table.Tr>
          ))}

          {isError && (
            <Table.Tr>
              <Table.Td colSpan={5} ta="center" py="xl">
                <Text c="red.5">Не удалось загрузить операции</Text>
              </Table.Td>
            </Table.Tr>
          )}

          {!isLoading && !isError && transactions.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={5} ta="center" py="xl">
                <Text c="dimmed">Ничего не найдено</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Box>
  )
}
