import { Box, Group, Paper, Stack, Text } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { formatCurrency } from "@/shared/lib/formatCurrency"
import type { CategoryBreakdown } from "../../hooks/useCategoryBreakdown"

const SIZE = 140
const R = 55
const STROKE = 15
const C = SIZE / 2
const CIRC = 2 * Math.PI * R

interface Props {
  /** Shared with the details list — same rows, colors and hovered category. */
  breakdown: CategoryBreakdown
  subtitle: string
}

/**
 * Donut of category shares for the details list's expense/income switch. It has no legend or
 * tooltip of its own: the details list is the legend (hovering a row highlights its slice and
 * back), and the hovered category's amount is shown in the hole. A click on a slice opens the
 * category in the list.
 */
export function CategoryDonut({ breakdown: b, subtitle }: Props) {
  const { t, i18n } = useTranslation()
  const isExpense = b.kind === "expense"
  const slices = b.rows.filter((r) => r.pct)
  const active = b.rows.find((r) => r.key === b.activeKey)
  const money = (n: number) => formatCurrency(n, i18n.language, b.baseCurrency)
  const kindLabel = t(isExpense ? "common.expense_plural" : "common.income_plural")
  const centerValue = money(active ? (active.total ?? 0) : b.sum)
  let offset = 0

  return (
    <Paper h="100%" style={{ display: "flex", flexDirection: "column" }}>
      <Stack
        gap={2}
        p="md"
        style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
      >
        <Text fw={600} size="sm">
          {t(isExpense ? "analytics.expenses_by_category" : "analytics.incomes_by_category")}
        </Text>
        <Text size="xs" c="dimmed">
          {subtitle}
        </Text>
      </Stack>
      <Group justify="center" align="center" p="md" style={{ flex: 1 }}>
        {slices.length === 0 ? (
          <Text c="dimmed" size="sm" ta="center">
            {t("analytics.details_empty")}
          </Text>
        ) : (
          <Box pos="relative" w={SIZE} h={SIZE}>
            <svg
              width={SIZE}
              height={SIZE}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              role="img"
              aria-label={kindLabel}
              onMouseLeave={() => b.setActiveKey(null)}
            >
              {slices.map((s) => {
                const pct = s.pct ?? 0
                const len = (pct / 100) * CIRC
                const off = (offset / 100) * CIRC
                offset += pct
                const isActive = b.activeKey === s.key
                return (
                  // biome-ignore lint/a11y/noStaticElementInteractions: slice hover/click mirrors the list rows
                  <circle
                    key={s.key}
                    cx={C}
                    cy={C}
                    r={R}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={isActive ? STROKE + 5 : STROKE}
                    strokeDasharray={`${len} ${CIRC - len}`}
                    strokeDashoffset={-off}
                    transform={`rotate(-90 ${C} ${C})`}
                    opacity={b.activeKey && !isActive ? 0.3 : 1}
                    style={{ cursor: "pointer", transition: "opacity 120ms, stroke-width 120ms" }}
                    onMouseEnter={() => b.setActiveKey(s.key)}
                    onClick={() => b.toggle(s.key)}
                  />
                )
              })}
            </svg>
            {/* HTML center: wraps long category names, unlike SVG text */}
            <Box
              pos="absolute"
              style={{
                inset: STROKE + 8,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              {/* long amounts ("1 234 567 ₽") drop a size to fit the ~95px hole */}
              <Text ff="monospace" fw={600} size={centerValue.length > 9 ? "xs" : "sm"} lh={1.2}>
                {centerValue}
              </Text>
              <Text size="xs" c="dimmed" lh={1.2} lineClamp={2}>
                {active ? active.name : kindLabel.toLocaleLowerCase(i18n.language)}
              </Text>
            </Box>
          </Box>
        )}
      </Group>
    </Paper>
  )
}
