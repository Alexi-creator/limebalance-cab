import { Badge, Tooltip } from "@mantine/core"

/**
 * Change vs the previous period: "↑ 20%" colored by whether it is good news — spending more
 * is red, earning more is green. The tooltip gives the previous period's amount.
 */
export function DeltaBadge({
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
