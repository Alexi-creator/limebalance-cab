import { ActionIcon, Badge, Group, Paper, Text, Tooltip } from "@mantine/core"
import { IconInfoCircle, IconRefresh } from "@tabler/icons-react"
import type { ReactNode } from "react"

/** A caption line that can carry an explanation of its own. */
export interface KpiSubLine {
  text: string
  /** Shown behind a small info icon at the end of the line. For a figure that is correct but not
   *  self-evident — where it came from, or why it is not part of the value above. */
  hint?: string
}

/** Caption under the value: one line, or several — each optionally explained. */
export type KpiSub = string | KpiSubLine | (string | KpiSubLine)[]

interface Props {
  /** Metric title (e.g. "Income for the month") */
  label: string
  /** Main value displayed in large font */
  value: string
  /** Caption under the value. An array renders one line per entry — used by the balance card,
   *  which has to say both what is held in each currency and what is out working. */
  sub?: KpiSub
  /** Attention marker for the card's top-right controls, next to the trend badge and the refresh
   *  button. Lives in the header rather than under the value so that a card with something to say
   *  stays exactly as tall as the cards beside it. */
  alert?: ReactNode
  /** Percentage change: positive — green badge ↑, negative — red ↓ */
  trend?: number
  /** Color of the main value (CSS variable or Mantine color) */
  accent?: string
  /** If provided — shows a refresh button */
  onRefresh?: () => void
  /** Enables the loading animation on the refresh button */
  isRefreshing?: boolean
}

/**
 * KPI metric card for the dashboard.
 * Displays a title, large value, optional caption, trend badge, and refresh button.
 */
export function KpiCard({
  label,
  value,
  sub,
  alert,
  trend,
  accent,
  onRefresh,
  isRefreshing,
}: Props) {
  const subLines = (Array.isArray(sub) ? sub : sub ? [sub] : []).map((line) =>
    typeof line === "string" ? { text: line } : line,
  )

  return (
    // Full height of the grid cell, so a card with an extra caption line doesn't stick out of the row.
    <Paper p="lg" h="100%">
      {/* Always as tall as the controls (ActionIcon sm), present or not — otherwise the value sits
          lower in a card with a refresh button than in one without, and the row stops lining up. */}
      <Group justify="space-between" align="flex-start" mih="1.375rem">
        <Text size="xs" c="dimmed">
          {label}
        </Text>
        <Group gap={6}>
          {alert}
          {trend != null && (
            <Badge color={trend > 0 ? "green" : "red"} variant="light" size="sm">
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </Badge>
          )}
          {onRefresh && (
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              loading={isRefreshing}
              onClick={onRefresh}
            >
              <IconRefresh size={14} />
            </ActionIcon>
          )}
        </Group>
      </Group>
      <Text ff="monospace" fz={28} fw={500} mt="sm" c={accent} style={{ letterSpacing: "-0.02em" }}>
        {value}
      </Text>
      {subLines.map(({ text, hint }, i) => (
        <Text key={text} size="xs" c="dimmed" mt={i === 0 ? 4 : 2}>
          {text}
          {hint && (
            <Tooltip
              label={hint}
              multiline
              w={280}
              withArrow
              events={{ hover: true, focus: true, touch: true }}
            >
              {/* Inline, inside the sentence rather than beside it: a caption that wraps to two
                  lines would otherwise leave the icon stranded at the far right of the card.
                  A button and not a bare icon, so the explanation is reachable by keyboard and by
                  tap and not only by hovering a mouse. */}
              <ActionIcon
                variant="subtle"
                color="gray"
                size="xs"
                aria-label={hint}
                ml={4}
                display="inline-flex"
                style={{ verticalAlign: "text-bottom" }}
              >
                <IconInfoCircle size={13} />
              </ActionIcon>
            </Tooltip>
          )}
        </Text>
      ))}
    </Paper>
  )
}
