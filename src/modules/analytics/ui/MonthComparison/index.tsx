import { Box, Group, Paper, SegmentedControl, Skeleton, Stack, Table, Text } from "@mantine/core"
import { MonthPickerInput } from "@mantine/dates"
import type { Locale } from "date-fns"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useTranslation } from "react-i18next"
import { EXPENSE_COLOR, INCOME_COLOR } from "@/shared/config/chartColors"
import { formatCurrency } from "@/shared/lib/formatCurrency"
import { MAX_COMPARED_MONTHS } from "../../config"
import type { CategoryBreakdown, StatKind } from "../../hooks/useCategoryBreakdown"
import { monthDate, useMonthComparison } from "../../hooks/useMonthComparison"
import { DeltaBadge } from "../DeltaBadge"
import classes from "./styles.module.css"

interface Props {
  /** `YYYY-MM`, ascending. */
  months: string[]
  onMonthsChange: (months: string[]) => void
  /** Shared with the details list — the expense/income switch and the category filter. */
  breakdown: CategoryBreakdown
  locale?: Locale
}

/** Change of the last compared month vs the first, %; null — nothing to compare to. */
function changePct(first: number | null, last: number | null): number | null {
  if (!first || last == null) return null
  return Math.round(((last - first) / first) * 100)
}

/**
 * Category totals of a few chosen months side by side (not necessarily consecutive — "March vs
 * June vs September"), with the change from the first month to the last. Cells are tinted by
 * the amount relative to the rest of the row, so a spike reads without reading the numbers.
 */
export function MonthComparison({ months, onMonthsChange, breakdown: b, locale = enUS }: Props) {
  const { t, i18n } = useTranslation()
  const { rows, totals, baseCurrency, isLoading, isError } = useMonthComparison(months, b)
  const money = (n: number | null) =>
    n == null ? "—" : formatCurrency(n, i18n.language, baseCurrency)
  const isExpense = b.kind === "expense"
  const tint = isExpense ? EXPENSE_COLOR : INCOME_COLOR
  const monthLabel = (m: string) => format(monthDate(m), "LLL yyyy", { locale })
  const firstLabel = months.length ? monthLabel(months[0]) : ""
  const hint = (first: number | null) => `${firstLabel}: ${money(first)}`

  // tinted by where the amount sits between the row's min and max: the peak month stands out,
  // equal months stay plain
  const cellStyle = (value: number | null, rowMin: number, rowMax: number) => {
    if (value == null || rowMax <= rowMin) return undefined
    const pct = Math.round(((value - rowMin) / (rowMax - rowMin)) * 22)
    if (pct === 0) return undefined
    return { background: `color-mix(in srgb, ${tint} ${pct}%, transparent)` }
  }

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
            {t("analytics.compare_title")}
          </Text>
          <Text size="xs" c="dimmed">
            {b.isFiltered
              ? t("analytics.selected_total", { count: b.selected.length })
              : t("analytics.compare_all_categories")}
          </Text>
        </Stack>
        <Group gap="sm" wrap="wrap" align="center">
          <MonthPickerInput
            type="multiple"
            size="xs"
            aria-label={t("analytics.compare_months")}
            placeholder={t("analytics.compare_months")}
            locale={i18n.language}
            valueFormat="MMM YYYY"
            value={months.map((m) => `${m}-01`)}
            onChange={(next) =>
              // Mantine gives `YYYY-MM-DD` strings; keep the newest picks when over the limit
              onMonthsChange(
                [...next]
                  .map((d) => d.slice(0, 7))
                  .sort()
                  .slice(-MAX_COMPARED_MONTHS),
              )
            }
            maxDate={new Date()}
            w={260}
          />
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

      {isLoading ? (
        <Stack gap="xs" p="md">
          <Skeleton h={32} radius="sm" />
          <Skeleton h={32} radius="sm" />
          <Skeleton h={32} radius="sm" />
        </Stack>
      ) : isError ? (
        <Text c="red.5" ta="center" p="xl">
          {t("analytics.load_error")}
        </Text>
      ) : rows.length === 0 ? (
        <Text c="dimmed" ta="center" p="xl">
          {t(b.isFiltered ? "analytics.filter_empty" : "analytics.details_empty")}
        </Text>
      ) : (
        <Table.ScrollContainer minWidth={180 + months.length * 120 + 100} type="native">
          <Table verticalSpacing="xs" horizontalSpacing="md" className={classes.table}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th className={classes.sticky}>{t("common.category")}</Table.Th>
                {months.map((m) => (
                  <Table.Th key={m} ta="right">
                    {monthLabel(m)}
                  </Table.Th>
                ))}
                {months.length > 1 && <Table.Th ta="right">{t("analytics.col_change")}</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row) => {
                const values = row.totals.map((v) => v ?? 0)
                const rowMin = Math.min(...values)
                const rowMax = Math.max(...values)
                const first = row.totals[0]
                const last = row.totals[row.totals.length - 1]
                return (
                  <Table.Tr key={row.key}>
                    <Table.Td className={classes.sticky}>
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
                      </Group>
                    </Table.Td>
                    {row.totals.map((v, i) => (
                      <Table.Td
                        key={months[i]}
                        ta="right"
                        ff="monospace"
                        c={v ? undefined : "dimmed"}
                        style={cellStyle(v, rowMin, rowMax)}
                      >
                        {money(v)}
                      </Table.Td>
                    ))}
                    {months.length > 1 && (
                      <Table.Td ta="right">
                        <DeltaBadge
                          pct={changePct(first, last)}
                          isExpense={isExpense}
                          hint={hint(first)}
                        />
                      </Table.Td>
                    )}
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
            <Table.Tfoot>
              <Table.Tr>
                <Table.Th className={classes.sticky}>{t("analytics.total")}</Table.Th>
                {totals.map((v, i) => (
                  <Table.Th key={months[i]} ta="right" ff="monospace">
                    {money(v)}
                  </Table.Th>
                ))}
                {months.length > 1 && (
                  <Table.Th ta="right">
                    <DeltaBadge
                      pct={changePct(totals[0], totals[totals.length - 1])}
                      isExpense={isExpense}
                      hint={hint(totals[0])}
                    />
                  </Table.Th>
                )}
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </Table.ScrollContainer>
      )}
    </Paper>
  )
}
