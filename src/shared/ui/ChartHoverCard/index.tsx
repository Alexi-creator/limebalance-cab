import { Box, Group, Text } from "@mantine/core"

export interface ChartHoverRow {
  /** Series marker color; omitted — no marker. */
  color?: string
  label: string
  value: string
  /** Value text color (defaults to the regular text color). */
  valueColor?: string
}

interface Props {
  /** Header — the exact date / period of the hovered point. */
  title: string
  rows: ChartHoverRow[]
  /** Hovered point's X in px, relative to the `position: relative` chart container. */
  x: number
  /** Container width in px — the card flips to the left of the point in the right half. */
  containerWidth: number
  /** Distance from the container's top, px. */
  top?: number
}

/**
 * Hover card for the raw-SVG charts: exact date and exact amounts of the hovered point. It is
 * HTML (not SVG text), so it never gets clipped by the plot edges, and it sits beside the
 * crosshair rather than under the finger on touch screens.
 */
export function ChartHoverCard({ title, rows, x, containerWidth, top = 8 }: Props) {
  const flip = x > containerWidth / 2
  return (
    <Box
      style={{
        position: "absolute",
        top,
        left: flip ? undefined : x + 12,
        right: flip ? containerWidth - x + 12 : undefined,
        pointerEvents: "none",
        background: "var(--mantine-color-body)",
        border: "1px solid var(--mantine-color-default-border)",
        borderRadius: 8,
        padding: "6px 10px",
        boxShadow: "var(--mantine-shadow-sm)",
        whiteSpace: "nowrap",
        zIndex: 10,
      }}
    >
      <Text size="xs" c="dimmed" mb={4}>
        {title}
      </Text>
      {rows.map((r) => (
        <Group key={r.label} gap={6} wrap="nowrap" justify="space-between">
          <Group gap={6} wrap="nowrap">
            {r.color && <Box w={8} h={8} style={{ background: r.color, borderRadius: 2 }} />}
            <Text size="xs">{r.label}</Text>
          </Group>
          <Text size="xs" ff="monospace" fw={600} c={r.valueColor} pl="md">
            {r.value}
          </Text>
        </Group>
      ))}
    </Box>
  )
}
