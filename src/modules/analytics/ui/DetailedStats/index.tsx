import {
  Accordion,
  Badge,
  Box,
  Group,
  Paper,
  Progress,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core"
import type { Locale } from "date-fns"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { formatCurrency } from "@/shared/lib/formatCurrency"
import type { CategoryBreakdown, StatKind } from "../../hooks/useCategoryBreakdown"
import { formatPct } from "../../lib/helpers"
import classes from "./styles.module.css"

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
 * Detailed period stat from `/stat` as a table — per-category operations count, share and color
 * (the donut's legend), the previous period's total and the change vs it, the amount (base
 * currency), and the underlying transactions (original currencies) on expand. Honors the page's
 * category filter: the header and the totals row sum up only the picked categories.
 */
export function DetailedStats({ breakdown: b, subtitle, locale = enUS }: Props) {
  const { t, i18n } = useTranslation()
  const money = (n: number, currency?: string | null) => formatCurrency(n, i18n.language, currency)
  const isExpense = b.kind === "expense"
  const prevHint = (n: number | null) =>
    t("analytics.prev_period_value", { amount: money(n ?? 0, b.baseCurrency) })
  const opsCount = b.visibleRows.reduce((acc, r) => acc + r.items.length, 0)

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
        <Group gap="lg" wrap="wrap">
          {b.visibleTotal != null && !b.isLoading && (
            // the combined total of what the table shows — all categories, or just the picked ones
            <Stack gap={2} align="flex-end">
              <Text size="xs" c="dimmed" lh={1.3} ta="right">
                {b.isFiltered
                  ? `${t("analytics.selected_total", { count: b.visibleRows.length })} · ${t(
                      "analytics.share_of_total",
                      { pct: formatPct(b.visiblePct) },
                    )}`
                  : t("analytics.total")}
              </Text>
              <Text ff="monospace" fw={700} size="lg" lh={1.3}>
                {money(b.visibleTotal, b.baseCurrency)}
              </Text>
            </Stack>
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
      ) : b.visibleRows.length === 0 ? (
        <Text c="dimmed" ta="center" p="xl">
          {t(b.isFiltered ? "analytics.filter_empty" : "analytics.details_empty")}
        </Text>
      ) : (
        <>
          <Box className={`${classes.grid} ${classes.outside} ${classes.head}`}>
            <ColumnLabel>{t("common.category")}</ColumnLabel>
            <ColumnLabel className={`${classes.num} ${classes.wide}`}>
              {t("analytics.col_operations")}
            </ColumnLabel>
            <ColumnLabel className={classes.wide}>{t("analytics.col_share")}</ColumnLabel>
            <ColumnLabel className={`${classes.num} ${classes.wide}`}>
              {t("analytics.col_prev")}
            </ColumnLabel>
            <ColumnLabel className={classes.num}>{t("analytics.col_change")}</ColumnLabel>
            <ColumnLabel className={classes.num}>{t("analytics.col_amount")}</ColumnLabel>
          </Box>

          <Accordion multiple chevronPosition="right" value={b.opened} onChange={b.setOpened}>
            {b.visibleRows.map((row) => (
              <Accordion.Item
                key={row.key}
                value={row.key}
                onMouseEnter={() => b.setActiveKey(row.key)}
                onMouseLeave={() => b.setActiveKey(null)}
                bg={b.activeKey === row.key ? "var(--mantine-color-default-hover)" : undefined}
              >
                {/* a category that dropped to zero has no operations to open */}
                <Accordion.Control disabled={row.items.length === 0}>
                  <Box className={classes.grid} pr="sm">
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
                      {/* on phones the operations column is hidden — keep the count by the name */}
                      <Badge
                        size="sm"
                        variant="light"
                        color="gray"
                        ff="monospace"
                        className={classes.narrow}
                        style={{ flexShrink: 0 }}
                      >
                        {row.items.length}
                      </Badge>
                    </Group>
                    <Text
                      ff="monospace"
                      size="sm"
                      c="dimmed"
                      className={`${classes.num} ${classes.wide}`}
                    >
                      {row.items.length}
                    </Text>
                    <Group gap="xs" wrap="nowrap" className={classes.wide}>
                      <Progress
                        value={row.pct ?? 0}
                        color={row.color}
                        size="sm"
                        radius="xl"
                        style={{ flex: 1 }}
                      />
                      <Text ff="monospace" size="xs" c="dimmed" w={36} ta="right">
                        {formatPct(row.pct)}
                      </Text>
                    </Group>
                    <Text
                      ff="monospace"
                      size="sm"
                      c="dimmed"
                      className={`${classes.num} ${classes.wide}`}
                    >
                      {row.prev != null ? money(row.prev, b.baseCurrency) : "—"}
                    </Text>
                    <Box className={classes.num}>
                      <DeltaBadge
                        pct={row.deltaPct}
                        isExpense={isExpense}
                        hint={prevHint(row.prev)}
                      />
                    </Box>
                    <Stack gap={0} align="flex-end">
                      <Text ff="monospace" size="sm" lh={1.3}>
                        {row.total != null ? money(row.total, b.baseCurrency) : "—"}
                      </Text>
                      <Text ff="monospace" size="xs" c="dimmed" lh={1.3} className={classes.narrow}>
                        {formatPct(row.pct)}
                      </Text>
                    </Stack>
                  </Box>
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

          {/* totals of what is shown, column by column — incl. the change vs the previous period */}
          <Box className={`${classes.grid} ${classes.outside} ${classes.foot}`}>
            <Text size="sm" fw={600}>
              {t("analytics.total")}
            </Text>
            <Text ff="monospace" size="sm" fw={600} className={`${classes.num} ${classes.wide}`}>
              {opsCount}
            </Text>
            <Text ff="monospace" size="xs" c="dimmed" ta="right" className={classes.wide}>
              {formatPct(b.visiblePct)}
            </Text>
            <Text ff="monospace" size="sm" c="dimmed" className={`${classes.num} ${classes.wide}`}>
              {b.visiblePrev != null ? money(b.visiblePrev, b.baseCurrency) : "—"}
            </Text>
            <Box className={classes.num}>
              <DeltaBadge
                pct={b.visibleDeltaPct}
                isExpense={isExpense}
                hint={prevHint(b.visiblePrev)}
              />
            </Box>
            <Text ff="monospace" size="sm" fw={600} className={classes.num}>
              {b.visibleTotal != null ? money(b.visibleTotal, b.baseCurrency) : "—"}
            </Text>
          </Box>
        </>
      )}
    </Paper>
  )
}

function ColumnLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Text size="xs" c="dimmed" fw={500} tt="uppercase" className={className} truncate>
      {children}
    </Text>
  )
}
