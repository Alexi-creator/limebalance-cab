import {
  Accordion,
  Badge,
  Box,
  Group,
  Paper,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core"
import type { Locale } from "date-fns"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useTranslation } from "react-i18next"
import { formatCurrency } from "@/shared/lib/formatCurrency"
import type { CategoryBreakdown, StatKind } from "../../hooks/useCategoryBreakdown"
import { formatPct } from "../../lib/helpers"

/**
 * Change vs the previous period: "↑ 20%" colored by whether it is good news — spending more
 * is red, earning more is green. The tooltip gives the previous period's amount.
 */
function DeltaBadge({
  pct,
  isExpense,
  hint,
}: {
  pct: number | null
  isExpense: boolean
  hint: string
}) {
  if (pct == null || pct === 0) return null
  const up = pct > 0
  return (
    <Tooltip label={hint} withArrow>
      <Badge
        size="sm"
        variant="light"
        color={up === isExpense ? "red" : "green"}
        ff="monospace"
        style={{ flexShrink: 0 }}
      >
        {up ? "↑" : "↓"} {Math.abs(pct)}%
      </Badge>
    </Tooltip>
  )
}

interface Props {
  /** Shared with the category donut — same rows, colors and hovered category. */
  breakdown: CategoryBreakdown
  /** Human-readable period label shown under the title. */
  subtitle: string
  locale?: Locale
}

/**
 * Detailed period stat from `/stat` — the overall total, per-category totals (base currency)
 * with their share and color (the donut's legend), the change vs the previous period, and the
 * underlying transactions (original currencies).
 */
export function DetailedStats({ breakdown: b, subtitle, locale = enUS }: Props) {
  const { t, i18n } = useTranslation()
  const money = (n: number, currency?: string | null) => formatCurrency(n, i18n.language, currency)
  const isExpense = b.kind === "expense"
  const prevHint = (n: number | null) =>
    t("analytics.prev_period_value", { amount: money(n ?? 0, b.baseCurrency) })

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
          {b.total != null && (
            <Group gap={6} wrap="nowrap">
              <Text ff="monospace" fw={600} size="sm">
                {money(b.total, b.baseCurrency)}
              </Text>
              <DeltaBadge pct={b.totalDeltaPct} isExpense={isExpense} hint={prevHint(b.prevSum)} />
            </Group>
          )}
          <SegmentedControl
            size="xs"
            value={b.kind}
            onChange={(v) => b.setKind(v as StatKind)}
            data={[
              { value: "expense", label: t("common.expense_plural") },
              { value: "income", label: t("common.income_plural") },
            ]}
          />
        </Group>
      </Group>

      {b.isLoading ? (
        <Stack gap="xs" p="md">
          <Skeleton h={40} radius="sm" />
          <Skeleton h={40} radius="sm" />
          <Skeleton h={40} radius="sm" />
        </Stack>
      ) : b.isError ? (
        <Text c="red.5" ta="center" p="xl">
          {t("analytics.load_error")}
        </Text>
      ) : b.rows.length === 0 ? (
        <Text c="dimmed" ta="center" p="xl">
          {t("analytics.details_empty")}
        </Text>
      ) : (
        <Accordion multiple chevronPosition="right" value={b.opened} onChange={b.setOpened}>
          {b.rows.map((row) => (
            <Accordion.Item
              key={row.key}
              value={row.key}
              onMouseEnter={() => b.setActiveKey(row.key)}
              onMouseLeave={() => b.setActiveKey(null)}
              bg={b.activeKey === row.key ? "var(--mantine-color-default-hover)" : undefined}
            >
              {/* a category that dropped to zero has no operations to open */}
              <Accordion.Control disabled={row.items.length === 0}>
                <Group justify="space-between" pr="sm" gap="xs" wrap="nowrap">
                  <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
                    <Box
                      w={8}
                      h={8}
                      style={{ background: row.color, borderRadius: 2, flexShrink: 0 }}
                    />
                    <Text component="span">{row.emoji}</Text>
                    <Text size="sm" fw={500} truncate>
                      {row.name}
                    </Text>
                    <Badge
                      size="sm"
                      variant="light"
                      color="gray"
                      ff="monospace"
                      style={{ flexShrink: 0 }}
                    >
                      {row.items.length}
                    </Badge>
                  </Group>
                  <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
                    <DeltaBadge
                      pct={row.deltaPct}
                      isExpense={isExpense}
                      hint={prevHint(row.prev)}
                    />
                    {/* share under the amount, not beside it — leaves the name room on phones; the
                        min width lines the change badges up in a column */}
                    <Stack gap={0} align="flex-end" miw={88}>
                      <Text ff="monospace" size="sm" lh={1.3}>
                        {row.total != null ? money(row.total, b.baseCurrency) : "—"}
                      </Text>
                      <Text ff="monospace" size="xs" c="dimmed" lh={1.3}>
                        {formatPct(row.pct)}
                      </Text>
                    </Stack>
                  </Group>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap={6}>
                  {row.items.map((item, j) => (
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
