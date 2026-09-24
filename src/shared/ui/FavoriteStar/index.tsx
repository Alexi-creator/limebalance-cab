import { ActionIcon } from "@mantine/core"
import { IconStar, IconStarFilled } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

interface Props {
  active: boolean
  onToggle: () => void
}

/**
 * Star toggle placed inside a dropdown option. Always visible (touch has no hover): outlined and
 * dimmed when off, filled lime when on. The click is kept from reaching the option, so starring
 * doesn't also select it; mousedown is prevented so the dropdown's search input keeps focus.
 */
export function FavoriteStar({ active, onToggle }: Props) {
  const { t } = useTranslation()

  return (
    <ActionIcon
      component="span"
      variant="subtle"
      color="gray"
      size="sm"
      tabIndex={-1}
      aria-label={t(active ? "common.remove_from_favorites" : "common.add_to_favorites")}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      style={{
        flexShrink: 0,
        // the subtle variant's own lime reads as near-white in the dark theme
        color: active ? "var(--mantine-primary-color-filled)" : "var(--mantine-color-dimmed)",
      }}
    >
      {active ? <IconStarFilled size={14} /> : <IconStar size={14} />}
    </ActionIcon>
  )
}
