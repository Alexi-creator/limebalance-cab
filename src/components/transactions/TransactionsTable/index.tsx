import type { Transaction } from "@appTypes/transaction"
import { dateFnsLocales } from "@i18n/languages.ts"
import { enUS } from "date-fns/locale"
import { DataTable } from "mantine-datatable"
import { useTranslation } from "react-i18next"
import { PAGE_LIMIT } from "../config"
import { getTransactionColumns } from "./settings"

interface Props {
  transactions: Transaction[]
  /** Всего записей под фильтры (для пагинации). */
  total: number
  page: number
  onPageChange: (page: number) => void
  /** Идёт загрузка/смена страницы — показывается оверлей. */
  fetching: boolean
  isError: boolean
}

/** Таблица операций на `mantine-datatable`: серверная пагинация, состояния загрузки/пусто. */
export function TransactionsTable({
  transactions,
  total,
  page,
  onPageChange,
  fetching,
  isError,
}: Props) {
  const { i18n } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS

  return (
    <DataTable<Transaction>
      records={isError ? [] : transactions}
      columns={getTransactionColumns(locale, i18n.language)}
      idAccessor={(t) => `${t.type}-${t.id}`}
      fetching={fetching}
      page={page}
      onPageChange={onPageChange}
      totalRecords={total}
      recordsPerPage={PAGE_LIMIT}
      noRecordsText={isError ? "Не удалось загрузить операции" : "Ничего не найдено"}
      striped
      highlightOnHover
      verticalSpacing="sm"
      minHeight={160}
      style={{ flex: 1, minHeight: 0 }}
    />
  )
}
