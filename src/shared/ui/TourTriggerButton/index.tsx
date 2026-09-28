import { ActionIcon, type ActionIconProps, Tooltip } from "@mantine/core"
import { IconHelpCircle } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

interface TourTriggerButtonProps {
  onClick: () => void
  /** `input-sm` etc. — matches the height of the inputs it sits next to, so a bottom-aligned
   *  filter row keeps the icon centered on the fields. */
  size?: ActionIconProps["size"]
}

/**
 * The "?" button that (re)starts a page's guided tour. Identical everywhere it's used,
 * including the `data-tour="tour-trigger"` marker — `useTour`'s first-visit hint and
 * every page tour target this exact selector.
 */
export function TourTriggerButton({ onClick, size }: TourTriggerButtonProps) {
  const { t } = useTranslation()
  return (
    <Tooltip label={t("tour.start")}>
      <ActionIcon
        variant="subtle"
        color="gray"
        size={size}
        onClick={onClick}
        aria-label={t("tour.start")}
        data-tour="tour-trigger"
      >
        <IconHelpCircle size={20} />
      </ActionIcon>
    </Tooltip>
  )
}
