import { Box, Group, Paper, Stack, Text, Tooltip } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { formatCurrency } from "@/shared/lib/formatCurrency"
import { baseAmount, earliestDate, formatDay, isApprox } from "../../lib/helpers"
import type { DisplayCategory } from "../../model"

interface Props {
  list: DisplayCategory[]
  isExpense: boolean
}

/**
 * Category summary: all-time total (in the base currency) with the date it starts from and a
 * horizontal bar of category shares. Amounts from different currencies are converted to the base, so they are marked with "≈".
 */
export function CategoriesSummary({ list, isExpense }: Props) {
  const { t, i18n } = useTranslation()
  const language = i18n.language

  const totalBase = list.reduce((s, c) => s + baseAmount(c), 0)
  const totalCount = list.reduce((s, c) => s + c.count, 0)
  const baseCurrency = list.find((c) => c.baseCurrency)?.baseCurrency
  const approximate = list.some(isApprox)
  const since = earliestDate(list)

  return (
    <Paper p="lg">
      <Group justify="space-between" mb="md" wrap="wrap">
        <Stack gap={2}>
          <Text size="xs" c="dimmed">
            {isExpense ? t("categories.summary_expense") : t("categories.summary_income")}
            {since && <> · {t("categories.since", { date: formatDay(since, language) })}</>}
          </Text>
          <Text ff="monospace" fz={24} fw={500} c={isExpense ? "red.5" : "green.5"}>
            {approximate ? "≈ " : ""}
            {isExpense ? "−" : "+"}
            {formatCurrency(totalBase, language, baseCurrency)}
          </Text>
        </Stack>
        <Text ff="monospace" size="xs" c="dimmed">
          {t("categories.summary_count", {
            transactions: t("common.tx_count", { count: totalCount }),
            categories: t("categories.cat_count", { count: list.length }),
          })}
        </Text>
      </Group>
      <Box
        style={{
          display: "flex",
          height: 10,
          borderRadius: 99,
          overflow: "hidden",
          background: "var(--mantine-color-default-hover)",
        }}
      >
        {list
          .filter((c) => baseAmount(c) > 0)
          .sort((a, b) => baseAmount(b) - baseAmount(a))
          .map((c) => (
            <Tooltip
              key={c.id}
              label={`${c.name} · ${Math.round((baseAmount(c) / totalBase) * 100)}%`}
            >
              <Box style={{ flex: baseAmount(c), background: c.color }} />
            </Tooltip>
          ))}
      </Box>
    </Paper>
  )
}
