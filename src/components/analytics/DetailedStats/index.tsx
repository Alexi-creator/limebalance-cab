import { getExpensesStat } from "@api/expenses"
import { getIncomesStat } from "@api/incomes"
import type { DetailedStat } from "@appTypes/stat"
import { EMOJI_PALETTE } from "@components/categories/config"
import { EXPENSE_STALE_TIME, expenseKeys } from "@constants/queries/expenses"
import { INCOME_STALE_TIME, incomeKeys } from "@constants/queries/incomes"
import {
  Accordion,
  Badge,
  Group,
  Paper,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { formatCurrency } from "@utils/formatCurrency"
import type { Locale } from "date-fns"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useState } from "react"
import { useTranslation } from "react-i18next"

const key = (d: Date) => format(d, "yyyy-MM-dd")

type StatKind = "expense" | "income"

interface Props {
  from: Date
  to: Date
  /** Human-readable period label shown under the title. */
  subtitle: string
  locale?: Locale
}

/**
 * Detailed period stat from `/stat` — everything in one panel: the overall total,
 * per-category totals (base currency) and the underlying transactions (original currencies).
 */
export function DetailedStats({ from, to, subtitle, locale = enUS }: Props) {
  const { t, i18n } = useTranslation()
  const [kind, setKind] = useState<StatKind>("expense")
  const money = (n: number, currency?: string | null) => formatCurrency(n, i18n.language, currency)

  const isExpense = kind === "expense"
  const { data, isLoading, isError } = useQuery<DetailedStat>({
    queryKey: isExpense
      ? expenseKeys.stat(key(from), key(to))
      : incomeKeys.stat(key(from), key(to)),
    queryFn: () => (isExpense ? getExpensesStat(from, to) : getIncomesStat(from, to)),
    staleTime: isExpense ? EXPENSE_STALE_TIME : INCOME_STALE_TIME,
  })

  // categories by descending total (base currency); without exchange rates (null) — at the end
  const categories = [...(data?.categories ?? [])].sort((a, b) => (b.total ?? -1) - (a.total ?? -1))

  return (
    <Paper>
      <Group
        justify="space-between"
        p="md"
        wrap="wrap"
        style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
      >
        <Stack gap={0}>
          <Text fw={600} size="sm">
            {t("analytics.details_title")}
          </Text>
          <Text size="xs" c="dimmed">
            {subtitle}
          </Text>
        </Stack>
        <Group gap="sm">
          {data?.total != null && (
            <Text ff="monospace" fw={600} size="sm">
              {money(data.total, data.baseCurrency)}
            </Text>
          )}
          <SegmentedControl
            size="xs"
            value={kind}
            onChange={(v) => setKind(v as StatKind)}
            data={[
              { value: "expense", label: t("common.expense_plural") },
              { value: "income", label: t("common.income_plural") },
            ]}
          />
        </Group>
      </Group>

      {isLoading ? (
        <Stack gap="xs" p="md">
          <Skeleton h={40} radius="sm" />
          <Skeleton h={40} radius="sm" />
          <Skeleton h={40} radius="sm" />
        </Stack>
      ) : isError ? (
        <Text c="red.5" ta="center" p="xl">
          {t("analytics.load_error")}
        </Text>
      ) : categories.length === 0 ? (
        <Text c="dimmed" ta="center" p="xl">
          {t("analytics.details_empty")}
        </Text>
      ) : (
        <Accordion multiple chevronPosition="right">
          {categories.map((cat, i) => (
            <Accordion.Item key={cat.category} value={cat.category}>
              <Accordion.Control>
                <Group justify="space-between" pr="sm" gap="xs">
                  <Group gap={8}>
                    <Text component="span">
                      {cat.emoji || EMOJI_PALETTE[i % EMOJI_PALETTE.length]}
                    </Text>
                    <Text size="sm" fw={500}>
                      {cat.category}
                    </Text>
                    <Badge size="sm" variant="light" color="gray" ff="monospace">
                      {cat.items.length}
                    </Badge>
                  </Group>
                  <Text ff="monospace" size="sm">
                    {cat.total != null ? money(cat.total, data?.baseCurrency) : "—"}
                  </Text>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap={6}>
                  {cat.items.map((item, j) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: stat items have no id in the payload
                    <Group key={j} justify="space-between" gap="xs" wrap="nowrap">
                      <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                        <Text size="xs" c="dimmed" w={52} style={{ flexShrink: 0 }}>
                          {format(item.date, "d MMM", { locale })}
                        </Text>
                        <Text size="sm" truncate>
                          {item.description}
                        </Text>
                      </Group>
                      <Text ff="monospace" size="sm" style={{ flexShrink: 0 }}>
                        {money(item.amount, item.currency)}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </Paper>
  )
}
