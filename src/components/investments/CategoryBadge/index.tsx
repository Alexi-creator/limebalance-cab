import { Badge, Tooltip } from "@mantine/core"
import { useTranslation } from "react-i18next"

const CATEGORY_BADGE: Record<string, { color: string; key: string }> = {
  linear: { color: "blue", key: "investments.cat_linear" },
  spot: { color: "teal", key: "investments.cat_spot" },
  manual: { color: "gray", key: "investments.cat_manual" },
}

/**
 * linear = futures, spot = assembled by the backend from buys/sells (FIFO — a sell
 * closes the oldest buys, the entry price is volume-weighted, hence the tooltip),
 * manual = entered by the user. Unknown future categories fall back to a plain badge.
 */
export function CategoryBadge({ category }: { category: string }) {
  const { t } = useTranslation()
  const badge = CATEGORY_BADGE[category]

  if (!badge) {
    return (
      <Badge variant="light" color="gray" size="sm" tt="none">
        {category}
      </Badge>
    )
  }

  const element = (
    <Badge variant="light" color={badge.color} size="sm">
      {t(badge.key)}
    </Badge>
  )

  if (category !== "spot") return element

  return (
    <Tooltip label={t("investments.spot_fifo_hint")} multiline maw={320}>
      {element}
    </Tooltip>
  )
}
