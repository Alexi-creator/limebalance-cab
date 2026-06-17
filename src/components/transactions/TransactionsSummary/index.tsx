import type { TransactionsSummary as Summary, TransactionType } from "@appTypes/transaction"
import { Group, Text, Tooltip } from "@mantine/core"
import { IconHelpCircle } from "@tabler/icons-react"
import { formatCurrency } from "@utils/formatCurrency"
import { useTranslation } from "react-i18next"

interface Props {
  summary: Summary
  /** Активный фильтр типа: при `income`/`expense` показываем только релевантную сумму. */
  type?: TransactionType
}

/**
 * Итоги по всей выборке операций (с учётом фильтров, не только текущая страница),
 * приведённые к базовой валюте пользователя. `null` (курсы недоступны) → «—».
 * «Итог» (net) показываем только без фильтра по типу — иначе он равен одной из сумм.
 */
export function TransactionsSummary({ summary, type }: Props) {
  const { t, i18n } = useTranslation()

  // Итог по выборке в базовой валюте; "—", если курсы недоступны (бэк вернул null).
  const fmt = (v: number | null | undefined) =>
    v == null ? "—" : formatCurrency(v, i18n.language, summary.baseCurrency)

  return (
    <Group gap="sm" wrap="nowrap">
      {type !== "income" && (
        <Text size="sm" c="red.6">
          {t("common.expense")}: {fmt(summary.expense)}
        </Text>
      )}
      {type !== "expense" && (
        <Text size="sm" c="teal.6">
          {t("common.income")}: {fmt(summary.income)}
        </Text>
      )}
      {!type && (
        <Text size="sm" fw={600}>
          {t("transactions.summary_total")}: {fmt(summary.net)}
        </Text>
      )}

      <Tooltip multiline w={250} withArrow label={t("transactions.summary_hint")}>
        <IconHelpCircle
          size={15}
          style={{ color: "var(--mantine-color-dimmed)", cursor: "help", flexShrink: 0 }}
        />
      </Tooltip>
    </Group>
  )
}
