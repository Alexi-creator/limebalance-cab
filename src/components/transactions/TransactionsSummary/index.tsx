import type { TransactionsSummary as Summary, TransactionType } from "@appTypes/transaction"
import { Group, Text, Tooltip } from "@mantine/core"
import { IconHelpCircle } from "@tabler/icons-react"
import { formatCurrency } from "@utils/formatCurrency"
import { useTranslation } from "react-i18next"

interface Props {
  summary: Summary
  /** Active type filter: with `income`/`expense` we show only the relevant amount. */
  type?: TransactionType
}

/**
 * Totals for the transactions shown on the current table page (recalculated on
 * page/page-size change), in the user's base currency. `null` → "—".
 * The net total is shown only without a type filter — otherwise it equals one of the amounts.
 */
export function TransactionsSummary({ summary, type }: Props) {
  const { t, i18n } = useTranslation()

  // Selection total in the base currency; "—" if exchange rates are unavailable (the backend returned null).
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
