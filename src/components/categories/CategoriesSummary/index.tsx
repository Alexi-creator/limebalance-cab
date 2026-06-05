import { Box, Group, Paper, Stack, Text, Tooltip } from "@mantine/core"
import { formatCurrency } from "@utils/formatCurrency"
import { useTranslation } from "react-i18next"
import { baseAmount, isApprox, pluralRu } from "../helpers"
import type { DisplayCategory } from "../types"

interface Props {
  list: DisplayCategory[]
  isExpense: boolean
}

/**
 * Сводка по категориям: сумма за всё время (в базовой валюте) и горизонтальная шкала
 * долей по категориям. Суммы из разных валют приводятся к базовой, поэтому помечаются «≈».
 */
export function CategoriesSummary({ list, isExpense }: Props) {
  const { i18n } = useTranslation()
  const language = i18n.language

  const totalBase = list.reduce((s, c) => s + baseAmount(c), 0)
  const totalCount = list.reduce((s, c) => s + c.count, 0)
  const baseCurrency = list.find((c) => c.baseCurrency)?.baseCurrency
  const approximate = list.some(isApprox)

  return (
    <Paper p="lg">
      <Group justify="space-between" mb="md" wrap="wrap">
        <Stack gap={2}>
          <Text size="xs" c="dimmed">
            {isExpense ? "Расход за всё время" : "Доход за всё время"}
          </Text>
          <Text ff="monospace" fz={24} fw={500} c={isExpense ? "red.5" : "green.5"}>
            {approximate ? "≈ " : ""}
            {isExpense ? "−" : "+"}
            {formatCurrency(totalBase, language, baseCurrency)}
          </Text>
        </Stack>
        <Text ff="monospace" size="xs" c="dimmed">
          {totalCount} {pluralRu(totalCount, ["операция", "операции", "операций"])} в {list.length}{" "}
          {pluralRu(list.length, ["категории", "категориях", "категориях"])}
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
