import type { Transaction } from "@appTypes/transaction"
import { dateFnsLocales } from "@i18n/languages.ts"
import { enUS } from "date-fns/locale"
import { DataTable } from "mantine-datatable"
import { useTranslation } from "react-i18next"
import { PAGE_SIZE_OPTIONS } from "../config"
import { getNetTotal } from "../helpers"
import { getTransactionColumns } from "./settings"

interface Props {
  transactions: Transaction[]
  /** Всего записей под фильтры (для пагинации). */
  total: number
  page: number
  onPageChange: (page: number) => void
  /** Текущий размер страницы и его смена (селектор 20/50/100). */
  recordsPerPage: number
  onRecordsPerPageChange: (limit: number) => void
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
  recordsPerPage,
  onRecordsPerPageChange,
  fetching,
  isError,
}: Props) {
  const { i18n } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS

  return (
    <DataTable<Transaction>
      records={isError ? [] : transactions}
      columns={getTransactionColumns(locale, i18n.language, getNetTotal(transactions))}
      pinLastColumn
      idAccessor={(t) => `${t.type}-${t.id}`}
      fetching={fetching}
      page={page}
      onPageChange={onPageChange}
      totalRecords={total}
      recordsPerPage={recordsPerPage}
      recordsPerPageOptions={PAGE_SIZE_OPTIONS}
      onRecordsPerPageChange={onRecordsPerPageChange}
      recordsPerPageLabel="Строк на странице"
      noRecordsText={isError ? "Не удалось загрузить операции" : "Ничего не найдено"}
      striped
      highlightOnHover
      verticalSpacing="sm"
      minHeight={160}
      style={{ flex: 1, minHeight: 0 }}
    />
  )
}
